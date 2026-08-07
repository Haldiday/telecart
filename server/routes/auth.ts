import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  signupCheckUser,
  signupSendEmailOTP,
  signupVerifyEmailOTP,
  signupSendPhoneOTP,
  signupVerifyPhoneOTP,
  signupComplete,
  sendEmailOTP,
  verifyEmailOTP,
  sendPhoneOTP,
  verifyPhoneOTP,
  getMe,
  logout,
} from '../controllers/auth.js';
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

// Signup family: staged verification before account creation.
router.post('/signup/check-user', otpRateLimiter, signupCheckUser);
router.post('/signup/send-email-otp', otpRateLimiter, signupSendEmailOTP);
router.post('/signup/verify-email-otp', signupVerifyEmailOTP);
router.post('/signup/send-phone-otp', otpRateLimiter, signupSendPhoneOTP);
router.post('/signup/verify-phone-otp', signupVerifyPhoneOTP);
router.post('/signup/complete', signupComplete);

// Login family: email and phone login use a single verification step for existing users.
router.post('/login/email/send-otp', otpRateLimiter, sendEmailOTP);
router.post('/login/email/verify', verifyEmailOTP);
router.post('/login/phone/send-otp', otpRateLimiter, sendPhoneOTP);
router.post('/login/phone/verify', verifyPhoneOTP);

// Legacy compatibility endpoints retained so the current app does not break during rollout.
router.post('/send-email-otp', otpRateLimiter, sendEmailOTP);
router.post('/verify-email-otp', verifyEmailOTP);
router.get('/me', authenticateToken, getMe);
router.post('/logout', authenticateToken, logout);

export default router;
