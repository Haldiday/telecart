import { jsonResponse } from '../../helpers/utils.js';
import { requireAdminAuth } from '../../helpers/supabaseAuth.js';
import { deleteFromR2, getR2Config } from '../../helpers/r2.js';

export async function onRequestPost({ request, env }) {
    const auth = await requireAdminAuth(request);
    if (!auth.isAdmin) {
        return jsonResponse({ data: null, error: { message: 'Authentication required', code: 'UNAUTHORIZED' } }, 401);
    }

    const body = await request.json();
    const bucket = typeof body.bucket === 'string' ? body.bucket : undefined;
    const paths = Array.isArray(body.paths) ? body.paths : [];

    if (!paths.length) {
        return jsonResponse({ data: null, error: { message: 'paths array is required' } }, 400);
    }

    const config = getR2Config(env);
    if (bucket && bucket !== config.bucketName) {
        return jsonResponse({ data: null, error: { message: 'Invalid storage bucket' } }, 400);
    }

    await Promise.all(paths.map((path) => deleteFromR2(env, config.bucketName, path)));
    return jsonResponse({ data: { removed: paths }, error: null });
}