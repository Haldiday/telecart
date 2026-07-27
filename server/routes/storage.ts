import { Router } from 'express';
import multer from 'multer';
import { requireAdmin } from '../middleware/auth.js';
import { getSupabaseAdmin } from '../lib/supabaseAdmin.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

export const storageRouter = Router();

storageRouter.post('/upload', requireAdmin, upload.single('file'), async (req, res) => {
  const bucket = (req.body.bucket as string) || 'uploads';
  const path = req.body.path as string;
  const file = req.file;

  if (!path || !file) {
    res.status(400).json({ data: null, error: { message: 'File and path are required' } });
    return;
  }

  const { error } = await getSupabaseAdmin().storage.from(bucket).upload(path, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });

  if (error) {
    res.status(400).json({ data: null, error: { message: error.message } });
    return;
  }

  const { data } = getSupabaseAdmin().storage.from(bucket).getPublicUrl(path);
  res.json({ data: { path, publicUrl: data.publicUrl }, error: null });
});

storageRouter.post('/remove', requireAdmin, async (req, res) => {
  const bucket = (req.body.bucket as string) || 'uploads';
  const paths = req.body.paths as string[];

  if (!Array.isArray(paths) || paths.length === 0) {
    res.status(400).json({ data: null, error: { message: 'paths array is required' } });
    return;
  }

  const { error } = await getSupabaseAdmin().storage.from(bucket).remove(paths);

  if (error) {
    res.status(400).json({ data: null, error: { message: error.message } });
    return;
  }

  res.json({ data: { removed: paths }, error: null });
});

storageRouter.get('/public-url', (req, res) => {
  const bucket = (req.query.bucket as string) || 'uploads';
  const path = req.query.path as string;

  if (!path) {
    res.status(400).json({ data: null, error: { message: 'path is required' } });
    return;
  }

  const { data } = getSupabaseAdmin().storage.from(bucket).getPublicUrl(path);
  res.json({ data: { publicUrl: data.publicUrl }, error: null });
});
