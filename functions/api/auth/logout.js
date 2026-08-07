import { jsonResponse } from '../../helpers/utils.js';

export async function onRequestPost() {
    return jsonResponse({ success: true, message: 'Logged out successfully' });
}