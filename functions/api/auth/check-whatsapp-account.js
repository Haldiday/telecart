import { getSupabaseAdmin } from '../../helpers/supabase.js';
import { jsonResponse } from '../../helpers/utils.js';
import { normalizePhone } from '../../helpers/whatsapp.js';

export async function onRequestPost({ request, env }) {
    try {
        const { phone } = await request.json();
        const normalizedPhone = normalizePhone(phone);
        if (!normalizedPhone) return jsonResponse({ success: false, message: 'Please provide a valid mobile number.' }, 400);
        const { data, error } = await getSupabaseAdmin(env).from('users').select('id').eq('phone', normalizedPhone).maybeSingle();
        if (error) throw error;
        return jsonResponse({ success: true, exists: Boolean(data) });
    } catch (error) {
        console.error('[Auth] WhatsApp account check failed', { error: error instanceof Error ? error.message : String(error) });
        return jsonResponse({ success: false, message: 'Unable to check this mobile number. Please try again.' }, 500);
    }
}
