const otpMap = new Map();
const OTP_TTL_MS = 5 * 60 * 1000;

export function storeOtp(email, otp) {
    otpMap.set(email.toLowerCase(), {
        otp,
        expiresAt: Date.now() + OTP_TTL_MS,
    });
}

export function verifyOtp(email, otp) {
    const entry = otpMap.get(email.toLowerCase());
    if (!entry || entry.expiresAt <= Date.now() || entry.otp !== otp) {
        otpMap.delete(email.toLowerCase());
        throw new Error('Invalid or expired OTP');
    }

    otpMap.delete(email.toLowerCase());
    return true;
}

export function pruneExpiredOtps() {
    const now = Date.now();
    for (const [key, entry] of otpMap.entries()) {
        if (entry.expiresAt <= now) {
            otpMap.delete(key);
        }
    }
}