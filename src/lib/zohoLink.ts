import { userAPI } from '@/services/api';

export function isZohoFormUrl(destination?: string | null): boolean {
    if (!destination) return false;

    try {
        const normalized = destination.trim();
        if (!normalized) return false;

        const parsed = new URL(normalized, window.location.origin);
        const hostname = parsed.hostname.toLowerCase();
        const pathname = parsed.pathname.toLowerCase();

        console.log('isZohoFormUrl checking', {
            destination: normalized,
            hostname,
            pathname,
        });

        const hostMatches = [
            'forms.zohopublic.com',
            'forms.zohopublic.in',
            'zohopublic.com',
            'zohopublic.in',
            'zfrmz.com',
            'zoho.com',
            'zoho.eu',
            'zoho.in',
            'forms.bizreq.com',
        ];

        const isKnownZohoHost = hostMatches.some((host) => hostname === host || hostname.endsWith(`.${host}`));
        const isZohoPath = pathname.includes('/form/') && pathname.includes('/formperma/');

        return isKnownZohoHost || isZohoPath;
    } catch (error) {
        console.warn('isZohoFormUrl parse error', error);
        return false;
    }
}

export function buildZohoPrefillRedirectUrl(destination: string, token: string): string {
    const parsed = new URL(destination, window.location.origin);
    parsed.searchParams.set('token', token);
    return parsed.toString();
}

export async function openZohoProtectedLink(options: {
    destination: string;
    navigate?: (path: string, options?: { replace?: boolean }) => void;
    onSuccess?: () => void;
    onError?: (message: string) => void;
    onUnauthenticated?: () => void;
    target?: '_blank' | '_self';
    useWindowOpen?: boolean;
}) {
    const { destination, onSuccess, onError, target = '_self', useWindowOpen = true } = options;

    if (!isZohoFormUrl(destination)) {
        console.log('Zoho URL detected', false, destination);
        if (useWindowOpen) {
            window.open(destination, target, 'noopener,noreferrer');
        } else {
            window.location.assign(destination);
        }
        onSuccess?.();
        return { handled: true, isZoho: false };
    }

    console.log('Zoho URL detected', true, destination);

    try {
        console.log('Calling generate-token API');
        const response = await userAPI.generateZohoToken({
            ttlMs: 5 * 60 * 1000,
        });

        if (!response.success || !response.token) {
            throw new Error(response.message || 'Unable to generate secure Zoho token');
        }

        const redirectUrl = buildZohoPrefillRedirectUrl(destination, response.token);
        console.log('Redirecting to Zoho with secure token', redirectUrl);

        if (useWindowOpen) {
            window.open(redirectUrl, target, 'noopener,noreferrer');
        } else {
            window.location.replace(redirectUrl);
        }

        onSuccess?.();
        return { handled: true, isZoho: true, redirectUrl };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to prepare the Zoho form link.';
        onError?.(message);
        return { handled: false, isZoho: true, error: message };
    }
}
