import axios from 'axios';
import { config } from '../config/index.js';

// Store generated OTPs in memory so the same code can be verified later
const sentOTPs = new Map<string, string>();

export class MSG91Service {
  private apiKey: string;
  private baseUrl: string = 'https://control.msg91.com/api/v5';
  private useFakeOTP: boolean;

  constructor() {
    this.apiKey = config.msg91.authKey;
    const explicitFakeOtp = process.env.USE_FAKE_OTP === 'true';
    this.useFakeOTP = explicitFakeOtp || (!this.apiKey && process.env.NODE_ENV !== 'production');

    console.log('[MSG91] Runtime config', {
      hasAuthKey: Boolean(this.apiKey),
      templateId: this.getTemplateId(),
      domain: this.getEmailDomain(),
      fromEmail: this.getFromEmail(),
      nodeEnv: process.env.NODE_ENV,
    });
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private getTemplateId(): string {
    return config.msg91.templateId || process.env.MSG91_EMAIL_TEMPLATE_ID || '';
  }

  private getEmailDomain(): string {
    return config.msg91.emailDomain || process.env.MSG91_EMAIL_DOMAIN || '';
  }

  private getFromEmail(): string {
    return process.env.MSG91_FROM_EMAIL || process.env.MSG91_FROM_ADDRESS || `no-reply@${this.getEmailDomain() || 'mailer91.com'}`;
  }

  async sendOTP(email: string): Promise<{ success: boolean; message: string }> {
    const otp = this.generateOTP();
    sentOTPs.set(email.toLowerCase(), otp);

    if (this.useFakeOTP) {
      console.log(`[FAKE OTP] Sending OTP ${otp} to email: ${email}`);
      return {
        success: true,
        message: 'OTP sent successfully',
      };
    }

    if (!this.apiKey) {
      throw new Error('MSG91 auth key is not configured');
    }

    if (!this.getTemplateId()) {
      throw new Error('MSG91 email template is not configured');
    }

    const url = `${this.baseUrl}/email/send`;
    const method = 'POST';
    const payload = {
      recipients: [
        {
          to: [
            {
              name: email.split('@')[0],
              email,
            },
          ],
          variables: {
            company_name: 'BizReq',
            name: email.split('@')[0],
            otp,
          },
        },
      ],
      from: {
        name: 'BizReq',
        email: this.getFromEmail(),
      },
      domain: this.getEmailDomain(),
      template_id: this.getTemplateId(),
    };

    const headers = {
      accept: 'application/json',
      authkey: this.apiKey,
      'Content-Type': 'application/json',
    };

    console.log('[MSG91] Sending OTP request', {
      url,
      method,
      headers: {
        ...headers,
        authkey: '[redacted]',
      },
      payload,
      templateId: this.getTemplateId(),
      domain: this.getEmailDomain(),
      fromEmail: this.getFromEmail(),
    });

    try {
      const response = await axios.post(url, payload, { headers });

      console.log('[MSG91] Response received', {
        status: response.status,
        headers: response.headers,
        body: response.data,
      });

      if (response.status >= 200 && response.status < 300) {
        return {
          success: true,
          message: 'OTP sent successfully',
        };
      }

      throw new Error(response.data?.message || 'Failed to send OTP');
    } catch (error: any) {
      const status = error.response?.status;
      const responseHeaders = error.response?.headers;
      const responseBody = error.response?.data;

      console.error('[MSG91] Request failed', {
        url,
        method,
        status,
        headers: responseHeaders,
        body: responseBody,
        error: error.message,
      });

      throw new Error(responseBody?.message || responseBody?.errors?.message || error.message || 'Failed to send OTP');
    }
  }

  async verifyOTP(email: string, otp: string): Promise<{ success: boolean; message: string }> {
    const storedOTP = sentOTPs.get(email.toLowerCase());
    console.log(`[OTP] Verifying OTP:`, { email, otp, storedOTP });

    if (otp === storedOTP) {
      return {
        success: true,
        message: 'OTP verified successfully',
      };
    }

    throw new Error('Invalid or expired OTP');
  }
}
