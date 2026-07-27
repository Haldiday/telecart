import { getBearerToken } from './utils.js';
import { getSupabaseAdmin } from './supabase.js';

export async function getSupabaseUserByToken(env, token) {
    if (!token) return null;

    try {
        const { data, error } = await getSupabaseAdmin(env).auth.getUser(token);
        if (error || !data.user) {
            return null;
        }
        return data.user;
    } catch {
        return null;
    }
}

export async function isAdminUser(env, userId) {
    try {
        const { data, error } = await getSupabaseAdmin(env)
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .eq('role', 'admin')
            .maybeSingle();

        return !!data;
    } catch {
        return false;
    }
}

export async function requireAdminAuth(request) {
    const token = getBearerToken(request);
    if (!token) {
        return { isAdmin: false, userId: null };
    }

    const user = await getSupabaseUserByToken(request.env, token);
    if (!user || !user.id) {}

    const isAdmin = await isAdminUser(request.env, user.id);
    return { isAdmin, userId: user.id };
}