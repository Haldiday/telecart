import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { resumePendingAuthDestination } from '@/lib/authGuard';

export const VerifyOTP: React.FC = () => {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (index: number, value: string) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, 6).replace(/\D/g, '');
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      if (i < 6) {
        newOtp[i] = pastedData[i];
      }
    }
    setOtp(newOtp);
    if (pastedData.length < 6) {
      inputRefs.current[pastedData.length]?.focus();
    } else {
      inputRefs.current[5]?.blur();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.verifyOTP({ email, otp: otpString });

      if (response.success && response.token && response.user) {
        login(response.token, response.user);
        const resumed = resumePendingAuthDestination({ navigate });
        if (!resumed) {
          navigate('/');
        }
      } else {
        setError(response.message || 'Failed to verify OTP');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await authAPI.sendOTP({ email });

      if (response.success) {
        setCountdown(60);
        setCanResend(false);
      } else {
        setError(response.message || 'Failed to resend OTP');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md relative">
        <button
          type="button"
          aria-label="Close"
          onClick={() => navigate(-1)}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
        >
          ×
        </button>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription>We've sent an OTP to {email}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Enter OTP</Label>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-xl border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                ))}
              </div>
            </div>

            <div className="text-center">
              {canResend ? (
                <Button variant="secondary" onClick={handleResend} disabled={loading}>
                  Resend OTP
                </Button>
              ) : (
                <p className="text-sm text-gray-600">Resend OTP in {countdown}s</p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
