import { jsonResponse, getBearerToken } from '../../../helpers/utils.js';
import { requireAdminAuth } from '../../../helpers/supabaseAuth.js';
import { getSupabaseAdmin } from '../../../helpers/supabase.js';

export async function onRequestPost({ request, env }) {
    const auth = await requireAdminAuth(request);
    if (!auth.isAdmin) {
        return jsonResponse({ data: null, error: { message: 'Authentication required', code: 'UNAUTHORIZED' } }, 401);
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const path = formData.get('path');
    const bucket = typeof formData.get('bucket') === 'string' ? formData.get('bucket') : 'uploads';

    if (!(file instanceof File) || typeof path !== 'string') {
        return jsonResponse({ data: null, error: { message: 'File and path are required' } }, 400);
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const { error } = await getSupabaseAdmin(env).storage.from(bucket).upload(path, buffer, {
        contentType: file.type,
        upsert: false,
    });

    if (error) {
        return jsonResponse({ data: null, error: { message: error.message } }, 400);
    }

    const { data } = getSupabaseAdmin(env).storage.from(bucket).getPublicUrl(path);
    return jsonResponse({ data: { path, publicUrl: data.publicUrl }, error: null });
}