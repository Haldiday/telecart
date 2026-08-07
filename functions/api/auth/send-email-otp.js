import { getConfig } from '../../helpers/config.js';
import { MSG91Service } from '../../helpers/msg91.js';
import { EmailValidationService, EmailValidationServiceError } from '../../helpers/emailValidation.js';
import { getSupabaseAdmin } from '../../helpers/supabase.js';
import { jsonResponse, validateEmail } from '../../helpers/utils.js';
import { consumeRateLimit, getClientIp } from '../../helpers/rateLimiter.js';

const emailValidationService = new EmailValidationService();

function getEmailLogDetails(email) {
    const [localPart, domain] = String(email).split('@');
    const emailProvided = Boolean(email);
    return {
        provided: Boolean(email),
        localPartLength: emailProvided ? localPart.length : 0,
        domain: domain || null,
    };
}

function getEnvironmentStatus(env) {
    return {
        hasMsg91AuthKey: Boolean(env.MSG91_AUTH_KEY),
        hasMsg91TemplateId: Boolean(env.MSG91_TEMPLATE_ID),
        hasMsg91EmailDomain: Boolean(env.MSG91_EMAIL_DOMAIN),
        hasMsg91FromEmail: Boolean(env.MSG91_FROM_EMAIL),
        hasAbstractApiKey: Boolean(env.ABSTRACT_API_KEY),
        hasJwtSecret: Boolean(env.JWT_SECRET),
    };
}

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const email = typeof body.email === 'string' ? body.email.trim() : '';
        const clientIp = getClientIp(request);
        const normalizedEmail = email.toLowerCase();
        console.info('[OTP Request] Received', { emailFormat: getEmailLogDetails(email), clientIp });
        console.info('[OTP Request] Environment status', getEnvironmentStatus(env));
        if (!validateEmail(email)) {
            console.warn('[OTP Request] Rejected', { reason: 'invalid_format', emailFormat: getEmailLogDetails(email), clientIp });
            return jsonResponse({ success: false, message: 'Please enter a valid email address.' }, 400);
        }

        if (!consumeRateLimit(clientIp, 5)) {
            console.warn('[OTP Request] Rate limit hit for IP', { clientIp });
            return jsonResponse({ success: false, message: 'Too many OTP requests from this IP. Please try again later.' }, 429);
        }

        if (!consumeRateLimit(normalizedEmail, 3)) {
            console.warn('[OTP Request] Rate limit hit for email', { emailFormat: getEmailLogDetails(email), clientIp });
            return jsonResponse({ success: false, message: 'Too many OTP requests for this email address. Please try again later.' }, 429);
        }

        const validationResult = await emailValidationService.validateEmail(email, env);
        console.info('[OTP Request] Validation result', { emailFormat: getEmailLogDetails(email), validationResult });
        if (!validationResult.isValid) {
            const reason = validationResult.rejectionReason || 'invalid_email';
            console.warn('[OTP Request] Rejected', { reason, emailFormat: getEmailLogDetails(email), validationResult });
            if (reason === 'disposable') {
                return jsonResponse({ success: false, message: 'Please enter valid email.' }, 400);
            }
            return jsonResponse({ success: false, message: 'Please enter a valid email address.' }, 400);
        }

        if (validationResult.isDisposable) {
            console.warn('[OTP Request] Rejected', { reason: validationResult.rejectionReason || 'disposable', emailFormat: getEmailLogDetails(email), validationResult });
            return jsonResponse({ success: false, message: 'Please enter valid email.' }, 400);
        }

        const supabase = getSupabaseAdmin(env);
        const { data: existingUser, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('email', normalizedEmail)
            .maybeSingle();
        if (userError && userError.code !== 'PGRST116') {
            throw userError;
        }
        if (!existingUser) {
            return jsonResponse({ success: false, message: 'This email is not registered. Please create an account first.' }, 404);
        }

        // Quick config checks to provide clearer errors in Cloudflare Pages environment
        const envStatus = getEnvironmentStatus(env);
        if (!envStatus.hasMsg91AuthKey || !envStatus.hasMsg91TemplateId) {
            console.error('[OTP Request] MSG91 not configured in environment', envStatus);
            return jsonResponse({ success: false, message: 'Email provider is not configured on the server.' }, 500);
        }

        const config = getConfig(env);
        const otpService = new MSG91Service(config);
        const otp = otpService.generateOTP();
        await otpService.sendOTP(email, otp);
        return jsonResponse({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        if (error instanceof EmailValidationServiceError) {
            console.error('[OTP Request] Validation service unavailable', { reason: error.reason });
            return jsonResponse({ success: false, message: error.message }, 503);
        }
        console.error('[OTP Request] Failed to send OTP', { error: error instanceof Error ? error.message : String(error) });
        const message = error instanceof Error ? error.message : 'Failed to send OTP';
        return jsonResponse({ success: false, message }, 500);
    }
}