import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { EmailValidationService } from '../../server/services/emailValidation';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedAxios = vi.mocked(axios, true);

describe('EmailValidationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ABSTRACT_API_KEY = 'test-key';
  });

  it('reuses cached results for repeated validation requests', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        email_quality: { is_disposable: false },
        email_deliverability: {
          is_format_valid: true,
          is_smtp_valid: true,
          status: 'deliverable',
        },
      },
    });

    const service = new EmailValidationService();
    const first = await service.validateEmail('  Test@Example.com  ');
    const second = await service.validateEmail('test@example.com');

    expect(first.isValid).toBe(true);
    expect(second.isValid).toBe(true);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('blocks known disposable domains even when the provider payload does not flag them', async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        email_quality: { is_disposable: false },
        email_deliverability: {
          is_format_valid: true,
          is_smtp_valid: true,
          status: 'deliverable',
        },
      },
    });

    const service = new EmailValidationService();
    const result = await service.validateEmail('test@tempmail.com');

    expect(result.isDisposable).toBe(true);
    expect(result.isValid).toBe(false);
  });
});
