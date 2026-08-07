import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';

const envFile = await fs.readFile(path.resolve('.env'), 'utf8');
const env = Object.fromEntries(envFile
    .split(/\r?\n/)
    .map((line) => {
        const m = line.match(/^([^#=\s]+)=(.*)$/);
        return m ? [m[1], m[2].trim()] : null;
    })
    .filter(Boolean));

const url = env.WHATSAPP_API_URL;
const phone = '918650220708';
const baseBody = { receiver: phone.slice(1), values: { 1: '123456' } };
const variations = [
    { name: 'no extra', body: {...baseBody } },
    { name: 'url_key path', body: {...baseBody, url_key: '64dhjkshdi87' } },
    { name: 'template_name', body: {...baseBody, template_name: env.WHATSAPP_TEMPLATE_NAME || 'bizreq otp' } },
    { name: 'url_key + template_name', body: {...baseBody, url_key: '64dhjkshdi87', template_name: env.WHATSAPP_TEMPLATE_NAME || 'bizreq otp' } },
    { name: 'template_key', body: {...baseBody, template_key: '64dhjkshdi87' } },
    { name: 'template_key + template_name', body: {...baseBody, template_key: '64dhjkshdi87', template_name: env.WHATSAPP_TEMPLATE_NAME || 'bizreq otp' } },
    { name: 'business_template_id', body: {...baseBody, business_template_id: '64dhjkshdi87' } },
    { name: 'url_key from env', body: {...baseBody, url_key: env.WHATSAPP_URL_KEY || '64dhjkshdi87' } },
    { name: 'template', body: {...baseBody, template: { name: env.WHATSAPP_TEMPLATE_NAME || 'bizreq otp' } } },
    { name: 'url_key + wabaId', body: {...baseBody, url_key: '64dhjkshdi87', waba_id: env.WHATSAPP_WABA_ID, phone_number_id: env.WHATSAPP_PHONE_NUMBER_ID } },
];

const headersBase = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
};
if (env.WHATSAPP_API_KEY) headersBase['api-key'] = env.WHATSAPP_API_KEY;

const authHeaders = [
    { name: 'api-key only', headers: headersBase },
    { name: 'x-api-key only', headers: {...headersBase, 'x-api-key': env.WHATSAPP_API_KEY } },
];

for (const auth of authHeaders) {
    console.log('AUTH', auth.name);
    for (const variant of variations) {
        try {
            const response = await axios.post(url, variant.body, { headers: auth.headers, timeout: 10000 });
            console.log('OK', variant.name, response.status, JSON.stringify(response.data));
        } catch (error) {
            const status = error.response && error.response.status ? error.response.status : 'NO_STATUS';
            const data = error.response && error.response.data ? error.response.data : null;
            console.log('FAIL', variant.name, status, JSON.stringify(data));
        }
    }
    console.log('---');
}