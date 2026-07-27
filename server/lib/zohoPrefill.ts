import { randomUUID } from 'crypto';

interface ZohoPrefillTokenRecord {
  token: string;
  userId: string;
  name: string;
  email: string;
  companyName: string;
  expiresAt: number;
}

const zohoPrefillTokens = new Map<string, ZohoPrefillTokenRecord>();

export interface CreateZohoPrefillTokenInput {
  userId: string;
  name: string;
  email: string;
  companyName: string;
  ttlMs?: number;
}

export interface ZohoPrefillPayload {
  name: string;
  email: string;
  companyName: string;
}

function pruneExpiredTokens() {
  const now = Date.now();
  for (const [token, record] of zohoPrefillTokens.entries()) {
    if (record.expiresAt <= now) {
      zohoPrefillTokens.delete(token);
    }
  }
}

export function createZohoPrefillToken(input: CreateZohoPrefillTokenInput) {
  pruneExpiredTokens();

  const token = randomUUID();
  const ttlMs = input.ttlMs ?? 5 * 60 * 1000;
  const expiresAt = Date.now() + Math.max(1, ttlMs);
  const record: ZohoPrefillTokenRecord = {
    token,
    userId: input.userId,
    name: input.name,
    email: input.email,
    companyName: input.companyName,
    expiresAt,
  };

  zohoPrefillTokens.set(token, record);
  return record;
}

export function consumeZohoPrefillToken(token: string | undefined): ZohoPrefillPayload | null {
  if (!token) {
    return null;
  }

  pruneExpiredTokens();
  const record = zohoPrefillTokens.get(token);

  if (!record) {
    return null;
  }

  if (record.expiresAt <= Date.now()) {
    zohoPrefillTokens.delete(token);
    return null;
  }

  zohoPrefillTokens.delete(token);
  return {
    name: record.name,
    email: record.email,
    companyName: record.companyName,
  };
}

export function clearZohoPrefillTokens() {
  zohoPrefillTokens.clear();
}

export function seedExpiredZohoPrefillToken(token: string, record: Omit<ZohoPrefillTokenRecord, 'token'>) {
  zohoPrefillTokens.set(token, { ...record, token });
}
