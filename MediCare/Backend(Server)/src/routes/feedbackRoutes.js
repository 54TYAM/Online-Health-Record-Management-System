import express from 'express';
import { createFeedback, getMyFeedback } from '../controllers/feedbackController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.post('/', protect, createFeedback);
router.get('/me', protect, getMyFeedback);

export default router;
