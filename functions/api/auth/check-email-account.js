import { getSupabaseAdmin } from '../../helpers/supabase.js';
import { jsonResponse, validateEmail } from '../../helpers/utils.js';

export async function onRequestPost({ request, env }) {
    try {
        const { email } = await request.json();
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        if (!validateEmail(normalizedEmail)) return jsonResponse({ success: false, message: 'Please enter a valid email address.' }, 400);
        const { data, error } = await getSupabaseAdmin(env).from('users').select('id').eq('email', normalizedEmail).maybeSingle();
        if (error) throw error;
        return jsonResponse({ success: true, exists: Boolean(data) });
    } catch (error) {
        console.error('[Auth] Email account check failed', { error: error instanceof Error ? error.message : String(error) });
        return jsonResponse({ success: false, message: 'Unable to check this email address. Please try again.' }, 500);
    }
}
