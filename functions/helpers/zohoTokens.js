import { getSupabaseAdmin } from './supabase.js';

const ZOHO_PREFILL_TOKEN_REUSE_WINDOW_MS = 60000;

function parseTimestamp(value) {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = Date.parse(value);
        return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
}

function isZohoPrefillRetryAllowed(createdAt) {
    const createdAtMs = parseTimestamp(createdAt);
    if (!createdAtMs) return false;

    return Date.now() - createdAtMs <= ZOHO_PREFILL_TOKEN_REUSE_WINDOW_MS;
}

export async function createZohoPrefillToken({ env, userId, ttlMs = 300000 }) {
    const supabase = getSupabaseAdmin(env);
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + Math.max(1000, ttlMs);

    const { error } = await supabase.from('zoho_prefill_tokens').insert({
        token,
        user_id: userId,
        expires_at: expiresAt,
    });

    if (error) throw error;

    return { token, expiresAt };
}

export async function validateZohoPrefillToken({ env, token, allowUsed = false }) {
    if (!token) return null;

    const supabase = getSupabaseAdmin(env);
    const { data, error } = await supabase
        .from('zoho_prefill_tokens')
        .select('token, user_id, expires_at, used, created_at')
        .eq('token', token)
        .maybeSingle();

    const maskedToken = token ? `***${token.slice(-6)}` : 'none';
    console.log('[prefill] validate token:', maskedToken, 'allowUsed:', allowUsed);

    if (error) throw error;
    if (!data) {
        console.log('[prefill] validation failure reason: token not found');
        return null;
    }

    const expiresAt = typeof data.expires_at === 'string' ? Number(data.expires_at) : data.expires_at;
    if (!expiresAt || expiresAt <= Date.now()) {
        console.log('[prefill] validation failure reason: expired');
        await supabase.from('zoho_prefill_tokens').delete().eq('token', token);
        return null;
    }

    if (data.used && !allowUsed) {
        console.log('[prefill] validation failure reason: token already used and retry not allowed');
        return null;
    }

    if (data.used && allowUsed) {
        const createdAtMs = parseTimestamp(data.created_at);
        if (!createdAtMs) {
            console.log('[prefill] validation failure reason: token used but created_at invalid');
            return null;
        }

        const retryAllowed = Date.now() - createdAtMs <= ZOHO_PREFILL_TOKEN_REUSE_WINDOW_MS;
        console.log('[prefill] token used; retryAllowed:', retryAllowed, 'createdAt:', createdAtMs);

        if (!retryAllowed) {
            console.log('[prefill] validation failure reason: retry window expired');
            return null;
        }
    }

    console.log('[prefill] validation success: token accepted');
    return { token: data.token, userId: data.user_id, used: Boolean(data.used) };
}

export async function markZohoPrefillTokenUsed({ env, token }) {
    const supabase = getSupabaseAdmin(env);
    const { error } = await supabase
        .from('zoho_prefill_tokens')
        .update({ used: true })
        .eq('token', token);
    if (error) throw error;
}