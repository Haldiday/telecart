import rateLimit from 'express-rate-limit';
import { Router } from 'express';
import { sendWhatsAppOTP, verifyWhatsAppOTP } from '../controllers/whatsappAuth.js';

const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many OTP requests. Please try again later.' } });

// WHATSAPP OTP DISABLED - Use Email OTP only for now
// router.post('/send-whatsapp-otp', limiter, sendWhatsAppOTP);
// router.post('/verify-whatsapp-otp', verifyWhatsAppOTP);

export default router;
