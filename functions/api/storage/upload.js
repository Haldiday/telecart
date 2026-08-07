import { jsonResponse } from '../../helpers/utils.js';
import { requireAdminAuth } from '../../helpers/supabaseAuth.js';
import { uploadToR2, getR2Config } from '../../helpers/r2.js';

export async function onRequestPost({ request, env }) {
    try {
        const auth = await requireAdminAuth(request);
        if (!auth.isAdmin) {
            return jsonResponse({ data: null, error: { message: 'Authentication required', code: 'UNAUTHORIZED' } }, 401);
        }

        const formData = await request.formData();
        const file = formData.get('file');
        const path = formData.get('path');

        if (!(file instanceof File) || typeof path !== 'string') {
            return jsonResponse({ data: null, error: { message: 'File and path are required' } }, 400);
        }

        const config = getR2Config(env);
        console.log('R2 upload config:', { bucketName: config.bucketName, publicUrl: config.publicUrl });
        const buffer = new Uint8Array(await file.arrayBuffer());
        const { publicUrl } = await uploadToR2(env, config.bucketName, path, buffer, file.type || 'application/octet-stream');

        return jsonResponse({ data: { path, publicUrl }, error: null });
    } catch (error) {
        console.error('R2 upload error:', error);
        return jsonResponse({
            data: null,
            error: {
                message: error instanceof Error ? error.message : 'Upload failed',
            },
        }, 500);
    }
}