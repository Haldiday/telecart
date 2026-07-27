import 'dotenv/config';
import axios from 'axios';
import { MSG91Service } from './server/services/msg91.ts';

const service = new MSG91Service();

try {
  await service.sendOTP('mohdfaiz1472002@gmail.com');
} catch (error) {
  const err = error;
  const responseData = err.response?.data ?? null;
  console.log(JSON.stringify({ message: err.message, responseData }, null, 2));
}
