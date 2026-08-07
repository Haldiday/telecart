import { getConfig } from '../../helpers/config.js';
import { getSupabaseAdmin } from '../../helpers/supabase.js';
import { verifyJwt } from '../../helpers/jwt.js';
import { jsonResponse, getBearerToken } from '../../helpers/utils.js';

function getUserFromToken(request, env) {
    const token = getBearerToken(request);
    if (!token) {
        return null;
    }

    const config = getConfig(env);
    try {
        return verifyJwt(token, config.jwtSecret);
    } catch (error) {
        console.warn('Invalid or expired auth token:', error ? .message ? ? error);
        return null;
    }
}

export async function onRequestGet({ request, env }) {
    try {
        const payload = await getUserFromToken(request, env);
        if (!payload || !payload.id) {
            return jsonResponse({ success: false, message: 'Not authenticated' }, 401);
        }

        const supabase = getSupabaseAdmin(env);
        const { data: user, error } = await supabase.from('users').select('*').eq('id', payload.id).single();
        if (error) throw error;
        return jsonResponse({ success: true, user });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return jsonResponse({ success: false, message: 'Failed to fetch profile' }, 500);
    }
}

export async function onRequestPut({ request, env }) {
    try {
        const payload = await getUserFromToken(request, env);
        if (!payload || !payload.id) {
            return jsonResponse({ success: false, message: 'Not authenticated' }, 401);
        }

        const body = await request.json();
        const { full_name, company_name, profile_photo } = body;

        if (full_name !== undefined && (typeof full_name !== 'string' || full_name.length < 2 || full_name.length > 60)) {
            return jsonResponse({ success: false, message: 'Full name must be between 2 and 60 characters' }, 400);
        }

        if (company_name !== undefined && typeof company_name !== 'string') {
            return jsonResponse({ success: false, message: 'Company name must be a string' }, 400);
        }

        if (company_name !== undefined && company_name.length > 120) {
            return jsonResponse({ success: false, message: 'Company name must be less than or equal to 120 characters' }, 400);
        }

        const supabase = getSupabaseAdmin(env);
        const { data: updatedUser, error } = await supabase
            .from('users')
            .update({ full_name, company_name, profile_photo })
            .eq('id', payload.id)
            .select('*')
            .single();

        if (error) throw error;
        return jsonResponse({ success: true, user: updatedUser, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        return jsonResponse({ success: false, message: 'Failed to update profile' }, 500);
    }
}