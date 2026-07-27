import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import axios from 'axios';

const mockedAxios = axios as unknown as {
  post: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
};

describe('MSG91Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.USE_FAKE_OTP = 'true';
    process.env.NODE_ENV = 'test';
  });

  it('generates a fresh OTP for each send request in development', async () => {
    const { MSG91Service } = await import('../../server/services/msg91');
    const service = new MSG91Service();

    const first = await service.sendOTP('user@example.com');
    const second = await service.sendOTP('user@example.com');

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(first.message).toBe('OTP sent successfully');
    expect(second.message).toBe('OTP sent successfully');

    await expect(service.verifyOTP('user@example.com', '123456')).rejects.toThrow('Invalid or expired OTP');
  });

  it('uses the MSG91 email endpoint for real email delivery', async () => {
    mockedAxios.post.mockResolvedValue({ status: 200, data: { type: 'success' } });
    process.env.USE_FAKE_OTP = 'false';
    process.env.MSG91_AUTH_KEY = 'test-key';
    process.env.MSG91_TEMPLATE_ID = 'biz_otp';
    process.env.MSG91_EMAIL_DOMAIN = 'auth.bizreq.com';
    process.env.NODE_ENV = 'production';

    const { MSG91Service } = await import('../../server/services/msg91');
    const service = new MSG91Service();
    await service.sendOTP('user@example.com');

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://control.msg91.com/api/v5/email/send',
      expect.objectContaining({
        template_id: 'biz_otp',
        domain: 'auth.bizreq.com',
        recipients: [
          expect.objectContaining({
            to: [expect.objectContaining({ email: 'user@example.com' })],
            variables: expect.objectContaining({
              company_name: 'BizReq',
              name: 'user',
              otp: expect.any(String),
            }),
          }),
        ],
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          authkey: expect.any(String),
          'Content-Type': 'application/json',
        }),
      }),
    );
  });
});
