import { describe, expect, it } from 'vitest';
import { buildZohoPrefillRedirectUrl, isZohoFormUrl } from './zohoLink';

describe('zoho link helpers', () => {
    it('detects common Zoho form hosts', () => {
        expect(isZohoFormUrl('https://forms.zohopublic.com/foo/bar')).toBe(true);
        expect(isZohoFormUrl('https://forms.zohopublic.in/foo/bar')).toBe(true);
        expect(isZohoFormUrl('https://www.zoho.eu/forms/abc')).toBe(true);
        expect(isZohoFormUrl('https://example.com/form')).toBe(false);
        expect(isZohoFormUrl('')).toBe(false);
    });

    it('detects custom Zoho form domains and path patterns', () => {
        expect(isZohoFormUrl('https://forms.bizreq.com/BizReq/form/NLD/formperma/yLE0dNrfvGdVDjd5wgbK5unFp6qUc8fqbGJcJIfPzOI')).toBe(true);
        expect(isZohoFormUrl('https://example.com/BizReq/form/NLD/formperma/abc')).toBe(true);
        expect(isZohoFormUrl('https://example.com/other/path')).toBe(false);
    });

    it('preserves existing query params while adding the token', () => {
        const redirectUrl = buildZohoPrefillRedirectUrl('https://forms.zohopublic.com/foo/bar?source=app', 'abc123');

        expect(redirectUrl).toContain('token=abc123');
        expect(redirectUrl).toContain('source=app');
        expect(redirectUrl).toContain('https://forms.zohopublic.com/foo/bar');
    });
});
