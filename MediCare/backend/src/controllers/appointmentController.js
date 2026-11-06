import Appointment from '../models/Appointment.js';
import Doctor, { defaultAvailableDays, defaultAvailableTimeSlots } from '../models/Doctor.js';

// Explicit date/timezone helpers:
// We treat appointment dates as calendar dates (YYYY-MM-DD).
// The normalized calendar day is extracted deterministically to prevent cross-timezone drift.
export const normalizeCalendarDate = (dateInput) => {
  if (!dateInput) return null;
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    return dateInput.trim();
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
};

export const getDayOfWeekName = (dateString) => {
  // Parsing YYYY-MM-DD with explicit UTC midnight ensures consistent weekday calculation
  const d = new Date(`${dateString}T00:00:00.000Z`);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return dayNames[d.getUTCDay()];
};

export const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Configure working days and time slots for the authenticated doctor
 * PUT /api/appointments/availability
 */
export const setDoctorAvailability = async (req, res) => {
  try {
    const { availableDays, availableTimeSlots } = req.body;

    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(403).json({ message: 'A verified doctor profile is required to configure availability' });
    }

    if (availableDays) doctor.availableDays = availableDays;
    if (availableTimeSlots) doctor.availableTimeSlots = availableTimeSlots;

    await doctor.save();

    res.json({
      message: 'Doctor availability schedule updated successfully',
      availableDays: doctor.availableDays,
      availableTimeSlots: doctor.availableTimeSlots
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get currently bookable availability for a specific doctor on a calendar date
 * GET /api/appointments/availability/:doctorId?date=YYYY-MM-DD
 */
export const getDoctorAvailability = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const requestedDate = req.query.date ? normalizeCalendarDate(req.query.date) : getTodayDateString();

    if (!requestedDate) {
      return res.status(400).json({ message: 'Invalid calendar date format (expected YYYY-MM-DD)' });
    }

    const doctor = await Doctor.findById(doctorId).populate('userId', 'name isBlocked');
    if (!doctor || !doctor.userId || doctor.userId.isBlocked) {
      return res.status(404).json({ message: 'Doctor not found or currently unavailable' });
    }

    const todayStr = getTodayDateString();
    if (requestedDate < todayStr) {
      return res.json({
        available: false,
        doctorId: doctor._id,
        date: requestedDate,
        dayOfWeek: getDayOfWeekName(requestedDate),
        allSlots: [],
        bookedSlots: [],
        availableSlots: [],
        reason: 'Appointments cannot be booked for past dates'
      });
    }

    const dayOfWeek = getDayOfWeekName(requestedDate);
    const doctorDays = doctor.availableDays?.length ? doctor.availableDays : defaultAvailableDays;
    const doctorSlots = doctor.availableTimeSlots?.length ? doctor.availableTimeSlots : defaultAvailableTimeSlots;

    // Verify if doctor accepts appointments on this day of week
    if (!doctorDays.includes(dayOfWeek)) {
      return res.json({
        available: false,
        doctorId: doctor._id,
        date: requestedDate,
        dayOfWeek,
        allSlots: doctorSlots,
        bookedSlots: [],
        availableSlots: [],
        reason: `Dr. ${doctor.userId?.name || 'Physician'} does not hold clinical hours on ${dayOfWeek}s`
      });
    }

    // Query active bookings for this doctor on this normalized calendar date
    const activeAppointments = await Appointment.find({
      doctorId: doctor._id,
      dateString: requestedDate,
      status: { $in: ['pending', 'approved', 'confirmed'] }
    }).select('time').lean();

    const bookedSlots = activeAppointments.map((a) => a.time).filter(Boolean);
    const availableSlots = doctorSlots.filter((slot) => !bookedSlots.includes(slot));

    res.json({
      available: availableSlots.length > 0,
      doctorId: doctor._id,
      doctorName: doctor.userId?.name,
      date: requestedDate,
      dayOfWeek,
      allSlots: doctorSlots,
      bookedSlots,
      availableSlots,
      reason: availableSlots.length === 0 ? 'All appointment slots for this date are currently booked' : undefined
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Book an appointment in a valid, unreserved slot
 * POST /api/appointments
 */
export const bookAppointment = async (req, res) => {
  const { doctorId, date, time } = req.body;

  try {
    const doctor = await Doctor.findById(doctorId).populate('userId', 'name isBlocked');
    if (!doctor || !doctor.userId || doctor.userId.isBlocked) {
      return res.status(404).json({ message: 'Doctor not found or currently unavailable' });
    }

    const dateString = normalizeCalendarDate(date);
    if (!dateString) {
      return res.status(400).json({ message: 'Invalid appointment date format (expected YYYY-MM-DD)' });
    }

    const todayStr = getTodayDateString();
    if (dateString < todayStr) {
      return res.status(400).json({ message: 'Appointment date cannot be in the past' });
    }

    const dayOfWeek = getDayOfWeekName(dateString);
    const doctorDays = doctor.availableDays?.length ? doctor.availableDays : defaultAvailableDays;
    const doctorSlots = doctor.availableTimeSlots?.length ? doctor.availableTimeSlots : defaultAvailableTimeSlots;

    // 1. Enforce doctor schedule day validation on server
    if (!doctorDays.includes(dayOfWeek)) {
      return res.status(400).json({
        message: `Dr. ${doctor.userId?.name || 'Physician'} does not accept appointments on ${dayOfWeek}s`
      });
    }

    // 2. Enforce doctor schedule time slot validation on server
    const sanitizedTime = (time || '').trim();
    if (!doctorSlots.includes(sanitizedTime)) {
      return res.status(400).json({
        message: `Selected slot (${sanitizedTime}) is outside Dr. ${doctor.userId?.name || 'Physician'}'s configured consultation hours`
      });
    }

    // 3. Prevent double booking of the doctor at the same specific time slot
    const slotTaken = await Appointment.exists({
      doctorId: doctor._id,
      dateString,
      time: sanitizedTime,
      status: { $in: ['pending', 'approved', 'confirmed'] }
    });

    if (slotTaken) {
      return res.status(400).json({ 
        message: 'This doctor already has a confirmed or pending booking at this time slot. Please choose another time.' 
      });
    }

    // 4. Prevent duplicate active appointments for the patient with this doctor on the same day
    const patientActiveConflict = await Appointment.exists({
      patientId: req.user._id,
      doctorId: doctor._id,
      dateString,
      status: { $in: ['pending', 'approved', 'confirmed'] }
    });

    if (patientActiveConflict) {
      return res.status(400).json({
        message: 'You already have an active appointment scheduled with this doctor on this day'
      });
    }

    // Normalized UTC Date representation
    const appointmentDate = new Date(`${dateString}T00:00:00.000Z`);

    try {
      // Created in pending state; genuine confirmation requires doctor acceptance
      const appointment = await Appointment.create({
        patientId: req.user._id,
        doctorId: doctor._id,
        date: appointmentDate,
        dateString,
        time: sanitizedTime,
        status: 'pending',
      });

      res.status(201).json(appointment);
    } catch (createErr) {
      // 5. Catch concurrency race condition via atomic partial unique index
      if (createErr.code === 11000) {
        return res.status(409).json({
          message: 'Simultaneous booking conflict: this slot was just reserved by another patient. Please select an alternate slot.'
        });
      }
      throw createErr;
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Reschedule an existing appointment subject to ownership and availability rules
 * POST /api/appointments/:id/reschedule
 */
export const rescheduleAppointment = async (req, res) => {
  const { date, time, reason } = req.body;

  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Only the owning patient can request rescheduling
    if (appointment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: You can only reschedule your own appointments' });
    }

    // Cannot reschedule terminal states
    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({
        message: `Cannot reschedule appointment that is already ${appointment.status}`
      });
    }

    const dateString = normalizeCalendarDate(date);
    if (!dateString) {
      return res.status(400).json({ message: 'Invalid calendar date format (expected YYYY-MM-DD)' });
    }

    const todayStr = getTodayDateString();
    if (dateString < todayStr) {
      return res.status(400).json({ message: 'Rescheduled date cannot be in the past' });
    }

    const doctor = await Doctor.findById(appointment.doctorId).populate('userId', 'name isBlocked');
    if (!doctor || !doctor.userId || doctor.userId.isBlocked) {
      return res.status(400).json({ message: 'Attending physician is currently unavailable' });
    }

    const dayOfWeek = getDayOfWeekName(dateString);
    const doctorDays = doctor.availableDays?.length ? doctor.availableDays : defaultAvailableDays;
    const doctorSlots = doctor.availableTimeSlots?.length ? doctor.availableTimeSlots : defaultAvailableTimeSlots;

    if (!doctorDays.includes(dayOfWeek)) {
      return res.status(400).json({
        message: `Dr. ${doctor.userId?.name || 'Physician'} does not accept appointments on ${dayOfWeek}s`
      });
    }

    const sanitizedTime = (time || '').trim();
    if (!doctorSlots.includes(sanitizedTime)) {
      return res.status(400).json({
        message: `Selected slot (${sanitizedTime}) is outside doctor's configured hours`
      });
    }

    // Check slot collision on the new target slot
    const slotConflict = await Appointment.exists({
      _id: { $ne: appointment._id },
      doctorId: doctor._id,
      dateString,
      time: sanitizedTime,
      status: { $in: ['pending', 'approved', 'confirmed'] }
    });

    if (slotConflict) {
      return res.status(409).json({
        message: 'The requested reschedule slot is already occupied. Please select an alternate slot.'
      });
    }

    const newAppointmentDate = new Date(`${dateString}T00:00:00.000Z`);

    // Record previous date and reset status to pending so the physician reviews and confirms
    appointment.rescheduledFrom = appointment.date;
    appointment.date = newAppointmentDate;
    appointment.dateString = dateString;
    appointment.time = sanitizedTime;
    appointment.status = 'pending';
    if (reason) {
      appointment.cancellationReason = `Rescheduled: ${reason}`;
    }

    await appointment.save();

    res.json({
      message: 'Appointment rescheduled successfully and submitted for physician confirmation',
      appointment
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'Simultaneous booking conflict on reschedule slot. Please select another slot.'
      });
    }
    res.status(500).json({ message: error.message });
  }
};

/**
 * Retrieve appointments for the authenticated caller
 * GET /api/appointments/me
 */
export const getMyAppointments = async (req, res) => {
  try {
    let appointments = [];
    if (req.user.role === 'patient') {
      appointments = await Appointment.find({ patientId: req.user._id })
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } })
        .sort({ date: -1 });
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (doctor) {
        appointments = await Appointment.find({ doctorId: doctor._id })
          .populate('patientId', 'name email')
          .sort({ date: -1 });
      }
    } else if (req.user.role === 'admin') {
      appointments = await Appointment.find({})
        .populate('patientId', 'name email')
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } })
        .sort({ date: -1 });
    }
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Manage appointment status transitions with role-based validation
 * PUT /api/appointments/:id/status
 */
export const updateAppointmentStatus = async (req, res) => {
  const { status, cancellationReason } = req.body;
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Completed and cancelled are terminal states
    if (['completed', 'cancelled'].includes(appointment.status) && req.user.role !== 'admin') {
      return res.status(400).json({ 
        message: `Invalid state transition: Appointment is already ${appointment.status} and cannot be altered` 
      });
    }

    // Role-based authorization & ownership checks
    if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (!doctor || appointment.doctorId.toString() !== doctor._id.toString()) {
        return res.status(403).json({ message: 'Forbidden: You cannot modify appointments assigned to another doctor' });
      }

      // Valid doctor state transitions
      // 'approved' and 'confirmed' are valid confirmations
      const validDoctorTransitions = {
        pending: ['approved', 'confirmed', 'cancelled'],
        approved: ['completed', 'cancelled'],
        confirmed: ['completed', 'cancelled'],
      };

      const allowedNext = validDoctorTransitions[appointment.status] || [];
      if (!allowedNext.includes(status)) {
        return res.status(400).json({
          message: `Invalid transition for doctor: cannot change status from '${appointment.status}' to '${status}'`
        });
      }
    } else if (req.user.role === 'patient') {
      if (appointment.patientId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Forbidden: You cannot modify another patient’s appointment' });
      }
      if (status !== 'cancelled') {
        return res.status(403).json({ message: 'Patients are only permitted to cancel their appointments' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Unauthorized role' });
    }

    appointment.status = status;
    if (cancellationReason) {
      appointment.cancellationReason = cancellationReason;
    }
    await appointment.save();
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
