import { jsonResponse } from '../../../helpers/utils.js';
import { requireAdminAuth } from '../../../helpers/supabaseAuth.js';
import { getSupabaseAdmin } from '../../../helpers/supabase.js';

export async function onRequestPost({ request, env }) {
    const auth = await requireAdminAuth(request);
    if (!auth.isAdmin) {
        return jsonResponse({ data: null, error: { message: 'Authentication required', code: 'UNAUTHORIZED' } }, 401);
    }

    const body = await request.json();
    const bucket = typeof body.bucket === 'string' ? body.bucket : 'uploads';
    const paths = Array.isArray(body.paths) ? body.paths : [];

    if (!paths.length) {
        return jsonResponse({ data: null, error: { message: 'paths array is required' } }, 400);
    }

    const { error } = await getSupabaseAdmin(env).storage.from(bucket).remove(paths);
    if (error) {
        return jsonResponse({ data: null, error: { message: error.message } }, 400);
    }

    return jsonResponse({ data: { removed: paths }, error: null });
}