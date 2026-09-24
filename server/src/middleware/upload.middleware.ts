import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { storageService } from '../services/storage.service';

const maxFileSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || '20', 10);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageService.getFilePath(''));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueName = `${sanitizedBase}_${uuidv4().slice(0, 8)}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.pdf' || file.mimetype !== 'application/pdf') {
    return cb(new Error('Only PDF files are allowed!'));
  }
  cb(null, true);
};

export const uploadPdfMiddleware = multer({
  storage,
  limits: { fileSize: maxFileSizeMB * 1024 * 1024 },
  fileFilter,
});
