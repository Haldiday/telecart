const otpMap = new Map();
const OTP_TTL_MS = 5 * 60 * 1000;

export function storeOtp(email, otp) {
    const normalizedEmail = email.toLowerCase();
    const entry = {
        otp,
        expiresAt: Date.now() + OTP_TTL_MS,
    };
    otpMap.set(normalizedEmail, entry);
    console.log('[OTP STORE] Stored OTP', { email: normalizedEmail, expiresAt: entry.expiresAt });
}

export function verifyOtp(email, otp) {
    const normalizedEmail = email.toLowerCase();
    const entry = otpMap.get(normalizedEmail);
    console.log('[OTP STORE] Verifying OTP', {
        email: normalizedEmail,
        providedOtp: otp,
        entry: entry ? { expiresAt: entry.expiresAt } : null,
    });

    if (!entry || entry.expiresAt <= Date.now() || entry.otp !== otp) {
        otpMap.delete(normalizedEmail);
        console.log('[OTP STORE] OTP verification failed', { email: normalizedEmail });
        throw new Error('Invalid or expired OTP');
    }

    otpMap.delete(normalizedEmail);
    console.log('[OTP STORE] OTP verification succeeded and cleared stored entry', { email: normalizedEmail });
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