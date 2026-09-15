import { getSupabaseAdmin } from '../../helpers/supabase.js';
import {
    validateZohoPrefillToken,
    markZohoPrefillTokenUsed
} from '../../helpers/zohoTokens.js';
import { jsonResponse } from '../../helpers/utils.js';

function splitFullName(fullName) {
    const normalized = typeof fullName === 'string' ? fullName.trim() : '';
    if (!normalized) {
        return { firstName: '', lastName: '' };
    }

    const parts = normalized.split(/\s+/);
    if (parts.length === 1) {
        return { firstName: parts[0], lastName: '' };
    }

    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

async function handlePrefill(token, env) {
    const maskedToken = token ? `***${token.slice(-6)}` : 'none';
    const allowUsedRetry = true;

    console.log('[prefill] validation result:', token ? 'token provided' : 'token missing');
    console.log('[prefill] masked token:', maskedToken);
    console.log('[prefill] allowUsedRetry applied:', allowUsedRetry);

    if (!token) {
        return jsonResponse({
                success: false,
                message: 'Invalid or expired token'
            },
            400
        );
    }

    try {
        const tokenRecord = await validateZohoPrefillToken({
            env,
            token,
            allowUsed: true
        });

        if (!tokenRecord) {
            console.log('[prefill] token invalid');

            return jsonResponse({
                    success: false,
                    message: 'Invalid or expired token'
                },
                400
            );
        }

        console.log('[prefill] token accepted:', {
            userId: tokenRecord.userId,
            used: tokenRecord.used
        });

        const supabase = getSupabaseAdmin(env);

        const { data: user, error: userError } = await supabase
            .from('users')
            .select(
                'email, full_name, company_name, phone, first_name, last_name'
            )
            .eq('id', tokenRecord.userId)
            .single();

        if (userError || !user) {
            console.error(
                'Failed to load Zoho prefill user from Supabase:',
                userError
            );

            return jsonResponse({
                    success: false,
                    message: 'Unable to load user data'
                },
                500
            );
        }

        await markZohoPrefillTokenUsed({
            env,
            token
        });

        const firstNameFromDb = user.first_name ? user.first_name.trim() : '';
        const lastNameFromDb = user.last_name ? user.last_name.trim() : '';
        const fallbackName = splitFullName(user.full_name || '');

        const responsePayload = {
            firstName: firstNameFromDb || fallbackName.firstName,
            lastName: lastNameFromDb || fallbackName.lastName,
            name: user.full_name || '',
            email: user.email || '',
            phone: user.phone || '',
            companyName: user.company_name || ''
        };

        console.log(
            '[prefill] response fields:',
            Object.keys(responsePayload)
        );

        return jsonResponse(responsePayload);
    } catch (error) {
        console.error(
            'Zoho prefilling webhook error:',
            error
        );

        return jsonResponse({
                success: false,
                message: 'Internal server error'
            },
            500
        );
    }
}

async function getPostToken(request) {
    const contentType =
        request.headers.get('content-type') || '';

    if (contentType.toLowerCase().includes('application/json')) {
        try {
            const body = await request.json();

            if (
                body &&
                typeof body.token === 'string'
            ) {
                return body.token;
            }

            return undefined;
        } catch (error) {
            console.warn(
                '[prefill] unable to parse JSON body:',
                error && error.message ? error.message : error
            );

            return undefined;
        }
    }

    const text = await request.text();

    try {
        const body = JSON.parse(text);

        if (
            body &&
            typeof body.token === 'string'
        ) {
            return body.token;
        }

        return undefined;
    } catch {
        const params = new URLSearchParams(text);

        return params.get('token') || undefined;
    }
}

export async function onRequestGet({ request, env }) {
    console.log('[prefill] REQUEST RECEIVED');
    console.log('[prefill] method:', request.method);
    console.log('[prefill] url:', request.url);
    console.log('[prefill] path:', new URL(request.url).pathname);

    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    console.log('[prefill] token source: query');
    console.log('[prefill] token present:', Boolean(token));

    return handlePrefill(token, env);
}

export async function onRequestPost({ request, env }) {
    console.log('[prefill] REQUEST RECEIVED');
    console.log('[prefill] method:', request.method);
    console.log('[prefill] url:', request.url);
    console.log('[prefill] path:', new URL(request.url).pathname);

    const url = new URL(request.url);

    const queryToken =
        url.searchParams.get('token');

    const bodyToken =
        await getPostToken(request);

    const token =
        queryToken || bodyToken;

    let tokenSource = 'none';

    if (queryToken) {
        tokenSource = 'query';
    } else if (bodyToken) {
        tokenSource = 'body';
    }

    console.log(
        '[prefill] token source:',
        tokenSource
    );

    console.log(
        '[prefill] token present:',
        Boolean(token)
    );

    return handlePrefill(token, env);
}