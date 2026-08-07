const DEFAULT_WHATSAPP_API_URL = 'https://adminapis.backendprod.com/lms_campaign/api/whatsapp/template/54p9v2sbfn/process';
const REQUEST_TIMEOUT_MS = 10000;

export class WhatsAppServiceError extends Error {
    constructor(message, reason, status = 502) {
        super(message);
        this.name = 'WhatsAppServiceError';
        this.reason = reason;
        this.status = status;
    }
}

export function normalizePhone(phone) {
    const value = String(phone || '').trim().replace(/[\s()-]/g, '');
    const withCountryCode = /^\d{10}$/.test(value) ? `+91${value}` : value.startsWith('+') ? value : `+${value}`;
    return /^\+[1-9]\d{9,14}$/.test(withCountryCode) ? withCountryCode : null;
}

export function generateWhatsAppOtp() {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return String(100000 + (values[0] % 900000));
}

export async function sendWhatsAppOtp(phone, otp, env) {
    const apiUrl = String(env.WHATSAPP_API_URL || DEFAULT_WHATSAPP_API_URL).trim();
    if (!apiUrl) {
        throw new WhatsAppServiceError('WhatsApp OTP is not configured. Please try again later.', 'api_url_missing', 500);
    }

    const whatsappApiKey = String(env.WHATSAPP_API_KEY || '').trim();
    const authToken = String(env.WHATSAPP_AUTH_TOKEN || '').trim();

    const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;

    // If whatsappApiKey is present, include both common header names for robustness
    if (whatsappApiKey) {
        headers['api-key'] = whatsappApiKey;
        // some providers expect x-api-key
        if (!headers['x-api-key']) headers['x-api-key'] = whatsappApiKey;
    }

    const maskedHeaders = Object.fromEntries(
        Object.entries(headers).map(([key, value]) => [key, typeof value === 'string' && /api-key|authorization/i.test(key) ? '***' : value])
    );

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        // Some providers expect the receiver without a leading '+'
        const receiver = typeof phone === 'string' && phone.startsWith('+') ? phone.slice(1) : phone;
        const body = { receiver: receiver, values: { 1: otp } };
        console.info('[WhatsApp OTP] Sending template request', {
            requestUrl: apiUrl,
            method: 'POST',
            headers: maskedHeaders,
            body,
        });

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers,
            signal: controller.signal,
            body: JSON.stringify(body),
        });

        const rawText = await response.text().catch(() => null);
        let responseBody = null;
        try {
            responseBody = rawText ? JSON.parse(rawText) : null;
        } catch (e) {
            responseBody = rawText;
        }
        console.info('[WhatsApp OTP] Template request response', { status: response.status, headers: Object.fromEntries(response.headers && response.headers.entries ? Array.from(response.headers.entries()) : []), body: responseBody, bodyString: typeof responseBody === 'object' ? JSON.stringify(responseBody) : String(responseBody) });

        if (!response.ok) {
            console.error('[WhatsApp OTP] Template request failed', { status: response.status, responseBody });
            // Surface provider response to logs; client will get a generic error
            throw new WhatsAppServiceError('WhatsApp provider returned an error', 'api_failure', 502);
        }

        const validResponse =
            responseBody &&
            responseBody.messaging_product === 'whatsapp' &&
            Array.isArray(responseBody.contacts) &&
            responseBody.contacts.length > 0 &&
            Array.isArray(responseBody.messages) &&
            responseBody.messages[0] && responseBody.messages[0].message_status === 'accepted';

        if (!validResponse) {
            console.error('[WhatsApp OTP] Unexpected provider response', { responseBody });
            throw new WhatsAppServiceError('Unable to send WhatsApp OTP right now. Please try again.', 'invalid_response', 502);
        }

        console.info('[WhatsApp OTP] Template request accepted', { status: response.status, phoneSuffix: phone.slice(-4) });
    } catch (err) {
        // Normalize error handling without optional chaining to avoid build parser issues
        const error = err;
        if (error instanceof WhatsAppServiceError) throw error;
        const timedOut = error && error.name === 'AbortError';
        const status = error && error.response && error.response.status ? error.response.status : null;
        const body = error && error.response && (error.response.data || error.response.text) ? error.response.data || error.response.text : null;
        console.error('[WhatsApp OTP] Template request error', { status, body, bodyString: typeof body === 'object' ? JSON.stringify(body) : String(body), phoneSuffix: phone.slice(-4), message: error && error.message ? error.message : String(error) });

        if (status) {
            const providerMsg = typeof body === 'object' ? JSON.stringify(body) : String(body);
            throw new WhatsAppServiceError(`WhatsApp provider rejected the request (${status}): ${providerMsg}`, 'provider_error', 502);
        }

        throw new WhatsAppServiceError(timedOut ? 'WhatsApp OTP request timed out. Please try again.' : 'Unable to send WhatsApp OTP right now. Please try again.', timedOut ? 'timeout' : 'network_error', timedOut ? 503 : 502);
    } finally {
        clearTimeout(timeout);
    }
}