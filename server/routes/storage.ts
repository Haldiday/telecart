import { Router } from 'express';
import multer from 'multer';
import { requireAdmin } from '../middleware/auth.js';
import { deleteFromR2, getR2Config, getR2PublicUrl, uploadToR2 } from '../lib/r2.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

export const storageRouter = Router();

storageRouter.post('/upload', requireAdmin, upload.single('file'), async (req, res) => {
  const bucket = (req.body.bucket as string) || undefined;
  const path = req.body.path as string;
  const file = req.file;

  if (!path || !file) {
    res.status(400).json({ data: null, error: { message: 'File and path are required' } });
    return;
  }

  const config = getR2Config();
  if (bucket && bucket !== config.bucketName) {
    res.status(400).json({ data: null, error: { message: 'Invalid upload bucket' } });
    return;
  }

  const { publicUrl } = await uploadToR2(config.bucketName, path, file.buffer, file.mimetype || 'application/octet-stream');
  res.json({ data: { path, publicUrl }, error: null });
});

storageRouter.post('/remove', requireAdmin, async (req, res) => {
  const bucket = (req.body.bucket as string) || undefined;
  const paths = req.body.paths as string[];

  if (!Array.isArray(paths) || paths.length === 0) {
    res.status(400).json({ data: null, error: { message: 'paths array is required' } });
    return;
  }

  const config = getR2Config();
  if (bucket && bucket !== config.bucketName) {
    res.status(400).json({ data: null, error: { message: 'Invalid storage bucket' } });
    return;
  }

  await Promise.all(paths.map((path) => deleteFromR2(config.bucketName, path)));
  res.json({ data: { removed: paths }, error: null });
});

storageRouter.get('/public-url', (req, res) => {
  const bucket = (req.query.bucket as string) || undefined;
  const path = req.query.path as string;

  if (!path) {
    res.status(400).json({ data: null, error: { message: 'path is required' } });
    return;
  }

  const config = getR2Config();
  if (bucket && bucket !== config.bucketName) {
    res.status(400).json({ data: null, error: { message: 'Invalid storage bucket' } });
    return;
  }

  const publicUrl = getR2PublicUrl(path);
  res.json({ data: { publicUrl }, error: null });
});

storageRouter.get('/health', (_req, res) => {
  const config = getR2Config();
  res.json({ data: { provider: 'cloudflare-r2', status: 'ok', bucket: config.bucketName }, error: null });
});
