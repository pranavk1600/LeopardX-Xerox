import { Router } from 'express';
import {
  uploadPdf,
  calculatePrice,
  createPrintJob,
  getPrintJob,
  directPrintJob,
} from '../controllers/printJob.controller';
import { uploadPdfMiddleware } from '../middleware/upload.middleware';

const router = Router();

router.post('/upload', uploadPdfMiddleware.single('file'), uploadPdf);
router.post('/calculate-price', calculatePrice);
router.post('/', createPrintJob);
router.get('/:id', getPrintJob);
router.post('/:id/direct-print', directPrintJob);

export default router;
