import { getBearerToken } from './utils.js';
import { getSupabaseAdmin } from './supabase.js';

// NOTE: Root cause summary:
// - `requireAdminAuth` previously had an empty guard block when the user lookup failed
//   which allowed the function to continue and access `user.id` when `user` was null,
//   causing runtime exceptions (HTTP 500) in production. This file fixes that bug,
//   improves error logging, and makes the Supabase `getUser` call resilient to
//   the two common call shapes used by different `supabase-js` versions/environments.

export async function getSupabaseUserByToken(env, token) {
    if (!token) return null;

    try {
        // Some supabase-js versions accept an object { access_token }, others accept the token string.
        // Try the object form first, then fall back to the string form.
        let res;
        try {
            res = await getSupabaseAdmin(env).auth.getUser({ access_token: token });
        } catch (firstErr) {
            // Fallback to string form if object form isn't supported in this runtime/version
            try {
                res = await getSupabaseAdmin(env).auth.getUser(token);
            } catch (secondErr) {
                console.error('getSupabaseUserByToken: both getUser forms failed', { firstErr, secondErr });
                return null;
            }
        }

        const { data, error } = res || {};
        if (error || !data ? .user) {
            console.warn('getSupabaseUserByToken: no user found or error from supabase', { error });
            return null;
        }
        return data.user;
    } catch (err) {
        console.error('getSupabaseUserByToken unexpected error:', err);
        return null;
    }
}

export async function isAdminUser(env, userId) {
    if (!userId) return false;

    try {
        // Primary check: user_roles table (preferred)
        const { data: roleData, error: roleError } = await getSupabaseAdmin(env)
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .eq('role', 'admin')
            .maybeSingle();

        if (roleError) {
            console.error('isAdminUser: user_roles query error', { userId, roleError });
        }

        if (roleData) {
            console.debug('isAdminUser: found admin via user_roles', { userId });
            return true;
        }

        // Backwards-compatibility: some deployments use an `admin_users` table with `is_admin` flag.
        try {
            const { data: adminData, error: adminError } = await getSupabaseAdmin(env)
                .from('admin_users')
                .select('is_admin')
                .eq('id', userId)
                .maybeSingle();

            if (adminError) {
                console.error('isAdminUser: admin_users query error', { userId, adminError });
            }

            if (adminData && adminData.is_admin) {
                console.debug('isAdminUser: found admin via admin_users table', { userId });
                return true;
            }
        } catch (err) {
            console.error('isAdminUser: admin_users lookup exception', { userId, err });
        }

        return false;
    } catch (err) {
        console.error('isAdminUser exception:', err);
        return false;
    }
}

export async function requireAdminAuth(request) {
    const token = getBearerToken(request);
    if (!token) {
        return { isAdmin: false, userId: null };
    }

    try {
        const user = await getSupabaseUserByToken(request.env, token);
        if (!user || !user.id) {
            // Explicit early return when user isn't found.
            return { isAdmin: false, userId: null };
        }

        const isAdmin = await isAdminUser(request.env, user.id);
        return { isAdmin, userId: user.id };
    } catch (err) {
        console.error('requireAdminAuth error:', err);
        return { isAdmin: false, userId: null };
    }
}