import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { sendEmailOTP, verifyEmailOTP, getMe, logout } from '../controllers/auth.js';
import { authenticateToken } from '../middlewares/jwt.js';
import { config } from '../config/index.js';

const router = Router();

const otpRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/send-email-otp', otpRateLimiter, sendEmailOTP);
router.post('/verify-email-otp', verifyEmailOTP);
router.get('/me', authenticateToken, getMe);
router.post('/logout', authenticateToken, logout);

export default router;
