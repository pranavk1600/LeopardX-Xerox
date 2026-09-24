import { Router } from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  getPaymentStatus,
  handleWebhook,
} from '../controllers/payment.controller';

const router = Router();

router.post('/create-order', createPaymentOrder);
router.post('/order', createPaymentOrder); // Alias for compatibility
router.post('/verify', verifyPayment);
router.get('/status/:orderId', getPaymentStatus);
router.post('/webhook', handleWebhook);

export default router;
