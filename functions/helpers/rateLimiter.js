const rateStore = new Map();

export function getRateLimitEntries(key) {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const entries = (rateStore.get(key) || []).filter((timestamp) => timestamp > now - windowMs);
    rateStore.set(key, entries);
    return entries;
}

export function consumeRateLimit(key, maxRequests, windowMs = 15 * 60 * 1000) {
    const now = Date.now();
    const entries = (rateStore.get(key) || []).filter((timestamp) => timestamp > now - windowMs);
    if (entries.length >= maxRequests) {
        rateStore.set(key, entries);
        return false;
    }
    entries.push(now);
    rateStore.set(key, entries);
    return true;
}

export function getClientIp(request) {
    return (
        request.headers.get('cf-connecting-ip') ||
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown'
    );
}