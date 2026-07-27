import 'dotenv/config';
import axios from 'axios';
import { MSG91Service } from './server/services/msg91.ts';

const originalPost = axios.post.bind(axios);
let captured: any = null;
axios.post = async (url: any, payload: any, config: any) => {
  captured = {
    url,
    payload,
    headers: config?.headers ?? null,
  };
  return originalPost(url, payload, config);
};

const service = new MSG91Service();
try {
  await service.sendOTP('mohdfaiz1472002@gmail.com');
  console.log(JSON.stringify({ success: true, captured }, null, 2));
} catch (error: any) {
  console.error(JSON.stringify({ success: false, message: error.message, captured, response: error.response?.data ?? null }, null, 2));
  process.exit(1);
}
