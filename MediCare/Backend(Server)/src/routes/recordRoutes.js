import express from 'express';
import { addMedicalRecord, getPatientRecords } from '../controllers/recordController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('doctor'), addMedicalRecord);
router.get('/:patientId', getPatientRecords);

export default router;
