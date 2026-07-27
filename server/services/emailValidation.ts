import axios from 'axios';

const ABSTRACT_API_URL = 'https://emailreputation.abstractapi.com/v1/';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10_000;
const DISPOSABLE_DOMAIN_BLOCKLIST = new Set([
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'yopmail.com',
  'guerrillamail.com',
  'maildrop.cc',
  'trashmail.com',
  'dispostable.com',
  'getnada.com',
  'sharklasers.com',
  'temp-mail.org',
  'tmpmail.org',
  'mailtothis.com',
  'mailsac.com',
  'mailnesia.com',
  'mintemail.com',
  'privacy-mail.top',
  'mailosaur.net',
]);

export interface EmailValidationResult {
  email: string;
  isValid: boolean;
  isDisposable: boolean;
  isValidFormat: boolean;
  raw: Record<string, any>;
  responseTimeMs: number;
}

export class EmailValidationServiceError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'EmailValidationServiceError';
  }
}

export class EmailValidationService {
  private cache = new Map<string, { expiresAt: number; value: EmailValidationResult }>();

  private normalizeEmail(email: string): string {
    const trimmedEmail = (email || '').trim();
    const atIndex = trimmedEmail.lastIndexOf('@');

    if (atIndex <= 0 || atIndex === trimmedEmail.length - 1) {
      return trimmedEmail.toLowerCase();
    }

    const localPart = trimmedEmail.slice(0, atIndex).toLowerCase();
    const domain = trimmedEmail.slice(atIndex + 1).toLowerCase();
    return `${localPart}@${domain}`;
  }

  private maskEmail(email: string): string {
    if (!email) return '***';

    const atIndex = email.lastIndexOf('@');
    if (atIndex <= 0 || atIndex === email.length - 1) {
      return '***';
    }

    const localPart = email.slice(0, atIndex);
    const domain = email.slice(atIndex + 1);

    if (localPart.length <= 2) {
      return `${localPart[0] || '*'}***@${domain}`;
    }

    const visibleStart = localPart[0];
    const visibleEnd = localPart[localPart.length - 1];
    const maskedMiddle = '*'.repeat(Math.max(1, localPart.length - 2));
    return `${visibleStart}${maskedMiddle}${visibleEnd}@${domain}`;
  }

  private logValidation(email: string, result: EmailValidationResult, status: string) {
    console.info('[Email Validation]', {
      endpoint: ABSTRACT_API_URL,
      email: this.maskEmail(email),
      status,
      isDisposable: result.isDisposable,
      isValid: result.isValid,
      responseTimeMs: result.responseTimeMs,
    });
  }

  async validateEmail(email: string): Promise<EmailValidationResult> {
    const normalizedEmail = this.normalizeEmail(email);
    const cached = this.cache.get(normalizedEmail);
    const domain = normalizedEmail.split('@')[1]?.toLowerCase();
    const isKnownDisposableDomain = Boolean(domain && DISPOSABLE_DOMAIN_BLOCKLIST.has(domain));
    const domainHasDisposableMarker = Boolean(domain && /(?:^|\.)(mailinator|tempmail|yopmail|trashmail|maildrop|guerrilla|mailnesia|tmpmail|mintemail|mailsac|mailosaur)(?:\.|$)/.test(domain));
    const apiKey = (process.env.ABSTRACT_API_KEY || '').trim();

    if (!apiKey) {
      console.warn('[Email Validation] Missing ABSTRACT_API_KEY; falling back to local disposable-domain checks only.', {
        email: this.maskEmail(normalizedEmail),
      });

      const result: EmailValidationResult = {
        email: normalizedEmail,
        isValid: !isKnownDisposableDomain && !domainHasDisposableMarker,
        isDisposable: isKnownDisposableDomain || domainHasDisposableMarker,
        isValidFormat: true,
        raw: {},
        responseTimeMs: 0,
      };

      this.cache.set(normalizedEmail, {
        expiresAt: Date.now() + CACHE_TTL_MS,
        value: result,
      });

      this.logValidation(normalizedEmail, result, 'local-fallback');
      return result;
    }

    if (cached && cached.expiresAt > Date.now()) {
      this.logValidation(normalizedEmail, cached.value, 'cache-hit');
      return cached.value;
    }

    const startTime = Date.now();

    try {
      const response = await axios.get(ABSTRACT_API_URL, {
        params: {
          api_key: apiKey,
          email: normalizedEmail,
        },
        timeout: REQUEST_TIMEOUT_MS,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      const responseTimeMs = Date.now() - startTime;
      const payload = response.data || {};
      console.log("===== ABSTRACT API RESPONSE =====");
      console.log(JSON.stringify(payload, null, 2));
      console.log("================================");
      const emailQuality = payload.email_quality || {};
      const emailDeliverability = payload.email_deliverability || {};
      const isValidFormat = emailDeliverability.is_format_valid === true;
      const isSmtpValid = emailDeliverability.is_smtp_valid === true;
      const isDeliverable = emailDeliverability.status === 'deliverable';
      const isDisposable = Boolean(emailQuality.is_disposable === true || isKnownDisposableDomain || domainHasDisposableMarker);
      const isValid = isValidFormat && isSmtpValid && isDeliverable && !isDisposable;

      const result: EmailValidationResult = {
        email: normalizedEmail,
        isValid,
        isDisposable,
        isValidFormat,
        raw: payload,
        responseTimeMs,
      };

      this.cache.set(normalizedEmail, {
        expiresAt: Date.now() + CACHE_TTL_MS,
        value: result,
      });

      this.logValidation(normalizedEmail, result, 'validated');
      return result;
    } catch (error: any) {
      const responseTimeMs = Date.now() - startTime;
      const errorMessage = error?.message || 'Email validation request failed';
      const status = error?.response?.status;
      const responseBody = error?.response?.data;

      console.error('[Email Validation] Request failed', {
        endpoint: ABSTRACT_API_URL,
        email: this.maskEmail(normalizedEmail),
        httpStatus: status,
        responseBody,
        responseTimeMs,
        error: errorMessage,
      });

      if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT' || error?.message?.includes('timeout')) {
        throw new EmailValidationServiceError('Email verification service is temporarily unavailable. Please try again later.', error);
      }

      if (status === 401 || status === 422 || status === 429 || status === 500 || status === 503) {
        throw new EmailValidationServiceError('Email verification service is temporarily unavailable. Please try again later.', error);
      }

      if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNRESET' || error?.message?.includes('Network')) {
        throw new EmailValidationServiceError('Email verification service is temporarily unavailable. Please try again later.', error);
      }

      throw new EmailValidationServiceError('Email verification service is temporarily unavailable. Please try again later.', error);
    }
  }
}
