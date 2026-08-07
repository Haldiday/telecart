const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const otpMap = new Map();

export class WhatsAppOtpError extends Error {
    constructor(message, reason) {
        super(message);
        this.name = 'WhatsAppOtpError';
        this.reason = reason;
    }
}

export function storeWhatsAppOtp(phone, otp) {
    otpMap.set(phone, { otp, expiresAt: Date.now() + OTP_TTL_MS, attempts: 0 });
    console.info('[WhatsApp OTP] Stored OTP', { phoneSuffix: phone.slice(-4), expiresAt: Date.now() + OTP_TTL_MS });
}

export function deleteWhatsAppOtp(phone) {
    otpMap.delete(phone);
}

export function verifyWhatsAppOtp(phone, otp) {
    const entry = otpMap.get(phone);
    if (!entry || entry.expiresAt <= Date.now()) {
        otpMap.delete(phone);
        throw new WhatsAppOtpError('Invalid or expired OTP', 'otp_expired');
    }

    if (entry.attempts >= MAX_ATTEMPTS) {
        otpMap.delete(phone);
        throw new WhatsAppOtpError('Too many incorrect OTP attempts. Please request a new code.', 'too_many_attempts');
    }

    if (entry.otp !== otp) {
        entry.attempts += 1;
        console.warn('[WhatsApp OTP] Verification failed', { phoneSuffix: phone.slice(-4), attempts: entry.attempts });
        throw new WhatsAppOtpError('Invalid or expired OTP', 'otp_invalid');
    }

    otpMap.delete(phone);
    console.info('[WhatsApp OTP] Verification succeeded', { phoneSuffix: phone.slice(-4) });
}
