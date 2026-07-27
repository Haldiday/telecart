const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10000;
const disposableDomains = new Set([
    'mailinator.com',
    'tempmail.com',
    '10minutemail.com',
    'yopmail.com',
    'guerrillamail.com',
    'maildrop.cc',
    'trashmail.com',
    'dispostable.com',
    'getnada.com',
    'sharklasers.com',
    'privacy-mail.top',
    'mailosaur.net',
]);

const cache = new Map();

function normalizeEmail(email) {
    const trimmed = (email || '').trim();
    const atIndex = trimmed.lastIndexOf('@');
    if (atIndex <= 0 || atIndex === trimmed.length - 1) return trimmed.toLowerCase();
    return `${trimmed.slice(0, atIndex).toLowerCase()}@${trimmed.slice(atIndex + 1).toLowerCase()}`;
}

function isDisposableDomain(domain) {
    return disposableDomains.has(domain) || /(?:^|\.)(mailinator|tempmail|yopmail|trashmail|maildrop|guerrilla|mailnesia|tmpmail|mintemail|mailsac|mailosaur)(?:\.|$)/.test(domain);
}

export class EmailValidationService {
    async validateEmail(email) {
        const normalized = normalizeEmail(email);
        const cached = cache.get(normalized);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.value;
        }

        const domain = normalized.split('@')[1] ? ? '';
        const isDisposable = isDisposableDomain(domain);
        const result = {
            email: normalized,
            isValid: !isDisposable,
            isDisposable,
            isValidFormat: true,
            raw: {},
            responseTimeMs: 0,
        };

        cache.set(normalized, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
        return result;
    }
}