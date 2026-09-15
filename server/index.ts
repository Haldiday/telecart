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
import adminRouter from './routes/admin.js';
import auditRouter from './routes/audit.js';
// import whatsappAuthRouter from './routes/whatsappAuth.js';

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
// app.use('/api/auth', whatsappAuthRouter);
app.use('/api/user', userRouter);
app.use('/api/forms', formsRouter);
app.use('/api/zoho', formsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/audit', auditRouter);
app.use('/api/db', optionalAuth, dbRouter);
app.use('/api/storage', optionalAuth, storageRouter);

function startServer(startPort: number, remainingAttempts = 10) {
  const server = app.listen(startPort, () => {
    console.log(`API server running on http://localhost:${startPort}`);
    if (startPort !== PORT) {
      console.warn(
        `[WARN] Port ${PORT} was occupied. Falling back to port ${startPort}. Update VITE_API_URL to http://localhost:${startPort} in the Vite env if needed.`,
      );
    }
  });

  server.on('error', (err: any) => {
    if (
      remainingAttempts > 0 &&
      (err?.code === 'EADDRINUSE' || err?.code === 'EACCES')
    ) {
      const nextPort = startPort + 1;
      console.warn(
        `[WARN] Port ${startPort} unavailable (${err.code}), trying ${nextPort} (${remainingAttempts} attempts left)…`,
      );
      setTimeout(() => startServer(nextPort, remainingAttempts - 1), 200);
      return;
    }
    console.error('[SERVER] Failed to start:', err);
    process.exit(1);
  });
}

startServer(PORT);
