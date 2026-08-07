import { jsonResponse } from '../../helpers/utils.js';
import { getR2Config } from '../../helpers/r2.js';

export async function onRequestGet({ _request, env }) {
    const config = getR2Config(env);
    return jsonResponse({ data: { provider: 'cloudflare-r2', status: 'ok', bucket: config.bucketName }, error: null });
}