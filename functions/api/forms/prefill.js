import { getSupabaseAdmin } from '../../helpers/supabase.js';
import { validateZohoPrefillToken, markZohoPrefillTokenUsed } from '../../helpers/zohoTokens.js';
import { jsonResponse } from '../../helpers/utils.js';

async function handlePrefill(token, env) {
    if (!token) return jsonResponse({ success: false, message: 'Invalid or expired token' }, 400);

    try {
        const tokenRecord = await validateZohoPrefillToken({ env, token });
        if (!tokenRecord) return jsonResponse({ success: false, message: 'Invalid or expired token' }, 400);

        const supabase = getSupabaseAdmin(env);
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('email, full_name, company_name, phone, first_name, last_name')
            .eq('id', tokenRecord.userId)
            .single();

        if (userError || !user) {
            console.error('Failed to load Zoho prefill user from Supabase:', userError);
            return jsonResponse({ success: false, message: 'Unable to load user data' }, 500);
        }

        await markZohoPrefillTokenUsed({ env, token });

        const responsePayload = {
            firstName: user.first_name ?? "",
            lastName: user.last_name ?? "",
            name: user.full_name || '',
            email: user.email || '',
            phone: user.phone || '',
            companyName: user.company_name || '',
        };

        console.log('Zoho prefill response field existence:', {
            firstNameExists: user.first_name != null && user.first_name !== '',
            lastNameExists: user.last_name != null && user.last_name !== '',
        });
        console.log('Zoho prefill response fields:', Object.keys(responsePayload));

        return jsonResponse(responsePayload);
    } catch (error) {
        console.error('Zoho prefilling webhook error:', error);
        return jsonResponse({ success: false, message: 'Internal server error' }, 500);
    }
}

export async function onRequestGet({ request, env }) {
    const token = new URL(request.url).searchParams.get('token');
    return handlePrefill(token, env);
}

export async function onRequestPost({ request, env }) {
    const body = await request.json();
    const token = typeof body.token === 'string' ? body.token : undefined;
    return handlePrefill(token, env);
}
