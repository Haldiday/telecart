export class MSG91Service {
    constructor(config) {
        this.config = config;
        this.baseUrl = 'https://control.msg91.com/api/v5';
    }

    generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    getFromEmail() {
        return this.config.msg91EmailDomain ?
            `no-reply@${this.config.msg91EmailDomain}` :
            'no-reply@mailer91.com';
    }

    async sendOTP(email, otp) {
        if (!this.config.msg91AuthKey && !this.config.useFakeOtp) {
            throw new Error('MSG91 auth key is not configured');
        }

        if (this.config.useFakeOtp) {
            console.log(`[FAKE OTP] Sending OTP ${otp} to email: ${email}`);
            return { success: true, message: 'OTP sent successfully' };
        }

        if (!this.config.msg91TemplateId) {
            throw new Error('MSG91 email template is not configured');
        }

        const url = `${this.baseUrl}/email/send`;
        const payload = {
            recipients: [{
                to: [{
                    name: email.split('@')[0],
                    email,
                }, ],
                variables: {
                    company_name: 'BizReq',
                    name: email.split('@')[0],
                    otp,
                },
            }, ],
            from: {
                name: 'BizReq',
                email: this.getFromEmail(),
            },
            domain: this.config.msg91EmailDomain,
            template_id: this.config.msg91TemplateId,
        };

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
}