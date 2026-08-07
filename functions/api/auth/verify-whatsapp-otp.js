import { getConfig } from '../../helpers/config.js';
import { getSupabaseAdmin } from '../../helpers/supabase.js';
import { signJwt } from '../../helpers/jwt.js';
import { jsonResponse } from '../../helpers/utils.js';
import { verifyWhatsAppOtp, WhatsAppOtpError } from '../../helpers/whatsappOtpStore.js';
import { normalizePhone } from '../../helpers/whatsapp.js';
import { parseSignupData } from '../../helpers/signup.js';

export async function onRequestPost({ request, env }) {
    let phone;
    try {
        const body = await request.json();
        phone = normalizePhone(body.phone);
        const otp = typeof body.otp === 'string' ? body.otp.trim() : '';
        if (!phone) return jsonResponse({ success: false, message: 'Please provide a valid mobile number.' }, 400);
        if (!/^\d{6}$/.test(otp)) return jsonResponse({ success: false, message: 'Please provide a valid 6-digit OTP.' }, 400);

        const config = getConfig(env);
        const supabase = getSupabaseAdmin(env);
        const { data: existingUser, error: selectError } = await supabase.from('users').select('*').eq('phone', phone).single();
        if (selectError && selectError.code !== 'PGRST116') throw selectError;

        const signupData = existingUser ? null : parseSignupData(body.signupData);
        if (!existingUser && !signupData) {
            return jsonResponse({ success: false, message: 'First name, last name, and company name are required to create an account.' }, 400);
        }
        verifyWhatsAppOtp(phone, otp);
        let user = existingUser;
        if (!user) {
            const { data, error } = await supabase.from('users')
                .insert({ phone, phone_verified: true, is_verified: true, ...signupData }).select('*').single();
            if (error) throw error;
            user = data;
        } else if (!user.phone_verified || !user.is_verified) {
            const { data, error } = await supabase.from('users')
                .update({ phone_verified: true, is_verified: true }).eq('id', user.id).select('*').single();
            if (error) throw error;
            user = data;
        }

        const token = await signJwt({ id: user.id, email: user.email || null, phone: user.phone }, config.jwtSecret, config.jwtExpiresIn);
        console.info('[WhatsApp OTP] Authentication succeeded', { phoneSuffix: phone.slice(-4), existingUser: Boolean(existingUser) });
        return jsonResponse({ success: true, token, user });
    } catch (error) {
        if (error instanceof WhatsAppOtpError) {
            return jsonResponse({ success: false, message: error.message }, error.reason === 'too_many_attempts' ? 429 : 400);
        }
        console.error('[WhatsApp OTP] Verification failed', { phoneSuffix: phone?.slice(-4) || null, error: error instanceof Error ? error.message : String(error) });
        return jsonResponse({ success: false, message: 'Unable to verify WhatsApp OTP right now. Please try again.' }, 500);
    }
}
