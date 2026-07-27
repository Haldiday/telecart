export function getConfig(env) {
    const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
    const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
    const jwtSecret = env.JWT_SECRET;
    const msg91AuthKey = env.MSG91_AUTH_KEY || '';
    const msg91TemplateId = env.MSG91_TEMPLATE_ID || '';
    const msg91EmailDomain = env.MSG91_EMAIL_DOMAIN || '';
    const abstractApiKey = env.ABSTRACT_API_KEY || '';
    const useFakeOtp = env.USE_FAKE_OTP === 'true';
    const jwtExpiresIn = env.JWT_EXPIRES_IN || '7d';

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
        abstractApiKey,
        useFakeOtp,
    };
}