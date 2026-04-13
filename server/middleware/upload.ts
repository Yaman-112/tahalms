import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${randomUUID()}-${safeName}`);
  },
});

const ALLOWED_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and Word documents are allowed'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

export { UPLOAD_DIR };
