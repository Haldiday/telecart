import { createClient } from '@supabase/supabase-js';
import { getConfig } from './config.js';

let supabaseClient = null;

export function getSupabaseAdmin(env) {
    if (supabaseClient) {
        return supabaseClient;
    }

    const config = getConfig(env);
    supabaseClient = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
        global: {
            fetch,
        },
    });
    return supabaseClient;
}