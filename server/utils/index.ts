export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateOTP(otp: string): boolean {
  return /^\d{4,6}$/.test(otp);
}
