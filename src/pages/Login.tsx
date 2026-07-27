import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { authAPI } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    if (!agreeToTerms) {
      setError('Please agree to the Privacy Policy and Terms & Conditions to continue.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await authAPI.sendOTP({ email: data.email });

      if (response.success) {
        setSuccess('OTP sent successfully!');
        setTimeout(() => {
          navigate('/verify-otp', { state: { email: data.email } });
        }, 1000);
      } else {
        setError(response.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
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
         
          <h1 className="text-2xl md:text-3xl font-bold text-[Black]">Biz<span className="text-[#1d4ed8]">Req</span>
          </h1>
          <p className="mt-3 text-[1.35rem] font-semibold text-gray-800">Login or Sign up</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
          <div className="space-y-4">
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              className="h-12 w-full rounded-[10px] border border-gray-200 bg-white px-4 text-xl shadow-sm outline-none "
              {...register('email')}
              disabled={loading}
            />
            <Label htmlFor="email" className="text-sm text-gray-500">
              We'll send an OTP to this email
            </Label>

            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-3 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-[#1d4ed8] focus:ring-[#1d4ed8]"
                />
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

              <label className="flex items-start gap-3 text-sm text-gray-600">
                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300 text-[#1d4ed8] focus:ring-[#1d4ed8]" />
                <span>Send me notifications, updates & offers.</span>
              </label>
            </div>

            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
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
            className="h-14 w-full rounded-full bg-[#1d4ed8] text-base font-semibold text-white transition hover:bg-[#1d4ed8]"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </Button>
        </form>
      </div>
    </div>
  );
};
