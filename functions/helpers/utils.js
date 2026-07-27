export function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'content-type': 'application/json;charset=UTF-8',
        },
    });
}

export function validateEmail(email) {
    if (typeof email !== 'string') {
        return false;
    }
    const normalizedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(normalizedEmail);
}

export function validateOTP(otp) {
    return typeof otp === 'string' && /^\d{4,6}$/.test(otp);
}

export function getBearerToken(request) {
    const header = request.headers.get('authorization');
    if (!header) return null;
    const match = header.match(/^Bearer\s+(.+)$/i);
    return match ? match[1] : null;
}