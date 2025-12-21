import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';

export const bookAppointment = async (req, res) => {
  const { doctorId, date, time } = req.body;

  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const appointmentDate = new Date(date); 

    const appointment = await Appointment.create({
      patientId: req.user._id,
      doctorId: doctor._id, 
      date: appointmentDate,
      status: 'pending',
    });

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyAppointments = async (req, res) => {
  try {
    let appointments = [];
    if (req.user.role === 'patient') {
      appointments = await Appointment.find({ patientId: req.user._id })
        .populate('doctorId') 
        .populate({ path: 'doctorId', populate: { path: 'userId', select: 'name email' } });
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (doctor) {
        appointments = await Appointment.find({ doctorId: doctor._id })
          .populate('patientId', 'name email');
      } else {
        appointments = [];
      }
    } else {
      appointments = [];
    }
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    
    appointment.status = status;
    await appointment.save();
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
