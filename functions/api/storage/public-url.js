import { jsonResponse } from '../../../helpers/utils.js';
import { getSupabaseAdmin } from '../../../helpers/supabase.js';

export async function onRequestGet({ request, env }) {
    const url = new URL(request.url);
    const bucket = url.searchParams.get('bucket') || 'uploads';
    const path = url.searchParams.get('path');

    if (!path) {
        return jsonResponse({ data: null, error: { message: 'path is required' } }, 400);
    }

    const { data } = getSupabaseAdmin(env).storage.from(bucket).getPublicUrl(path);
    return jsonResponse({ data: { publicUrl: data.publicUrl }, error: null });
}