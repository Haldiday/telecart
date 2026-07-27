import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { getApiErrorMessage } from '@/lib/apiError';
import { useNavigate } from 'react-router-dom';

const ZOHO_FORM_URL = import.meta.env.VITE_ZOHO_FORM_URL || '';

export const Account: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [companyName, setCompanyName] = useState(user?.company_name || '');
  const [isSaving, setIsSaving] = useState(false);
  
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isRedirectingToZoho, setIsRedirectingToZoho] = useState(false);
  
  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const response = await userAPI.updateProfile({
        full_name: fullName,
        company_name: companyName,
      });
      
      if (response.success && response.user) {
        updateUser(response.user);
        toast({
          title: 'Profile updated',
          description: 'Your profile has been updated successfully!',
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleRequestChangeEmail = async () => {
    try {
      setIsSendingOtp(true);
      await userAPI.requestChangeEmail(newEmail);
      setOtpSent(true);
      toast({
        title: 'OTP sent',
        description: 'OTP has been sent to your current email address.',
      });
    } catch (error) {
      console.error('Error requesting email change:', error);
      toast({
        title: 'Error',
        description: getApiErrorMessage(error, 'Failed to send OTP. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setIsSendingOtp(false);
    }
  };
  
  const handleVerifyEmailChange = async () => {
    try {
      setIsVerifyingOtp(true);
      const response = await userAPI.verifyChangeEmail(otp, newEmail);
      
      if (response.success && response.user && response.token) {
        updateUser({ ...response.user, token: response.token });
        setIsEmailModalOpen(false);
        setOtpSent(false);
        setNewEmail('');
        setOtp('');
        toast({
          title: 'Email updated',
          description: 'Your email has been updated successfully!',
        });
      }
    } catch (error) {
      console.error('Error verifying email change:', error);
      toast({
        title: 'Invalid OTP',
        description: getApiErrorMessage(error, 'The OTP you entered is invalid or expired. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };
  
  const resetEmailModal = () => {
    setOtpSent(false);
    setNewEmail('');
    setOtp('');
  };

  const handleOpenZohoForm = async () => {
    if (!ZOHO_FORM_URL) {
      toast({
        title: 'Configuration missing',
        description: 'The Zoho form URL has not been configured yet.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsRedirectingToZoho(true);
      const response = await userAPI.generateZohoToken({
        name: fullName || user?.full_name || '',
        companyName: companyName || user?.company_name || '',
      });

      if (!response.success || !response.token) {
        throw new Error(response.message || 'Unable to generate secure Zoho token');
      }

      const url = new URL(ZOHO_FORM_URL);
      url.searchParams.set('token', response.token);
      window.location.assign(url.toString());
    } catch (error) {
      console.error('Error redirecting to Zoho form:', error);
      toast({
        title: 'Unable to continue',
        description: getApiErrorMessage(error, 'Failed to prepare the Zoho form link. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setIsRedirectingToZoho(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <Button variant="outline" onClick={() => navigate('/')}>
            Go to Home Page
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter your company name"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="email">Email Address</Label>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEmailModalOpen(true)}
                >
                  Change Email
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="cursor-not-allowed"
                />
                {user?.is_verified && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                    Verified
                  </Badge>
                )}
              </div>
            </div>

           

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full md:w-auto"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outline"
                onClick={handleOpenZohoForm}
                disabled={isRedirectingToZoho}
                className="w-full md:w-auto"
              >
                {isRedirectingToZoho ? 'Preparing...' : 'Open Zoho Form'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEmailModalOpen} onOpenChange={(open) => {
        setIsEmailModalOpen(open);
        if (!open) resetEmailModal();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Email Address</DialogTitle>
            <DialogDescription>
              {otpSent 
                ? 'Enter the OTP sent to your current email address.' 
                : 'Enter your new email address below. We will send an OTP to your current email for verification.'}
            </DialogDescription>
          </DialogHeader>

          {!otpSent ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="newEmail">New Email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter your new email"
                />
              </div>
              <DialogFooter className="mt-4">
                <DialogClose asChild>
                  <Button variant="secondary">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleRequestChangeEmail}
                  disabled={isSendingOtp || !newEmail}
                >
                  {isSendingOtp ? 'Sending...' : 'Continue'}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <InputOTP
                  id="otp"
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <DialogFooter className="mt-4 flex items-center justify-between">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={resetEmailModal}
                  disabled={isSendingOtp}
                >
                  Back
                </Button>
                <div className="flex gap-2">
                  <DialogClose asChild>
                    <Button variant="secondary">Cancel</Button>
                  </DialogClose>
                  <Button
                    onClick={handleVerifyEmailChange}
                    disabled={isVerifyingOtp || otp.length < 6}
                  >
                    {isVerifyingOtp ? 'Verifying...' : 'Verify'}
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
