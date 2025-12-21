import express from 'express';
import { createDoctor, getAllUsers, toggleBlockUser } from '../controllers/adminController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect); 
router.use(authorize('admin'));

router.post('/create-doctor', createDoctor);
router.get('/users', getAllUsers);
router.put('/block-user/:id', toggleBlockUser);

export default router;
