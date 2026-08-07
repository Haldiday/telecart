import { jsonResponse } from '../../helpers/utils.js';
import { consumeRateLimit, getClientIp } from '../../helpers/rateLimiter.js';
import { deleteWhatsAppOtp, storeWhatsAppOtp } from '../../helpers/whatsappOtpStore.js';
import { generateWhatsAppOtp, normalizePhone, sendWhatsAppOtp, WhatsAppServiceError } from '../../helpers/whatsapp.js';

export async function onRequestPost({ request, env }) {
    let phone;
    try {
        const body = await request.json();
        phone = normalizePhone(body.phone);
        const clientIp = getClientIp(request);
        if (!phone) return jsonResponse({ success: false, message: 'Please provide a valid mobile number.' }, 400);
        if (!consumeRateLimit(clientIp, 5) || !consumeRateLimit(`whatsapp:${phone}`, 3)) {
            console.warn('[WhatsApp OTP] Rate limit exceeded', { phoneSuffix: phone.slice(-4), clientIp });
            return jsonResponse({ success: false, message: 'Too many OTP requests. Please try again later.' }, 429);
        }

        const otp = generateWhatsAppOtp();
        storeWhatsAppOtp(phone, otp);
        try {
            await sendWhatsAppOtp(phone, otp, env);
        } catch (error) {
            deleteWhatsAppOtp(phone);
            throw error;
        }
        return jsonResponse({ success: true, message: 'WhatsApp OTP sent successfully' });
    } catch (error) {
        if (error instanceof WhatsAppServiceError) {
            return jsonResponse({ success: false, message: error.message }, error.status);
        }
        console.error('[WhatsApp OTP] Send failed', { phoneSuffix: phone?.slice(-4) || null, error: error instanceof Error ? error.message : String(error) });
        return jsonResponse({ success: false, message: 'Unable to send WhatsApp OTP right now. Please try again.' }, 500);
    }
}
