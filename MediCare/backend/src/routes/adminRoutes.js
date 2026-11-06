import express from 'express';
import { 
  createDoctor, 
  getAllUsers, 
  toggleBlockUser, 
  getAuditLogs, 
  rejectAuditMutation 
} from '../controllers/adminController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { validate, validateParams } from '../middlewares/validate.js';
import { createDoctorAdminSchema, idParamSchema } from '../validators/schemas.js';

const router = express.Router();

// Strict RBAC: All administrative routes require valid session and admin role
router.use(protect); 
router.use(authorize('admin'));

router.post('/create-doctor', validate(createDoctorAdminSchema), createDoctor);
router.get('/users', getAllUsers);
router.put('/block-user/:id', validateParams(idParamSchema), toggleBlockUser);

// Security Audit Trail (Strictly admin readable, append-only, immutable)
router.get('/audit-logs', getAuditLogs);
router.all('/audit-logs', (req, res, next) => {
  if (req.method !== 'GET') {
    return rejectAuditMutation(req, res);
  }
  next();
});
router.all('/audit-logs/:id', rejectAuditMutation);

export default router;
