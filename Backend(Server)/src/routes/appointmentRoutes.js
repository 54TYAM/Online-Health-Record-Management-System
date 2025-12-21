import express from 'express';
import { bookAppointment, getMyAppointments, updateAppointmentStatus } from '../controllers/appointmentController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('patient'), bookAppointment);
router.get('/me', getMyAppointments);
router.put('/:id/status', authorize('doctor', 'admin'), updateAppointmentStatus);

export default router;
