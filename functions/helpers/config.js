export function getConfig(env) {
    const supabaseUrl = String(env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').trim();
    const supabaseServiceRoleKey = String(env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    const jwtSecret = String(env.JWT_SECRET || '').trim();
    const msg91AuthKey = String(env.MSG91_AUTH_KEY || '').trim();
    const msg91TemplateId = String(env.MSG91_TEMPLATE_ID || '').trim();
    const msg91EmailDomain = String(env.MSG91_EMAIL_DOMAIN || '').trim();
    const msg91FromEmail = String(env.MSG91_FROM_EMAIL || '').trim();
    const abstractApiKey = String(env.ABSTRACT_API_KEY || '').trim();
    const useFakeOtp = String(env.USE_FAKE_OTP || '').trim().toLowerCase() === 'true';
    const jwtExpiresIn = String(env.JWT_EXPIRES_IN || '7d').trim();

    if (!supabaseUrl) {
        throw new Error('Missing SUPABASE_URL or VITE_SUPABASE_URL environment variable');
    }

    if (!supabaseServiceRoleKey) {
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    }

    if (!jwtSecret) {
        throw new Error('Missing JWT_SECRET environment variable');
    }

    return {
        supabaseUrl,
        supabaseServiceRoleKey,
        jwtSecret,
        jwtExpiresIn,
        msg91AuthKey,
        msg91TemplateId,
        msg91EmailDomain,
        msg91FromEmail,
        abstractApiKey,
        useFakeOtp,
    };
}