import { Router } from 'express';
import machineRoutes from './machine.routes';
import printJobRoutes from './printJob.routes';
import paymentRoutes from './payment.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/machines', machineRoutes);
router.use('/print-jobs', printJobRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);

export default router;
