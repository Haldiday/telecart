import { consumeZohoPrefillToken } from '../../../helpers/zohoTokens.js';
import { jsonResponse } from '../../../helpers/utils.js';

export async function onRequestGet({ request }) {
    const token = new URL(request.url).searchParams.get('token');
    const payload = consumeZohoPrefillToken(token);
    if (!payload) {
        return jsonResponse({ success: false, message: 'Invalid or expired token' }, 400);
    }
    return jsonResponse(payload);
}

export async function onRequestPost({ request }) {
    const body = await request.json();
    const token = typeof body.token === 'string' ? body.token : undefined;
    const payload = consumeZohoPrefillToken(token);
    if (!payload) {
        return jsonResponse({ success: false, message: 'Invalid or expired token' }, 400);
    }
    return jsonResponse(payload);
}