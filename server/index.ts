import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { optionalAuth } from './middleware/auth.js';
import { dbRouter } from './routes/db.js';
import { storageRouter } from './routes/storage.js';
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import formsRouter from './routes/forms.js';
import whatsappAuthRouter from './routes/whatsappAuth.js';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buf) => {
    (req as import('./types/index.js').AuthRequest).rawBody = buf.toString();
  },
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
  verify: (req, _res, buf) => {
    (req as import('./types/index.js').AuthRequest).rawBody = buf.toString();
  },
}));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRouter);
app.use('/api/auth', whatsappAuthRouter);
app.use('/api/user', userRouter);
app.use('/api/forms', formsRouter);
app.use('/api/zoho', formsRouter);
app.use('/api/db', optionalAuth, dbRouter);
app.use('/api/storage', optionalAuth, storageRouter);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
