const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10_000;
const ABSTRACT_API_URL = 'https://emailreputation.abstractapi.com/v1/';
const DISPOSABLE_DOMAINS = new Set([
    'mailinator.com', 'tempmail.com', '10minutemail.com', 'yopmail.com',
    'guerrillamail.com', 'maildrop.cc', 'trashmail.com', 'dispostable.com',
    'getnada.com', 'sharklasers.com', 'temp-mail.org', 'tmpmail.org',
    'mailtothis.com', 'mailsac.com', 'mailnesia.com', 'mintemail.com',
    'privacy-mail.top', 'mailosaur.net',
]);

const cache = new Map();

function normalizeEmail(email) {
    const trimmedEmail = (email || '').trim();
    const atIndex = trimmedEmail.lastIndexOf('@');
    if (atIndex <= 0 || atIndex === trimmedEmail.length - 1) return trimmedEmail.toLowerCase();
    return `${trimmedEmail.slice(0, atIndex).toLowerCase()}@${trimmedEmail.slice(atIndex + 1).toLowerCase()}`;
}

function maskEmail(email) {
    const [localPart, domain] = String(email).split('@');
    if (!localPart || !domain) return '***';
    return `${localPart.slice(0, 1)}***@${domain}`;
}

function isDisposableDomain(domain) {
    return DISPOSABLE_DOMAINS.has(domain) ||
        /(?:^|\.)(mailinator|tempmail|yopmail|trashmail|maildrop|guerrilla|mailnesia|tmpmail|mintemail|mailsac|mailosaur)(?:\.|$)/.test(domain);
}

function getBooleanValue(value) {
    return typeof value === 'object' && value !== null ? value.value === true : value === true;
}

export class EmailValidationServiceError extends Error {
    constructor(message, reason) {
        super(message);
        this.name = 'EmailValidationServiceError';
        this.reason = reason;
    }
}

export class EmailValidationService {
    async validateEmail(email, env) {
        const normalizedEmail = normalizeEmail(email);
        const cached = cache.get(normalizedEmail);
        if (cached && cached.expiresAt > Date.now()) {
            console.info('[Email Validation] Cache hit', { email: maskEmail(normalizedEmail), ...cached.value });
            return cached.value;
        }

        const domain = normalizedEmail.split('@')[1] || '';
        const localDisposable = isDisposableDomain(domain);
        if (localDisposable) {
            const result = {
                isValid: false,
                isDisposable: true,
                isValidFormat: true,
                rejectionReason: 'disposable',
                responseTimeMs: 0,
            };
            cache.set(normalizedEmail, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
            console.warn('[Email Validation] Rejected disposable domain', { email: maskEmail(normalizedEmail), domain });
            return result;
        }

        const apiKey = String(env?.ABSTRACT_API_KEY || '').trim();
        if (!apiKey) {
            console.error('[Email Validation] Missing Abstract API configuration', { hasAbstractApiKey: false });
            throw new EmailValidationServiceError('Email validation is not configured. Please try again later.', 'api_key_missing');
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        const startTime = Date.now();
        try {
            const url = new URL(ABSTRACT_API_URL);
            url.searchParams.set('api_key', apiKey);
            url.searchParams.set('email', normalizedEmail);
            const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
            const payload = await response.json().catch(() => ({}));
            const responseTimeMs = Date.now() - startTime;
            if (!response.ok) {
                console.error('[Email Validation] Abstract API request failed', {
                    email: maskEmail(normalizedEmail), httpStatus: response.status, responseTimeMs,
                });
                throw new EmailValidationServiceError('Email validation is temporarily unavailable. Please try again later.', 'api_unavailable');
            }

            const emailQuality = payload.email_quality || {};
            const isDisposable = getBooleanValue(emailQuality.is_disposable) ||
                getBooleanValue(payload.is_disposable_email) || getBooleanValue(payload.is_disposable) ||
                getBooleanValue(payload.disposable);
            const result = {
                isValid: !isDisposable,
                isDisposable,
                isValidFormat: true,
                rejectionReason: isDisposable ? 'disposable' : null,
                responseTimeMs,
            };
            cache.set(normalizedEmail, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
            console.info('[Email Validation] Completed', {
                email: maskEmail(normalizedEmail), isDisposable, isFreeEmail: getBooleanValue(emailQuality.is_free_email) || getBooleanValue(payload.is_free_email),
                responseTimeMs, rejectionReason: result.rejectionReason,
            });
            return result;
        } catch (error) {
            if (error instanceof EmailValidationServiceError) throw error;
            const reason = error?.name === 'AbortError' ? 'api_timeout' : 'api_failure';
            console.error('[Email Validation] Abstract API request error', {
                email: maskEmail(normalizedEmail), reason, error: error instanceof Error ? error.message : String(error),
            });
            throw new EmailValidationServiceError('Email validation is temporarily unavailable. Please try again later.', reason);
        } finally {
            clearTimeout(timeout);
        }
    }
}
