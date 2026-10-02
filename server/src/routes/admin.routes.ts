import { Router } from 'express';
import {
  adminLogin,
  getAllMachines,
  getMachineById,
  createMachine,
  updateMachine,
  disableMachine,
  enableMachine,
  addPaperStock,
  updatePaperThreshold,
  getPaperRefillHistory,
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

// Protected Paper Stock Management Routes
router.post('/machines/:id/add-paper', adminAuth, addPaperStock);
router.patch('/machines/:id/threshold', adminAuth, updatePaperThreshold);
router.get('/machines/:id/refills', adminAuth, getPaperRefillHistory);

export default router;
