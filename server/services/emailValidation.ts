import axios from 'axios';

const ABSTRACT_API_URL = 'https://emailreputation.abstractapi.com/v1/';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10_000;
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', '10minutemail.com', 'yopmail.com',
  'guerrillamail.com', 'maildrop.cc', 'trashmail.com', 'dispostable.com',
  'getnada.com', 'sharklasers.com', 'temp-mail.org', 'tmpmail.org',
  'mailtothis.com', 'mailsac.com', 'mailnesia.com', 'mintemail.com',
  'privacy-mail.top', 'mailosaur.net',
]);

export interface EmailValidationResult {
  isValid: boolean;
  isDisposable: boolean;
  isValidFormat: boolean;
  rejectionReason: 'disposable' | null;
  responseTimeMs: number;
}

export class EmailValidationServiceError extends Error {
  constructor(message: string, public reason: string) {
    super(message);
    this.name = 'EmailValidationServiceError';
  }
}

function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  return localPart && domain ? `${localPart.slice(0, 1)}***@${domain}` : '***';
}

function isDisposableDomain(domain: string): boolean {
  return DISPOSABLE_DOMAINS.has(domain) ||
    /(?:^|\.)(mailinator|tempmail|yopmail|trashmail|maildrop|guerrilla|mailnesia|tmpmail|mintemail|mailsac|mailosaur)(?:\.|$)/.test(domain);
}

function getBooleanValue(value: unknown): boolean {
  return typeof value === 'object' && value !== null
    ? (value as { value?: unknown }).value === true
    : value === true;
}

function getAbstractApiErrorReason(error: any): string {
  if (error?.code === 'ECONNABORTED') {
    return 'api_timeout';
  }

  if (error?.code === 'ENOTFOUND' || error?.code === 'EAI_AGAIN') {
    return 'api_network';
  }

  if (error?.response?.status) {
    return 'api_unavailable';
  }

  return 'api_failure';
}

export class EmailValidationService {
  private cache = new Map<string, { expiresAt: number; value: EmailValidationResult }>();

  async validateEmail(email: string): Promise<EmailValidationResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const cached = this.cache.get(normalizedEmail);
    if (cached && cached.expiresAt > Date.now()) {
      console.info('[Email Validation] Cache hit', { email: maskEmail(normalizedEmail), ...cached.value });
      return cached.value;
    }

    const domain = normalizedEmail.split('@')[1] || '';
    if (isDisposableDomain(domain)) {
      const result: EmailValidationResult = {
        isValid: false, isDisposable: true, isValidFormat: true,
        rejectionReason: 'disposable', responseTimeMs: 0,
      };
      this.cache.set(normalizedEmail, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
      console.warn('[Email Validation] Rejected disposable domain', { email: maskEmail(normalizedEmail), domain });
      return result;
    }

    const apiKey = (process.env.ABSTRACT_API_KEY || '').trim();
    if (!apiKey) {
      console.error('[Email Validation] Missing Abstract API configuration', { hasAbstractApiKey: false });
      throw new EmailValidationServiceError('Email validation is not configured. Please try again later.', 'api_key_missing');
    }

    const startTime = Date.now();
    try {
      const response = await axios.get(ABSTRACT_API_URL, {
        params: { api_key: apiKey, email: normalizedEmail },
        timeout: REQUEST_TIMEOUT_MS,
        headers: { Accept: 'application/json' },
      });
      const payload = response.data || {};
      const emailQuality = payload.email_quality || {};
      const isDisposable = getBooleanValue(emailQuality.is_disposable) ||
        getBooleanValue(payload.is_disposable_email) || getBooleanValue(payload.is_disposable) ||
        getBooleanValue(payload.disposable);
      const result: EmailValidationResult = {
        isValid: !isDisposable,
        isDisposable,
        isValidFormat: true,
        rejectionReason: isDisposable ? 'disposable' : null,
        responseTimeMs: Date.now() - startTime,
      };
      this.cache.set(normalizedEmail, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
      console.info('[Email Validation] Completed', {
        email: maskEmail(normalizedEmail), isDisposable,
        isFreeEmail: getBooleanValue(emailQuality.is_free_email) || getBooleanValue(payload.is_free_email),
        responseTimeMs: result.responseTimeMs, rejectionReason: result.rejectionReason,
      });
      return result;
    } catch (error: any) {
      const status = error?.response?.status;
      const reason = getAbstractApiErrorReason(error);
      console.error('[Email Validation] Abstract API request error', {
        email: maskEmail(normalizedEmail), httpStatus: status,
        responseTimeMs: Date.now() - startTime,
        error: error?.message || 'Unknown error',
        reason,
      });
      throw new EmailValidationServiceError('Email validation is temporarily unavailable. Please try again later.', reason);
    }
  }
}
