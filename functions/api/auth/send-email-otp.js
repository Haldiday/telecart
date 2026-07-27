import { getConfig } from '../../../helpers/config.js';
import { MSG91Service } from '../../../helpers/msg91.js';
import { EmailValidationService } from '../../../helpers/emailValidation.js';
import { jsonResponse, validateEmail } from '../../../helpers/utils.js';
import { consumeRateLimit, getClientIp } from '../../../helpers/rateLimiter.js';

const emailValidationService = new EmailValidationService();

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const email = typeof body.email === 'string' ? body.email.trim() : '';
        if (!validateEmail(email)) {
            return jsonResponse({ success: false, message: 'Please enter a valid email address.' }, 400);
        }

        const clientIp = getClientIp(request);
        if (!consumeRateLimit(clientIp, 5)) {
            return jsonResponse({ success: false, message: 'Too many OTP requests. Please try again later.' }, 429);
        }

        const validationResult = await emailValidationService.validateEmail(email);
        if (!validationResult.isValid) {
            return jsonResponse({ success: false, message: 'Please enter a valid business email address.' }, 400);
        }

        if (validationResult.isDisposable) {
            console.warn('[OTP Request Blocked]', { email, reason: 'disposable_or_invalid_email', validation: validationResult });
            return jsonResponse({ success: false, message: 'Temporary or disposable email addresses are not allowed.' }, 400);
        }

        const config = getConfig(env);
        const otpService = new MSG91Service(config);
        await otpService.sendOTP(email);
        return jsonResponse({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error sending email OTP:', error);
        const message = error instanceof Error ? error.message : 'Failed to send OTP';
        return jsonResponse({ success: false, message }, 500);
    }
}
