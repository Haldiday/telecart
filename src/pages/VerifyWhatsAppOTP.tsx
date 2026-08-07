import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { useAuth } from '../contexts/AuthContext';
import { resumePendingAuthDestination } from '@/lib/authGuard';
import { authAPI } from '../services/api';

export const VerifyWhatsAppOTP: React.FC = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const phone = location.state?.phone as string | undefined;

  useEffect(() => { if (!phone) navigate('/login/whatsapp'); }, [phone, navigate]);
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  const verify = async () => {
    if (!phone || otp.length !== 6) { setError('Please enter a valid 6-digit OTP.'); return; }
    try {
      setLoading(true); setError(null);
      const response = await authAPI.verifyWhatsAppOTP({ phone, otp });
      if (response.success && response.token && response.user) {
        login(response.token, response.user);
        if (!resumePendingAuthDestination({ navigate })) navigate('/');
      } else setError(response.message || 'Invalid or expired OTP.');
    } catch (error: any) { setError(error.response?.data?.message || 'Invalid or expired OTP.'); }
    finally { setLoading(false); }
  };

  const resend = async () => {
    if (!phone) return;
    try {
      setLoading(true); setError(null);
      const response = await authAPI.sendWhatsAppOTP({ phone });
      if (response.success) { setCountdown(60); setOtp(''); } else setError(response.message || 'Unable to resend OTP.');
    } catch (error: any) { setError(error.response?.data?.message || 'Unable to resend OTP.'); }
    finally { setLoading(false); }
  };

  if (!phone) return null;
  return <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4"><Card className="w-full max-w-md relative">
    <CardHeader className="text-center"><CardTitle className="text-2xl">Verify WhatsApp</CardTitle><CardDescription>We've sent an OTP to {phone}</CardDescription></CardHeader>
    <CardContent className="space-y-4"><InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={loading}><InputOTPGroup>{[0, 1, 2, 3, 4, 5].map((index) => <InputOTPSlot key={index} index={index} />)}</InputOTPGroup></InputOTP>
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {countdown > 0 ? <p className="text-center text-sm text-gray-600">Resend OTP in {countdown}s</p> : <Button type="button" variant="secondary" className="w-full" onClick={resend} disabled={loading}>Resend OTP</Button>}
      <Button type="button" className="w-full" onClick={verify} disabled={loading || otp.length !== 6}>{loading ? 'Verifying...' : 'Verify OTP'}</Button>
    </CardContent>
  </Card></div>;
};
