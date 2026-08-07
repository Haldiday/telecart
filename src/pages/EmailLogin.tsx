import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { authAPI } from '../services/api';

const emailLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type EmailLoginFormValues = z.infer<typeof emailLoginSchema>;

export const EmailLogin: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailLoginFormValues>({
    resolver: zodResolver(emailLoginSchema),
  });

  const onSubmit = async (data: EmailLoginFormValues) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await authAPI.loginSendEmailOTP({ email: data.email });
      if (!response.success) {
        throw new Error(response.message || 'Failed to send OTP');
      }

      setSuccess('OTP sent successfully!');
      setTimeout(() => {
        navigate('/verify-otp', { state: { email: data.email, mode: 'login-email' } });
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4 py-6 sm:px-6 lg:px-8">
      <div className="relative w-full max-w-[460px] rounded-[15px] bg-white px-5 py-7 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:px-8 sm:py-8">
        <button
          type="button"
          aria-label="Close"
          onClick={() => navigate(-1)}
          className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
        >
          ×
        </button>

        <div className="mt-6 flex flex-col items-center text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-black">Biz<span className="text-[#1d4ed8]">Req</span></h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
          <div className="space-y-4">
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              className="h-12 w-full rounded-[10px] border border-gray-200 bg-white px-4 text-[15px] shadow-sm outline-none"
              {...register('email')}
              disabled={loading}
            />


            {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="h-14 w-full rounded-[10px] bg-[#1d4ed8] text-base font-semibold text-white transition hover:bg-[#1d4ed8]"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </Button>

          <Button type="button" variant="outline" className="h-12 w-full rounded-[10px] border-[1.5px] border-[#1d4ed8] text-[#1d4ed8]" onClick={() => navigate('/login')} disabled={loading}>
            Login by phone number
          </Button>

          <p className="text-center text-sm text-slate-600">
            Don&apos;t have an account?{' '}
            <button type="button" onClick={() => navigate('/signup')} className="font-semibold text-[#1d4ed8] underline-offset-2 hover:underline">
              Register here.
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default EmailLogin;
