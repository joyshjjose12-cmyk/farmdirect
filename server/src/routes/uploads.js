import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { HttpError, wrap } from '../http.js';
import { requireAuth, requireRole } from '../auth.js';

export const UPLOAD_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '') || '.jpg';
      cb(null, `${req.user.id}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new HttpError(400, 'Only image files are allowed.')),
});

const router = Router();

// CREATE (farmer): upload a listing photo, get back its public URL
router.post(
  '/',
  requireAuth,
  requireRole('farmer'),
  upload.single('photo'),
  wrap(async (req, res) => {
    if (!req.file) throw new HttpError(400, 'No photo received.');
    const base = (process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    res.status(201).json({ url: `${base}/uploads/${req.file.filename}` });
  })
);

export default router;
