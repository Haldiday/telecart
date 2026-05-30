import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMSG91Auth } from "@/contexts/MSG91AuthContext";
import { InputOTP, InputOTPSlot, InputOTPGroup } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from "@supabase/supabase-js";

interface OtpErrorPayload {
  error?: {
    code?: string;
    message?: string;
  };
}

interface UnknownFunctionErrorShape {
  name?: string;
  message?: string;
  context?: {
    json?: () => Promise<unknown>;
    text?: () => Promise<string>;
    status?: number;
  };
}

const mapOtpErrorCodeToMessage = (code?: string, fallback?: string) => {
  switch (code) {
    case "INVALID_PHONE":
      return "Please enter a valid phone number.";
    case "INVALID_EMAIL":
      return "Please enter a valid email address.";
    case "INVALID_MOBILE_OTP":
    case "INVALID_EMAIL_OTP":
      return "Please enter a valid 6-digit OTP.";
    case "OTP_INVALID_OR_EXPIRED":
      return "Invalid or expired OTP. Please try again.";
    case "OTP_RATE_LIMITED":
      return "Too many requests. Please try again in a few minutes.";
    case "MSG91_TIMEOUT":
      return "OTP service timed out. Please try again.";
    case "MSG91_AUTH_FAILED":
      return "OTP service authentication failed. Please check MSG91 Auth Key.";
    case "MSG91_TEMPLATE_ERROR":
      return "OTP template error. Please check your MSG91 templates.";
    case "MOBILE_TEMPLATE_MISSING":
      return "Mobile OTP is not configured in Supabase secrets.";
    case "EMAIL_TEMPLATE_MISSING":
      return "Email OTP is not configured in Supabase secrets.";
    case "MSG91_NOT_CONFIGURED":
      return "OTP service is not configured. Please set MSG91_AUTH_KEY.";
    case "OTP_SEND_FAILED":
      return "Unable to send OTP right now. Please try again.";
    case "OTP_VERIFY_FAILED":
      return "Unable to verify OTP right now. Please try again.";
    default:
      return fallback || "Something went wrong. Please try again.";
  }
};

const getFriendlyFunctionError = async (error: unknown, fallback: string) => {
  if (error instanceof FunctionsHttpError) {
    try {
      const payload = (await error.context.json()) as OtpErrorPayload;
      return mapOtpErrorCodeToMessage(payload?.error?.code, payload?.error?.message || fallback);
    } catch {
      return fallback;
    }
  }

  if (error instanceof FunctionsRelayError || error instanceof FunctionsFetchError) {
    return "Network issue. Please check your connection and try again.";
  }

  // Fallback parsing when runtime `instanceof` checks don't match (different bundled class refs).
  const maybeFunctionError = error as UnknownFunctionErrorShape;
  if (maybeFunctionError?.name === "FunctionsHttpError" && maybeFunctionError?.context?.json) {
    try {
      const payload = (await maybeFunctionError.context.json()) as OtpErrorPayload;
      return mapOtpErrorCodeToMessage(payload?.error?.code, payload?.error?.message || fallback);
    } catch {
      return fallback;
    }
  }

  if (maybeFunctionError?.name === "FunctionsRelayError" || maybeFunctionError?.name === "FunctionsFetchError") {
    return "Network issue. Please check your connection and try again.";
  }

  if (error instanceof Error) {
    return mapOtpErrorCodeToMessage(undefined, fallback);
  }

  return fallback;
};

export const MSG91LoginModal: React.FC = () => {
  const { showLoginModal, setShowLoginModal, login, userData } = useMSG91Auth();
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [step, setStep] = useState<'info' | 'otp' | 'login_options'>('info');
  const [loginMethod, setLoginMethod] = useState<'mobile' | 'email' | 'both'>('both');
  const [isLoading, setIsLoading] = useState(false);

  // Check if it's a returning user when the modal opens
  React.useEffect(() => {
    if (showLoginModal) {
      const savedSession = localStorage.getItem('msg91_session');
      if (savedSession) {
        const data = JSON.parse(savedSession);
        setName(data.name || '');
        setPhoneNumber(data.phoneNumber || '');
        setEmail(data.email || '');
        setStep('login_options');
      } else {
        setStep('info');
      }
    }
  }, [showLoginModal]);

  const handleSendOTP = async (method: 'mobile' | 'email' | 'both' = 'both') => {
    if (method === 'both' || method === 'mobile') {
      if (!phoneNumber || phoneNumber.length < 10) {
        toast.error("Please enter a valid phone number");
        return;
      }
    }
    if (method === 'both' || method === 'email') {
      if (!email || !email.includes('@')) {
        toast.error("Please enter a valid email address");
        return;
      }
    }
    if (step === 'info' && !name) {
      toast.error("Please enter your name");
      return;
    }

    setIsLoading(true);
    setLoginMethod(method);
    try {
      const { data, error } = await supabase.functions.invoke('msg91-otp', {
        timeout: 15000,
        body: {
          action: 'send',
          method,
          phoneNumber,
          email,
        },
      });

      if (error) {
        const friendlyMessage = await getFriendlyFunctionError(error, "Failed to send OTP. Please try again.");
        toast.error(friendlyMessage);
        return;
      }
      if (!data?.success) {
        throw new Error('Failed to send OTP');
      }

      toast.success(`OTP sent to your ${method === 'both' ? 'mobile and email' : method}!`);
      setStep('otp');
    } catch (error) {
      const friendlyMessage = await getFriendlyFunctionError(error, "Failed to send OTP. Please try again.");
      toast.error(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const isMobileRequired = loginMethod === 'both' || loginMethod === 'mobile';
    const isEmailRequired = loginMethod === 'both' || loginMethod === 'email';

    if (isMobileRequired && mobileOtp.length !== 6) {
      toast.error("Please enter a 6-digit mobile OTP");
      return;
    }
    if (isEmailRequired && emailOtp.length !== 6) {
      toast.error("Please enter a 6-digit email OTP");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('msg91-otp', {
        timeout: 15000,
        body: {
          action: 'verify',
          method: loginMethod,
          phoneNumber,
          email,
          mobileOtp: isMobileRequired ? mobileOtp : undefined,
          emailOtp: isEmailRequired ? emailOtp : undefined,
        },
      });

      if (error) {
        const friendlyMessage = await getFriendlyFunctionError(error, "Invalid OTP. Please try again.");
        toast.error(friendlyMessage);
        return;
      }
      if (!data?.success) {
        throw new Error('OTP verification failed');
      }
      
      toast.success("Verification successful!");
      login({ name, phoneNumber, email });
      resetModal();
    } catch (error) {
      const friendlyMessage = await getFriendlyFunctionError(error, "Invalid OTP. Please try again.");
      toast.error(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setStep('info');
    setName('');
    setPhoneNumber('');
    setEmail('');
    setMobileOtp('');
    setEmailOtp('');
    setShowLoginModal(false);
  };

  return (
    <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {step === 'info' ? 'Sign Up' : step === 'login_options' ? 'Login' : 'Verify OTP'}
          </DialogTitle>
          <DialogDescription>
            {step === 'info' 
              ? 'Please provide your details to verify your account.' 
              : step === 'login_options'
              ? 'Choose how you would like to receive your OTP.'
              : `Enter the code(s) sent to your ${loginMethod === 'both' ? 'mobile and email' : loginMethod}.`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {step === 'info' ? (
            <div className="grid gap-3">
              <Input
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
              <Input
                placeholder="Phone Number (10 digits)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                disabled={isLoading}
              />
              <Input
                placeholder="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
              <Button onClick={() => handleSendOTP('mobile')} disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Verify'}
              </Button>
            </div>
          ) : step === 'login_options' ? (
            <div className="grid gap-3">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Welcome back, {name}!
              </div>
              <Button variant="outline" onClick={() => handleSendOTP('mobile')} disabled={isLoading}>
                Get OTP on Mobile ({phoneNumber.slice(-4).padStart(phoneNumber.length, '*')})
              </Button>
              <Button variant="outline" onClick={() => handleSendOTP('email')} disabled={isLoading}>
                Get OTP on Email ({email.split('@')[0].slice(0, 3)}...@...)
              </Button>
              <Button variant="ghost" className="text-xs" onClick={() => setStep('info')}>
                Use a different account
              </Button>
            </div>
          ) : (
            <div className="grid gap-6">
              {(loginMethod === 'both' || loginMethod === 'mobile') && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Mobile OTP</label>
                  <InputOTP
                    maxLength={6}
                    value={mobileOtp}
                    onChange={(value) => setMobileOtp(value)}
                    disabled={isLoading}
                  >
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              )}
              
              {(loginMethod === 'both' || loginMethod === 'email') && (
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Email OTP</label>
                  <InputOTP
                    maxLength={6}
                    value={emailOtp}
                    onChange={(value) => setEmailOtp(value)}
                    disabled={isLoading}
                  >
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              )}

              <div className="flex gap-2 w-full mt-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(userData ? 'login_options' : 'info')} disabled={isLoading}>
                  Back
                </Button>
                <Button className="flex-1" onClick={handleVerifyOTP} disabled={isLoading}>
                  {isLoading ? 'Verifying...' : 'Verify & Login'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};