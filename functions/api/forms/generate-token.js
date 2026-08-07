import { getConfig } from '../../helpers/config.js';
import { createZohoPrefillToken } from '../../helpers/zohoTokens.js';
import { jsonResponse, getBearerToken } from '../../helpers/utils.js';

const MIN_TTL_MS = 60_000;
const MAX_TTL_MS = 10 * 60_000;

export async function onRequestPost({ request, env }) {
    try {
        const bearerToken = getBearerToken(request);
        if (!bearerToken) return jsonResponse({ success: false, message: 'Authentication required' }, 401);

        const config = getConfig(env);
        const payload = await verifyTokenPayload(bearerToken, config.jwtSecret);
        if (!payload || !payload.id) return jsonResponse({ success: false, message: 'Invalid or expired token' }, 401);

        const rawBody = await request.json();
        const requestedTtl = typeof rawBody.ttlMs === 'number' ? Math.round(rawBody.ttlMs) : undefined;
        const ttlMs = typeof requestedTtl === 'number'
            ? Math.min(MAX_TTL_MS, Math.max(MIN_TTL_MS, requestedTtl))
            : 5 * 60_000;

        const record = await createZohoPrefillToken({ env, userId: payload.id, ttlMs });

        return jsonResponse({ success: true, token: record.token, expiresAt: record.expiresAt });
    } catch (error) {
        console.error('Error generating Zoho prefill token:', error);
        return jsonResponse({ success: false, message: 'Failed to generate Zoho prefill token' }, 500);
    }
}

async function verifyTokenPayload(token, secret) {
    try {
        const { verifyJwt } = await import('../../helpers/jwt.js');
        return await verifyJwt(token, secret);
    } catch {
        return null;
    }
}
