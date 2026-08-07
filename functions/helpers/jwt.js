import { SignJWT, jwtVerify } from 'jose';

const encoder = new TextEncoder();

function parseExpiresIn(value) {
    if (typeof value === 'number') {
        return value;
    }

    const trimmed = String(value).trim().toLowerCase();

    if (trimmed.endsWith('d')) {
        return Number(trimmed.slice(0, -1)) * 86400;
    }

    if (trimmed.endsWith('h')) {
        return Number(trimmed.slice(0, -1)) * 3600;
    }

    if (trimmed.endsWith('m')) {
        return Number(trimmed.slice(0, -1)) * 60;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : 0;
}

export async function signJwt(payload, secret, expiresIn) {
    const expiresInSeconds = parseExpiresIn(expiresIn);
    const expiration = Number.isFinite(expiresInSeconds) && expiresInSeconds > 0 ?
        Math.floor(Date.now() / 1000) + expiresInSeconds :
        undefined;
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(expiration)
        .sign(encoder.encode(secret));
}

export async function verifyJwt(token, secret) {
    const { payload } = await jwtVerify(token, encoder.encode(secret));
    return payload;
}