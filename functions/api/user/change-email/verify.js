import { getConfig } from '../../../../helpers/config.js';
import { getSupabaseAdmin } from '../../../../helpers/supabase.js';
import { MSG91Service } from '../../../../helpers/msg91.js';
import { signJwt } from '../../../../helpers/jwt.js';
import { jsonResponse, getBearerToken, validateEmail, validateOTP } from '../../../../helpers/utils.js';
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
        const otp = typeof body.otp === 'string' ? body.otp.trim() : '';
        const new_email = typeof body.new_email === 'string' ? body.new_email.trim() : '';

        if (!validateEmail(new_email)) {
            return jsonResponse({ success: false, message: 'Please provide a valid email address' }, 400);
        }
        if (!validateOTP(otp)) {
            return jsonResponse({ success: false, message: 'Please provide a valid OTP' }, 400);
        }

        const config = getConfig(env);
        const otpService = new MSG91Service(config);
        await otpService.verifyOTP(user.email, otp);

        const supabase = getSupabaseAdmin(env);
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', new_email)
            .single();

        if (existingUser) {
            return jsonResponse({ success: false, message: 'This email is already registered' }, 400);
        }

        const { data: updatedUser, error } = await supabase
            .from('users')
            .update({ email: new_email })
            .eq('id', user.id)
            .select('*')
            .single();

        if (error) throw error;

        const newToken = await signJwt({ id: updatedUser.id, email: updatedUser.email }, config.jwtSecret, config.jwtExpiresIn);
        return jsonResponse({ success: true, user: updatedUser, token: newToken, message: 'Email updated successfully' });
    } catch (error) {
        console.error('Error verifying email change:', error);
        const message = error instanceof Error ? error.message : 'Invalid or expired OTP';
        return jsonResponse({ success: false, message }, 400);
    }
}
