import { executeQuery } from '../../helpers/dbExecutor.js';
import { jsonResponse, getBearerToken } from '../../helpers/utils.js';
import { getSupabaseUserByToken, isAdminUser } from '../../helpers/supabaseAuth.js';

export async function onRequestPost({ request, env }) {
    try {
        const spec = await request.json();
        if (!spec || !spec.table || !spec.action) {
            return jsonResponse({ data: null, error: { message: 'Invalid query spec: table and action are required' } }, 400);
        }

        const adminActions = new Set(['insert', 'update', 'delete', 'upsert']);
        if (adminActions.has(spec.action)) {
            const token = getBearerToken(request);
            if (!token) {
                return jsonResponse({ data: null, error: { message: 'Authentication required', code: 'UNAUTHORIZED' } }, 401);
            }

            const user = await getSupabaseUserByToken(env, token);
            if (!user || !user.id) {
                return jsonResponse({ data: null, error: { message: 'Invalid or expired token', code: 'UNAUTHORIZED' } }, 401);
            }

            const admin = await isAdminUser(env, user.id);
            if (!admin) {
                return jsonResponse({ data: null, error: { message: 'Admin access required for write operations', code: 'FORBIDDEN' } }, 403);
            }
        }

        const result = await executeQuery(spec, env);
        if (result.error) {
            return jsonResponse(result, 400);
        }
        return jsonResponse(result);
    } catch (error) {
        // Log error with helpful context without leaking secrets.
        const envInfo = {
            hasSupabaseUrl: Boolean(env && (env.SUPABASE_URL || env.VITE_SUPABASE_URL)),
            hasSupabaseServiceRoleKey: Boolean(env && env.SUPABASE_SERVICE_ROLE_KEY),
            hasJwtSecret: Boolean(env && env.JWT_SECRET),
        };
        console.error('Error executing db query:', { error, spec: (typeof spec === 'object' ? { table: spec.table, action: spec.action } : spec), envInfo });
        return jsonResponse({ data: null, error: { message: error instanceof Error ? error.message : 'Query execution failed' } }, 500);
    }
}