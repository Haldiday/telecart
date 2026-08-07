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
        const payload = await verifyJwt(token, config.jwtSecret);

        const supabase = getSupabaseAdmin(env);
        const { data: user, error } = await supabase.from('users').select('*').eq('id', payload.id).single();
        if (error) throw error;

        return jsonResponse({ success: true, user });
    } catch (error) {
        const envInfo = {
            hasSupabaseUrl: Boolean(env && (env.SUPABASE_URL || env.VITE_SUPABASE_URL)),
            hasSupabaseServiceRoleKey: Boolean(env && env.SUPABASE_SERVICE_ROLE_KEY),
            hasJwtSecret: Boolean(env && env.JWT_SECRET),
        };
        console.error('Error fetching user:', { error, envInfo });
        return jsonResponse({ success: false, message: error instanceof Error ? error.message : 'Failed to fetch user' }, 500);
    }
}