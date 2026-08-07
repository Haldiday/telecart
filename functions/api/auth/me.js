import { getConfig } from '../../helpers/config.js';
import { getSupabaseAdmin } from '../../helpers/supabase.js';
import { verifyJwt } from '../../helpers/jwt.js';
import { jsonResponse, getBearerToken } from '../../helpers/utils.js';

export async function onRequestGet({ request, env }) {
    try {
        const token = getBearerToken(request);
        if (!token) {
            return jsonResponse({ success: false, message: 'Authentication required' }, 401);
        }

        const config = getConfig(env);
        let payload;

        try {
            payload = await verifyJwt(token, config.jwtSecret);
        } catch (jwtError) {
            console.error('JWT verification failed:', jwtError);
            return jsonResponse({ success: false, message: 'Invalid or expired token' }, 401);
        }

        const supabase = getSupabaseAdmin(env);
        const { data: user, error } = await supabase.from('users').select('*').eq('id', payload.id).single();

        if (error || !user) {
            console.error('User lookup failed for token payload:', { payload, error });
            return jsonResponse({ success: false, message: 'Authentication required' }, 401);
        }

        return jsonResponse({ success: true, user });
    } catch (error) {
        console.error('Error fetching user:', error);
        return jsonResponse({ success: false, message: 'Failed to fetch user' }, 500);
    }
}