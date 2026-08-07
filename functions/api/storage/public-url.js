import { jsonResponse } from '../../helpers/utils.js';
import { getR2Config, getR2PublicUrl } from '../../helpers/r2.js';

export async function onRequestGet({ request, env }) {
    const url = new URL(request.url);
    const bucket = url.searchParams.get('bucket');
    const path = url.searchParams.get('path');

    if (!path) {
        return jsonResponse({ data: null, error: { message: 'path is required' } }, 400);
    }

    const config = getR2Config(env);
    if (bucket && bucket !== config.bucketName) {
        return jsonResponse({ data: null, error: { message: 'Invalid storage bucket' } }, 400);
    }

    const publicUrl = getR2PublicUrl(env, path);
    return jsonResponse({ data: { publicUrl }, error: null });
}