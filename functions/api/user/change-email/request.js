import { getConfig } from '../../../../helpers/config.js';
import { getSupabaseAdmin } from '../../../../helpers/supabase.js';
import { MSG91Service } from '../../../../helpers/msg91.js';
import { jsonResponse, getBearerToken, validateEmail } from '../../../../helpers/utils.js';
import { getSupabaseUserByToken } from '../../../../helpers/supabaseAuth.js';

export async function onRequestPost({ request, env }) {
    try {
        const token = getBearerToken(request);
        if (!token) {
            return jsonResponse({ success: false, message: 'Authentication required' }, 401);
        }

        const user = await getSupabaseUserByToken(env, token);
        if (!user || !user.id || !user.email) {
            return jsonResponse({ success: false, message: 'Invalid or expired token' }, 401);
        }

        const body = await request.json();
        const new_email = typeof body.new_email === 'string' ? body.new_email.trim() : '';
        if (!validateEmail(new_email)) {
            return jsonResponse({ success: false, message: 'Please provide a valid email address' }, 400);
        }

        const supabase = getSupabaseAdmin(env);
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', new_email)
            .single();

        if (existingUser) {
            return jsonResponse({ success: false, message: 'This email is already registered' }, 400);
        }

        const config = getConfig(env);
        const otpService = new MSG91Service(config);
        await otpService.sendOTP(user.email);
        return jsonResponse({ success: true, message: 'OTP sent to your current email address' });
    } catch (error) {
        console.error('Error requesting email change:', error);
        const message = error instanceof Error ? error.message : 'Failed to send OTP';
        return jsonResponse({ success: false, message }, 500);
    }
}
