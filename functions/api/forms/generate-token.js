import { getConfig } from '../../../helpers/config.js';
import { getSupabaseAdmin } from '../../../helpers/supabase.js';
import { createZohoPrefillToken } from '../../../helpers/zohoTokens.js';
import { jsonResponse, getBearerToken } from '../../../helpers/utils.js';

export async function onRequestPost({ request, env }) {
    try {
        const token = getBearerToken(request);
        if (!token) {
            return jsonResponse({ success: false, message: 'Authentication required' }, 401);
        }

        const config = getConfig(env);
        const supabase = getSupabaseAdmin(env);
        const payload = await verifyTokenPayload(token, config.jwtSecret);
        if (!payload || !payload.id) {
            return jsonResponse({ success: false, message: 'Invalid or expired token' }, 401);
        }

        const rawBody = await request.json();
        const ttlMs = typeof rawBody.ttlMs === 'number' ? rawBody.ttlMs : undefined;

        const { data: profile, error } = await supabase
            .from('users')
            .select('email, full_name, company_name')
            .eq('id', payload.id)
            .single();

        if (error) throw error;

        const record = createZohoPrefillToken({
            userId: payload.id,
            name: profile?.full_name || '',
            email: profile?.email || payload.email,
            companyName: profile?.company_name || '',
            ttlMs,
        });

        return jsonResponse({ success: true, token: record.token, expiresAt: record.expiresAt });
    } catch (error) {
        console.error('Error generating Zoho prefill token:', error);
        return jsonResponse({ success: false, message: 'Failed to generate Zoho prefill token' }, 500);
    }
}

async function verifyTokenPayload(token, secret) {
    try {
        const { verifyJwt } = await import('../../../helpers/jwt.js');
        const payload = await verifyJwt(token, secret);
        return payload;
    } catch {
        return null;
    }
}
