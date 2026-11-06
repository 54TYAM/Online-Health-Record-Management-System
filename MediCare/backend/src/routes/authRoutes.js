import express from 'express';
import { register, login, getMe, getDoctors, getDoctorProfile, updateProfile } from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { registerSchema, loginSchema, updateProfileSchema } from '../validators/schemas.js';

const router = express.Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.get('/me', protect, getMe);
router.get('/doctors', getDoctors); 
router.get('/profile', protect, getDoctorProfile);
router.put('/profile', protect, validate(updateProfileSchema), updateProfile); 

export default router;
