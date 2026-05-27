import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { InputOTP, InputOTPSlot, InputOTPGroup } from "@/components/ui/input-otp";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface OtpErrorPayload {
  error?: {
    code?: string;
    message?: string;
  };
}

const mapOtpErrorCodeToMessage = (code?: string, fallback?: string) => {
  switch (code) {
    case "INVALID_PHONE":
      return "Please enter a valid phone number.";
    case "INVALID_MOBILE_OTP":
      return "Please enter a valid 6-digit OTP.";
    case "OTP_INVALID_OR_EXPIRED":
      return "Invalid or expired OTP. Please try again.";
    case "OTP_RATE_LIMITED":
      return "Too many requests. Please try again in a few minutes.";
    case "MSG91_TIMEOUT":
      return "OTP service timed out. Please try again.";
    case "MSG91_NOT_CONFIGURED":
      return "OTP service is temporarily unavailable. Please try again later.";
    case "OTP_SEND_FAILED":
      return "Unable to send OTP right now. Please try again.";
    case "OTP_VERIFY_FAILED":
      return "Unable to verify OTP right now. Please try again.";
    default:
      return fallback || "Something went wrong. Please try again.";
  }
};

const getFriendlyFunctionError = async (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message.includes('FunctionsHttpError')) {
    return fallback;
  }
  return fallback;
};

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [agreeToWhatsApp, setAgreeToWhatsApp] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    if (!agreeToTerms) {
      toast.error("Please agree to Privacy Policy and T&Cs");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('msg91-otp', {
        timeout: 15000,
        body: {
          action: 'send',
          method: 'mobile',
          phoneNumber,
        },
      });

      if (error) {
        const friendlyMessage = await getFriendlyFunctionError(error, "Failed to send OTP. Please try again.");
        toast.error(friendlyMessage);
        return;
      }

      if (!data?.success) {
        toast.error("Failed to send OTP. Please try again.");
        return;
      }

      toast.success('OTP sent to your phone!');
      setStep('otp');
    } catch (error) {
      const friendlyMessage = await getFriendlyFunctionError(error, "Failed to send OTP. Please try again.");
      toast.error(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter a 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('msg91-otp', {
        timeout: 15000,
        body: {
          action: 'verify',
          method: 'mobile',
          phoneNumber,
          mobileOtp: otp,
        },
      });

      if (error) {
        const friendlyMessage = await getFriendlyFunctionError(error, "Failed to verify OTP. Please try again.");
        toast.error(friendlyMessage);
        return;
      }

      if (!data?.success) {
        toast.error("Failed to verify OTP. Please try again.");
        return;
      }

      // Store user data
      localStorage.setItem('msg91_session', JSON.stringify({
        phoneNumber,
        whatsappOptIn: agreeToWhatsApp,
      }));

      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      const friendlyMessage = await getFriendlyFunctionError(error, "Failed to verify OTP. Please try again.");
      toast.error(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Close Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 text-2xl font-light"
          >
            ✕
          </button>
        </div>

        {/* Logo and Title */}
        <div className="bg-white rounded-3xl shadow-lg p-8 border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">
              <span className="text-gray-900">Biz</span>
              <span className="text-blue-600">Req</span>
            </h1>
          </div>

          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">
            Login or Sign up
          </h2>

          {step === 'phone' ? (
            <div className="space-y-6">
              {/* Phone Number Input */}
              <div className="space-y-3">
                <div className="flex gap-2 border border-gray-300 rounded-lg overflow-hidden">
                  <div className="flex items-center px-4 bg-gray-50 border-r border-gray-300">
                    <span className="text-lg">🇮🇳</span>
                    <span className="text-gray-700 font-semibold ml-2">+91</span>
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Mobile Number"
                    maxLength={10}
                    className="flex-1 px-4 py-3 outline-none text-gray-900 placeholder-gray-400 bg-white"
                  />
                </div>
                <p className="text-sm text-gray-500">We'll send an OTP via SMS</p>
              </div>

              {/* Checkboxes */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                    className="mt-1"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
                    I agree to the{' '}
                    <a href="#" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </a>
                    {' '}and{' '}
                    <a href="#" className="text-blue-600 hover:underline">
                      T&Cs
                    </a>
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="whatsapp"
                    checked={agreeToWhatsApp}
                    onCheckedChange={(checked) => setAgreeToWhatsApp(checked as boolean)}
                    className="mt-1"
                  />
                  <label htmlFor="whatsapp" className="text-sm text-gray-700 leading-relaxed cursor-pointer">
                    Send me notification,updates & offers{' '}
                    <span className="font-semibold">📱 WhatsApp</span>
                  </label>
                </div>
              </div>

              {/* Get OTP Button */}
              <button
                onClick={handleSendOTP}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-4 rounded-full transition-colors text-lg"
              >
                {isLoading ? 'Sending...' : 'Get OTP'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* OTP Input */}
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">
                  Enter the OTP sent to +91{phoneNumber}
                </p>
                <div className="flex justify-center">
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </div>
              </div>

              {/* Verify Button */}
              <button
                onClick={handleVerifyOTP}
                disabled={isLoading || otp.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-4 rounded-full transition-colors text-lg"
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </button>

              {/* Change Number Link */}
              <button
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                }}
                className="w-full text-blue-600 hover:text-blue-700 font-semibold py-2"
              >
                Change Number
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
