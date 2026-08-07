import { getSupabaseAdmin } from './supabase.js';

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

export async function validateZohoPrefillToken({ env, token }) {
    if (!token) return null;

    const supabase = getSupabaseAdmin(env);
    const { data, error } = await supabase
        .from('zoho_prefill_tokens')
        .select('token, user_id, expires_at')
        .eq('token', token)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    if (data.expires_at <= Date.now()) {
        await supabase.from('zoho_prefill_tokens').delete().eq('token', token);
        return null;
    }

    return { token: data.token, userId: data.user_id };
}

export async function markZohoPrefillTokenUsed({ env, token }) {
    const supabase = getSupabaseAdmin(env);
    const { error } = await supabase.from('zoho_prefill_tokens').delete().eq('token', token);
    if (error) throw error;
}
