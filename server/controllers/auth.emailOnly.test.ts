import { describe, expect, it } from 'vitest';
import { SIGNUP_DUPLICATE_PHONE_MESSAGE } from './auth.js';

describe('email-only auth flow', () => {
  it('uses the duplicate-mobile message when a mobile number already exists', () => {
    expect(SIGNUP_DUPLICATE_PHONE_MESSAGE).toBe(
      'This Mobile number is already registered use different mobile number'
    );
  });
});
