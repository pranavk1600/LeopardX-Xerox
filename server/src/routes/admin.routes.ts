import { Router } from 'express';
import {
  adminLogin,
  getAllMachines,
  getMachineById,
  createMachine,
  updateMachine,
  disableMachine,
  enableMachine,
} from '../controllers/admin.controller';
import { adminAuth } from '../middleware/adminAuth.middleware';

const router = Router();

// Public Admin Login
router.post('/login', adminLogin);

// Protected Super Admin Machine Management Routes
router.get('/machines', adminAuth, getAllMachines);
router.post('/machines', adminAuth, createMachine);
router.get('/machines/:id', adminAuth, getMachineById);
router.patch('/machines/:id', adminAuth, updateMachine);
router.patch('/machines/:id/disable', adminAuth, disableMachine);
router.patch('/machines/:id/enable', adminAuth, enableMachine);

export default router;
