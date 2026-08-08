import { describe, expect, it, beforeEach } from 'vitest';
import { clearZohoPrefillTokens, createZohoPrefillToken, consumeZohoPrefillToken, seedExpiredZohoPrefillToken } from './zohoPrefill.js';

describe('zoho prefill token lifecycle', () => {
  beforeEach(() => {
    clearZohoPrefillTokens();
  });

  it('creates a one-time token that returns profile data and then expires after use', async () => {
    const record = await createZohoPrefillToken({
      userId: 'user-123',
      name: 'Mohd Faiz',
      email: 'faiz@example.com',
      companyName: 'BizReq',
      ttlMs: 5 * 60 * 1000,
    });

    const firstUse = await consumeZohoPrefillToken(record.token);
    expect(firstUse).toMatchObject({
      name: 'Mohd Faiz',
      email: 'faiz@example.com',
      companyName: 'BizReq',
    });

    expect(await consumeZohoPrefillToken(record.token)).toBeNull();
  });

  it('allows Zoho webhook retry with the same token shortly after first use', async () => {
    const record = await createZohoPrefillToken({
      userId: 'user-789',
      name: 'Retry User',
      email: 'retry@example.com',
      companyName: 'Retry Co',
      ttlMs: 5 * 60 * 1000,
    });

    const firstUse = await consumeZohoPrefillToken(record.token);
    expect(firstUse).toMatchObject({
      name: 'Retry User',
      email: 'retry@example.com',
      companyName: 'Retry Co',
    });

    const secondUse = await consumeZohoPrefillToken(record.token, { allowUsedRetry: true });
    expect(secondUse).toMatchObject({
      name: 'Retry User',
      email: 'retry@example.com',
      companyName: 'Retry Co',
    });
  });

  it('rejects expired tokens', async () => {
    await seedExpiredZohoPrefillToken('expired-token', {
      user_id: 'user-123',
      name: 'Mohd Faiz',
      email: 'faiz@example.com',
      company_name: 'BizReq',
      phone: null,
      first_name: null,
      last_name: null,
      expires_at: Date.now() - 1000,
      used: true,
    });

    const consumed = await consumeZohoPrefillToken('expired-token');
    expect(consumed).toBeNull();
  });

  it('creates and consumes tokens without Supabase when credentials are unavailable', async () => {
    const previousUrl = process.env.SUPABASE_URL;
    const previousServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
      const record = await createZohoPrefillToken({
        userId: 'user-456',
        name: 'Fallback User',
        email: 'fallback@example.com',
        companyName: 'Fallback Co',
        ttlMs: 5 * 60 * 1000,
      });

      const payload = await consumeZohoPrefillToken(record.token);
      expect(payload).toMatchObject({
        name: 'Fallback User',
        email: 'fallback@example.com',
        companyName: 'Fallback Co',
      });
    } finally {
      if (previousUrl === undefined) {
        delete process.env.SUPABASE_URL;
      } else {
        process.env.SUPABASE_URL = previousUrl;
      }

      if (previousServiceRoleKey === undefined) {
        delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      } else {
        process.env.SUPABASE_SERVICE_ROLE_KEY = previousServiceRoleKey;
      }
    }
  });
});
