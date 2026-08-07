import { storeOtp, verifyOtp } from './otpStore.js';

export class MSG91Service {
    constructor(config) {
        this.config = config;
        this.baseUrl = 'https://control.msg91.com/api/v5';
    }

    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    getFromEmail() {
        return this.config.msg91FromEmail || (this.config.msg91EmailDomain ?
            `no-reply@${this.config.msg91EmailDomain}` :
            'no-reply@mailer91.com');
    }

    async sendOTP(email, otp) {
        if (!otp) {
            otp = this.generateOTP();
        }

        storeOtp(email, otp);
        console.info('[OTP] Stored OTP for email delivery');

        if (this.config.useFakeOtp) {
            console.info('[OTP] Fake delivery enabled');
            return { success: true, message: 'OTP sent successfully' };
        }

        if (!this.config.msg91AuthKey) {
            throw new Error('MSG91 auth key is not configured');
        }

        if (!this.config.msg91TemplateId) {
            throw new Error('MSG91 email template is not configured');
        }

        if (!this.config.msg91EmailDomain) {
            throw new Error('MSG91 email domain is not configured');
        }

        const url = `${this.baseUrl}/email/send`;
        const payload = {
            recipients: [{
                to: [{
                    name: email.split('@')[0],
                    email,
                }],
                variables: {
                    company_name: 'BizReq',
                    name: email.split('@')[0],
                    otp,
                },
            }],
            from: {
                name: 'BizReq',
                email: this.getFromEmail(),
            },
            domain: this.config.msg91EmailDomain,
            template_id: this.config.msg91TemplateId,
        };

        console.info('[MSG91] Sending OTP email', { hasAuthKey: Boolean(this.config.msg91AuthKey), hasTemplateId: Boolean(this.config.msg91TemplateId), hasEmailDomain: Boolean(this.config.msg91EmailDomain), hasFromEmail: Boolean(this.config.msg91FromEmail) });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                authkey: this.config.msg91AuthKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const body = await response.text();
        if (!response.ok) {
            throw new Error(`MSG91 send failed: ${body}`);
        }

        return { success: true, message: 'OTP sent successfully' };
    }

    async verifyOTP(email, otp) {
        verifyOtp(email, otp);
        console.info('[OTP] OTP verification successful');
        return { success: true, message: 'OTP verified successfully' };
    }
}
