import express from 'express';
import {
  bookAppointment,
  getMyAppointments,
  updateAppointmentStatus,
  getDoctorAvailability,
  setDoctorAvailability,
  rescheduleAppointment
} from '../controllers/appointmentController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { validate, validateParams, validateQuery } from '../middlewares/validate.js';
import {
  bookAppointmentSchema,
  updateAppointmentStatusSchema,
  idParamSchema,
  doctorIdParamSchema,
  doctorAvailabilitySchema,
  rescheduleAppointmentSchema,
  availabilityQuerySchema
} from '../validators/schemas.js';

const router = express.Router();

router.use(protect);

// 1. Doctor availability configuration (Doctor only)
router.put(
  '/availability',
  authorize('doctor'),
  validate(doctorAvailabilitySchema),
  setDoctorAvailability
);

// 2. Query currently bookable availability for a doctor on a calendar date
router.get(
  '/availability/:doctorId',
  validateParams(doctorIdParamSchema),
  validateQuery(availabilityQuerySchema),
  getDoctorAvailability
);

// 3. Book a valid available slot (Patient only)
router.post(
  '/',
  authorize('patient'),
  validate(bookAppointmentSchema),
  bookAppointment
);

// 4. Retrieve caller's own appointments
router.get('/me', getMyAppointments);

// 5. Patient request to reschedule an appointment
router.post(
  '/:id/reschedule',
  authorize('patient'),
  validateParams(idParamSchema),
  validate(rescheduleAppointmentSchema),
  rescheduleAppointment
);

// 6. Manage appointment status transitions with role-based validation
router.put(
  '/:id/status',
  authorize('doctor', 'patient', 'admin'),
  validateParams(idParamSchema),
  validate(updateAppointmentStatusSchema),
  updateAppointmentStatus
);

export default router;
