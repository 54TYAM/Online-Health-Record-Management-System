import express from 'express';
import { createFeedback, getMyFeedback } from '../controllers/feedbackController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createFeedbackSchema } from '../validators/schemas.js';

const router = express.Router();

router.post('/', protect, authorize('patient'), validate(createFeedbackSchema), createFeedback);
router.get('/me', protect, getMyFeedback);

export default router;
