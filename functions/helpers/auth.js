import { verifyJwt } from './jwt.js';
import { getBearerToken } from './utils.js';
import { getConfig } from './config.js';

export async function authenticateRequest(request) {
    const token = getBearerToken(request);
    if (!token) {
        return { isAuthenticated: false };
    }

    const config = getConfig(request.env);
    try {
        const payload = await verifyJwt(token, config.jwtSecret);
        return {
            isAuthenticated: true,
            user: {
                id: payload.id,
                email: payload.email,
            },
        };
    } catch (error) {
        return { isAuthenticated: false };
    }
}