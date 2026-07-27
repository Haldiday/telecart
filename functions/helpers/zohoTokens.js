const tokens = new Map();

export function createZohoPrefillToken({ userId, name, email, companyName, ttlMs = 300000 }) {
    pruneExpired();
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + Math.max(1000, ttlMs);
    const record = { token, userId, name, email, companyName, expiresAt };
    tokens.set(token, record);
    return record;
}

export function consumeZohoPrefillToken(token) {
    pruneExpired();
    if (!token || !tokens.has(token)) {
        return null;
    }
    const record = tokens.get(token);
    if (!record || record.expiresAt <= Date.now()) {
        tokens.delete(token);
        return null;
    }
    tokens.delete(token);
    return {
        name: record.name,
        email: record.email,
        companyName: record.companyName,
    };
}

function pruneExpired() {
    const now = Date.now();
    for (const [key, record] of tokens.entries()) {
        if (record.expiresAt <= now) {
            tokens.delete(key);
        }
    }
}