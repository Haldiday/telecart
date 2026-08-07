import { getConfig } from '../../helpers/config.js';
import { getSupabaseAdmin } from '../../helpers/supabase.js';
import { MSG91Service } from '../../helpers/msg91.js';
import { signJwt } from '../../helpers/jwt.js';
import { jsonResponse, validateEmail, validateOTP } from '../../helpers/utils.js';
import { parseSignupData } from '../../helpers/signup.js';

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const email = typeof body.email === 'string' ? body.email.trim() : '';
        const otp = typeof body.otp === 'string' ? body.otp.trim() : '';

        if (!validateEmail(email)) {
            return jsonResponse({ success: false, message: 'Please provide a valid email address' }, 400);
        }
        if (!validateOTP(otp)) {
            return jsonResponse({ success: false, message: 'Please provide a valid OTP' }, 400);
        }

        const config = getConfig(env);
        const supabase = getSupabaseAdmin(env);
        const { data: existingUser, error: selectError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (selectError && selectError.code !== 'PGRST116') {
            throw selectError;
        }

        if (!existingUser) {
            return jsonResponse({ success: false, message: 'This email is not registered. Please create an account first.' }, 404);
        }

        const otpService = new MSG91Service(config);
        await otpService.verifyOTP(email, otp);
        let user = existingUser;

        if (!existingUser.is_verified) {
            const { data: updatedUser, error: updateError } = await supabase
                .from('users')
                .update({ is_verified: true })
                .eq('id', existingUser.id)
                .select('*')
                .single();
            if (updateError) throw updateError;
            user = updatedUser;
        }

        const token = await signJwt({ id: user.id, email: user.email }, config.jwtSecret, config.jwtExpiresIn);
        return jsonResponse({ success: true, token, user });
    } catch (error) {
        console.error('Error verifying email OTP:', error);
        return jsonResponse({ success: false, message: 'Invalid or expired OTP' }, 400);
    }
}