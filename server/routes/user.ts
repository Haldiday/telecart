import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middlewares/jwt.js';
import {
  getProfile,
  updateProfile,
  requestChangeEmail,
  verifyChangeEmail,
  requestChangePhone,
  verifyChangePhone,
} from '../controllers/user.js';
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

// All routes require authentication
router.use(authenticateToken);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/change-email/request', otpRateLimiter, requestChangeEmail);
router.post('/change-email/verify', verifyChangeEmail);
router.post('/change-phone/request', otpRateLimiter, requestChangePhone);
router.post('/change-phone/verify', verifyChangePhone);

export default router;
