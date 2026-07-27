import { describe, expect, it, beforeEach } from 'vitest';
import { clearZohoPrefillTokens, createZohoPrefillToken, consumeZohoPrefillToken, seedExpiredZohoPrefillToken } from './zohoPrefill.js';

describe('zoho prefill token lifecycle', () => {
  beforeEach(() => {
    clearZohoPrefillTokens();
  });

  it('creates a one-time token that returns profile data and then expires after use', async () => {
    const record = createZohoPrefillToken({
      userId: 'user-123',
      name: 'Mohd Faiz',
      email: 'faiz@example.com',
      companyName: 'BizReq',
      ttlMs: 5 * 60 * 1000,
    });

    const firstUse = consumeZohoPrefillToken(record.token);
    expect(firstUse).toMatchObject({
      name: 'Mohd Faiz',
      email: 'faiz@example.com',
      companyName: 'BizReq',
    });

    expect(consumeZohoPrefillToken(record.token)).toBeNull();
  });

  it('rejects expired tokens', async () => {
    seedExpiredZohoPrefillToken('expired-token', {
      userId: 'user-123',
      name: 'Mohd Faiz',
      email: 'faiz@example.com',
      companyName: 'BizReq',
      expiresAt: Date.now() - 1000,
    });

    const consumed = consumeZohoPrefillToken('expired-token');
    expect(consumed).toBeNull();
  });
});
