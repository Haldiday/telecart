import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { resumePendingAuthDestination } from '@/lib/authGuard';

const initialForm = {
  first_name: '',
  last_name: '',
  company_name: '',
  email: '',
  phone: '',
};

export const SignupFlow: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailResendSeconds, setEmailResendSeconds] = useState(0);
  const [phoneResendSeconds, setPhoneResendSeconds] = useState(0);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [sendNotifications, setSendNotifications] = useState(false);

  const isFilled = (value: string) => value.trim().length > 0;
  const isEmailValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const hasRequiredFields =
    isFilled(form.first_name) &&
    isFilled(form.last_name) &&
    isFilled(form.company_name) &&
    isFilled(form.email) &&
    isFilled(form.phone);

  const emailFieldMessage =
    !isFilled(form.email) && isFilled(form.phone)
      ? 'Please enter your email address.'
      : form.email && !isEmailValid(form.email)
      ? 'Please enter a valid email address.'
      : '';

  const phoneFieldMessage =
    !isFilled(form.phone) && isFilled(form.email)
      ? 'Please enter your mobile number.'
      : '';

  const canSendEmailOTP =
    isFilled(form.email) &&
    isEmailValid(form.email) &&
    !loading &&
    !emailVerified &&
    emailResendSeconds === 0;

  const canSendPhoneOTP =
    isFilled(form.phone) &&
    !loading &&
    !phoneVerified &&
    phoneResendSeconds === 0;

  const canCreateAccount =
    isFilled(form.first_name) &&
    isFilled(form.last_name) &&
    isFilled(form.company_name) &&
    emailVerified &&
    phoneVerified &&
    agreeToTerms &&
    !loading;

  const normalizeSignupError = (message: string) => {
    if (/already.*register/i.test(message)) {
      return 'This Email id is already registered. Please login.';
    }
    return message;
  };

  useEffect(() => {
    if (emailResendSeconds <= 0) return;
    const timer = window.setTimeout(() => setEmailResendSeconds((prev) => Math.max(prev - 1, 0)), 1000);
    return () => window.clearTimeout(timer);
  }, [emailResendSeconds]);

  useEffect(() => {
    if (phoneResendSeconds <= 0) return;
    const timer = window.setTimeout(() => setPhoneResendSeconds((prev) => Math.max(prev - 1, 0)), 1000);
    return () => window.clearTimeout(timer);
  }, [phoneResendSeconds]);

  const triggerEmailOtp = async () => {
    if (!isFilled(form.email)) {
      return setError('Please enter your email address.');
    }
    if (!isEmailValid(form.email)) {
      return setError('Please enter a valid email address.');
    }

    try {
      setError(null);
      setLoading(true);
      const response = await authAPI.signupSendEmailOTP({
        ...form,
        phone: form.phone || '',
      });
      if (!response.success) {
        throw new Error(response.message || 'Unable to send email OTP.');
      }
      setEmailOtpSent(true);
      setEmailResendSeconds(60);
      toast({ title: 'Email OTP sent', description: 'Please enter the code you received in your inbox.' });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Unable to send the email OTP.');
    } finally {
      setLoading(false);
    }
  };

  const triggerPhoneOtp = async () => {
    if (!isFilled(form.phone)) {
      return setError('Please enter your mobile number.');
    }

    try {
      setError(null);
      setLoading(true);
      const response = await authAPI.signupSendPhoneOTP({
        ...form,
        email: form.email || '',
      });
      if (!response.success) {
        throw new Error(response.message || 'Unable to send phone OTP.');
      }
      setPhoneOtpSent(true);
      setPhoneResendSeconds(60);
      toast({ title: 'Phone OTP sent', description: 'Please enter the code you received on your phone.' });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Unable to send the phone OTP.');
    } finally {
      setLoading(false);
    }
  };

  const submitSignupCheck = async () => {
    try {
      setError(null);
      if (!agreeToTerms) {
        throw new Error('Please agree to the Privacy Policy and Terms & Conditions to continue.');
      }
      if (!emailVerified || !phoneVerified) {
        throw new Error('Please verify both email and phone before creating your account.');
      }
      setLoading(true);
      const completion = await authAPI.signupComplete(form);
      if (!completion.success || !completion.token || !completion.user) {
        throw new Error(completion.message || 'Unable to finish account creation.');
      }
      login(completion.token, completion.user);
      const resumed = resumePendingAuthDestination({ navigate });
      if (!resumed) {
        navigate('/');
      }
      toast({ title: 'Account created', description: 'Your BizReq account is ready.' });
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Unable to continue with signup.';
      setError(message);
      if (message.includes('Please login')) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailOtp = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await authAPI.signupVerifyEmailOTP({ email: form.email, otp: emailOtp });
      if (!response.success) {
        throw new Error(response.message || 'Email verification failed.');
      }
      setEmailVerified(true);
      toast({ title: 'Email verified', description: 'Please verify your phone number now.' });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Unable to verify your email OTP.');
    } finally {
      setLoading(false);
    }
  };

  const verifyPhoneOtp = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await authAPI.signupVerifyPhoneOTP({ email: form.email, phone: form.phone, otp: phoneOtp });
      if (!response.success) {
        throw new Error(response.message || 'Phone verification failed.');
      }
      setPhoneVerified(true);
      toast({ title: 'Phone verified', description: 'You can now finish your signup and create your account.' });
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Unable to verify your phone OTP.');
    } finally {
      setLoading(false);
    }
  };

  const onFieldChange = (field: keyof typeof initialForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] px-4 py-6 sm:px-6 lg:px-8">
      <div className="relative mx-auto w-full max-w-[460px] rounded-[15px] bg-white px-5 py-7 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:px-8 sm:py-8">
        <button
          type="button"
          aria-label="Close"
          onClick={() => navigate(-1)}
          className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
        >
          ×
        </button>

        <div className="mb-3 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-black">Biz<span className="text-[#1d4ed8]">Req</span></h1>
          <p className="mt-1 text-[1.35rem] font-semibold text-gray-800">Create Account</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 0 && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name" className="text-sm font-medium text-slate-700">First Name</Label>
                <Input id="first_name" value={form.first_name} onChange={(e) => onFieldChange('first_name', e.target.value)} placeholder="Enter your first name" className="h-11 rounded-[10px] border border-gray-200 bg-white px-4 text-[15px] shadow-sm" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="last_name" className="text-sm font-medium text-slate-700">Last Name</Label>
                <Input id="last_name" value={form.last_name} onChange={(e) => onFieldChange('last_name', e.target.value)} placeholder="Enter your last name" className="h-11 rounded-[10px] border border-gray-200 bg-white px-4 text-[15px] shadow-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_name" className="text-sm font-medium text-slate-700">Company Name</Label>
              <Input id="company_name" value={form.company_name} onChange={(e) => onFieldChange('company_name', e.target.value)} placeholder="Enter your company name" className="h-11 rounded-[10px] border border-gray-200 bg-white px-4 text-[15px] shadow-sm" />
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
                <div className="flex items-center gap-2">
                  <Input id="email" type="email" value={form.email} onChange={(e) => onFieldChange('email', e.target.value)} placeholder="name@example.com" className="flex-1 h-11 rounded-[10px] border border-gray-200 bg-white px-4 text-[15px] shadow-sm" disabled={emailOtpSent || emailVerified} />
                  <Button type="button" variant="outline" className="h-11 rounded-[10px] px-4 text-sm font-semibold" onClick={triggerEmailOtp} disabled={!canSendEmailOTP}>
                    {emailVerified
                      ? 'Verified'
                      : emailResendSeconds > 0
                      ? `Resend in ${emailResendSeconds}s`
                      : emailOtpSent
                      ? 'Resend OTP'
                      : 'Send OTP'}
                  </Button>
                </div>
                {emailFieldMessage && !emailVerified && (
                  <p className="mt-2 text-sm text-amber-600">{emailFieldMessage}</p>
                )}
                {emailOtpSent && !emailVerified && (
                  <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                    <Input id="email-otp" maxLength={6} value={emailOtp} onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter email OTP" className="h-11 rounded-[10px] border border-gray-200 bg-white px-4 text-[15px] shadow-sm" />
                    <Button type="button" className="h-11 rounded-[10px] px-4 text-sm font-semibold" onClick={verifyEmailOtp} disabled={loading || emailOtp.length !== 6}>
                      {loading ? 'Verifying...' : 'Verify'}
                    </Button>
                  </div>
                )}
                {emailVerified && (
                  <p className="text-sm text-emerald-600"></p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone Number</Label>
                <div className="flex items-center gap-2">
                  <Input id="phone" value={form.phone} onChange={(e) => onFieldChange('phone', e.target.value)} placeholder="Mobile Number" className="flex-1 h-11 rounded-[10px] border border-gray-200 bg-white px-4 text-[15px] shadow-sm" disabled={phoneOtpSent || phoneVerified} />
                  <Button type="button" variant="outline" className="h-11 rounded-[10px] px-4 text-sm font-semibold" onClick={triggerPhoneOtp} disabled={!canSendPhoneOTP}>
                    {phoneVerified
                      ? 'Verified'
                      : phoneResendSeconds > 0
                      ? `Resend in ${phoneResendSeconds}s`
                      : phoneOtpSent
                      ? 'Resend OTP'
                      : 'Send OTP'}
                  </Button>
                </div>
                {phoneFieldMessage && emailVerified && !phoneVerified && (
                  <p className="mt-2 text-sm text-amber-600">{phoneFieldMessage}</p>
                )}
                {phoneOtpSent && !phoneVerified && (
                  <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                    <Input id="phone-otp" maxLength={6} value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter phone OTP" className="h-11 rounded-[10px] border border-gray-200 bg-white px-4 text-[15px] shadow-sm" />
                    <Button type="button" className="h-11 rounded-[10px] px-4 text-sm font-semibold" onClick={verifyPhoneOtp} disabled={loading || phoneOtp.length !== 6}>
                      {loading ? 'Verifying...' : 'Verify'}
                    </Button>
                  </div>
                )}
                {phoneVerified && (
                  <p className="text-sm text-emerald-600"></p>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-3 text-sm text-gray-600">
                <input type="checkbox" checked={agreeToTerms} onChange={(e) => setAgreeToTerms(e.target.checked)} className="mt-1 h-4 w-4 rounded border-gray-300 text-[#1d4ed8] focus:ring-[#1d4ed8]" />
                <span>
                  I agree to the{' '}
                  <Link to="/privacy-policy" className="font-medium text-[#1d4ed8] underline-offset-2 hover:underline">
                    Privacy Policy
                  </Link>{' '}
                  and{' '}
                  <Link to="/terms-of-service" className="font-medium text-[#1d4ed8] underline-offset-2 hover:underline">
                    Terms & Conditions
                  </Link>
                </span>
              </label>

              
            </div>

            <Button className="h-14 w-full rounded-full bg-[#1d4ed8] text-base font-semibold text-white transition hover:bg-[#1d4ed8] disabled:opacity-50" onClick={submitSignupCheck} disabled={!canCreateAccount}>
              {loading ? 'Checking...' : 'Continue'}
            </Button>

            <p className="text-center text-sm text-slate-600">
              Already have an account?{' '}
              <button type="button" onClick={() => navigate('/login')} className="font-semibold text-[#1d4ed8] underline-offset-2 hover:underline">
                Login
              </button>
            </p>
          </div>
        )}


        {step === 3 && (
          <div className="space-y-4 text-center">
            <CardTitle>Account Created</CardTitle>
            <CardDescription>Your personal and business details are saved. You are now logged in automatically.</CardDescription>
            <Button className="w-full" onClick={() => navigate('/profile/account')}>Open Profile</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignupFlow;
