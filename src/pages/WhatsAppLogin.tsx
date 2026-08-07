import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { authAPI } from '../services/api';

export const WhatsAppLogin: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const response = await authAPI.sendWhatsAppOTP({ phone });
      if (!response.success) {
        setError(response.message || 'Unable to send WhatsApp OTP.');
        return;
      }
      navigate('/verify-whatsapp-otp', { state: { phone } });
    } catch (error: any) {
      setError(error.response?.data?.message || 'Unable to send WhatsApp OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4 py-6 sm:px-6 lg:px-8">
      <div className="relative w-full max-w-[460px] rounded-[15px] bg-white px-5 py-7 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:px-8 sm:py-8">
        <button type="button" aria-label="Close" onClick={() => navigate(-1)} className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-xl text-gray-500 transition hover:bg-gray-100 hover:text-gray-700">×</button>
        <div className="mt-6 flex flex-col items-center text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-black">Biz<span className="text-[#1d4ed8]">Req</span></h1>
          <p className="mt-3 text-[1.35rem] font-semibold text-gray-800">Continue with WhatsApp</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div className="space-y-4">
            <Input id="phone" type="tel" inputMode="tel" placeholder="+91 98765 43210" value={phone} onChange={(event) => setPhone(event.target.value)} disabled={loading} className="h-12 w-full rounded-[10px] border border-gray-200 bg-white px-4 text-xl shadow-sm" />
            <Label htmlFor="phone" className="text-sm text-gray-500">We'll send an OTP on WhatsApp</Label>
          </div>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <Button type="submit" className="h-14 w-full rounded-full bg-[#1d4ed8] text-base font-semibold text-white hover:bg-[#1d4ed8]" disabled={loading}>{loading ? 'Sending...' : 'Send WhatsApp OTP'}</Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/login')} disabled={loading}>Continue with Email</Button>
        </form>
      </div>
    </div>
  );
};
