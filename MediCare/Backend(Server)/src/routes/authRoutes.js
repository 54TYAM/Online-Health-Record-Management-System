import express from 'express';
import { register, login, getMe, getDoctors, getDoctorProfile, updateProfile } from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/doctors', getDoctors); 
router.get('/profile', protect, getDoctorProfile);
router.put('/profile', protect, updateProfile); 

export default router;
