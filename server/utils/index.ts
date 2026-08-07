// Shared input validation helpers used across the BizReq auth and profile APIs.
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
  const normalized = String(phone || '').trim().replace(/[^\d+]/g, '');
  return /^\+?[1-9]\d{9,14}$/.test(normalized);
}

export function validateOTP(otp: string): boolean {
  return /^\d{4,6}$/.test(otp);
}
