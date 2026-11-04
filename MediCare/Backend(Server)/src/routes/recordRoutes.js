import express from 'express';
import { addMedicalRecord, getPatientRecords, getSingleRecord } from '../controllers/recordController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { validate, validateParams, validateQuery } from '../middlewares/validate.js';
import { addMedicalRecordSchema, patientIdParamSchema, idParamSchema, recordQuerySchema } from '../validators/schemas.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('doctor'), validate(addMedicalRecordSchema), addMedicalRecord);
// Authorized direct endpoint for authenticated patient identity (does not trust client-supplied ID)
router.get('/me', validateQuery(recordQuerySchema), getPatientRecords);
// Authorized single-record detailed view
router.get('/item/:id', validateParams(idParamSchema), getSingleRecord);
// Preserved parameterized patient record endpoint with permission check
router.get('/:patientId', validateParams(patientIdParamSchema), validateQuery(recordQuerySchema), getPatientRecords);

export default router;
