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

export const Account: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [companyName, setCompanyName] = useState(user?.company_name || '');
  const [isSaving, setIsSaving] = useState(false);

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);
  const [isVerifyingEmailOtp, setIsVerifyingEmailOtp] = useState(false);

  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);
  const [isVerifyingPhoneOtp, setIsVerifyingPhoneOtp] = useState(false);

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const response = await userAPI.updateProfile({
        first_name: firstName,
        last_name: lastName,
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
      setIsSendingEmailOtp(true);
      await userAPI.requestChangeEmail(newEmail);
      setEmailOtpSent(true);
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
      setIsSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailChange = async () => {
    try {
      setIsVerifyingEmailOtp(true);
      const response = await userAPI.verifyChangeEmail(emailOtp, newEmail);

      if (response.success && response.user && response.token) {
        updateUser({ ...response.user, token: response.token });
        setIsEmailModalOpen(false);
        setEmailOtpSent(false);
        setNewEmail('');
        setEmailOtp('');
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
      setIsVerifyingEmailOtp(false);
    }
  };

  const resetEmailModal = () => {
    setEmailOtpSent(false);
    setNewEmail('');
    setEmailOtp('');
  };

  const handleRequestChangePhone = async () => {
    try {
      setIsSendingPhoneOtp(true);
      await userAPI.requestChangePhone(newPhone);
      setPhoneOtpSent(true);
      toast({
        title: 'OTP sent',
        description: 'OTP has been sent to your current phone number.',
      });
    } catch (error) {
      console.error('Error requesting phone change:', error);
      toast({
        title: 'Error',
        description: getApiErrorMessage(error, 'Failed to send OTP. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setIsSendingPhoneOtp(false);
    }
  };

  const handleVerifyPhoneChange = async () => {
    try {
      setIsVerifyingPhoneOtp(true);
      const response = await userAPI.verifyChangePhone(phoneOtp, newPhone);

      if (response.success && response.user && response.token) {
        updateUser({ ...response.user, token: response.token });
        setIsPhoneModalOpen(false);
        setPhoneOtpSent(false);
        setNewPhone('');
        setPhoneOtp('');
        toast({
          title: 'Phone updated',
          description: 'Your phone number has been updated successfully!',
        });
      }
    } catch (error) {
      console.error('Error verifying phone change:', error);
      toast({
        title: 'Invalid OTP',
        description: getApiErrorMessage(error, 'The OTP you entered is invalid or expired. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setIsVerifyingPhoneOtp(false);
    }
  };

  const resetPhoneModal = () => {
    setPhoneOtpSent(false);
    setNewPhone('');
    setPhoneOtp('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">


        <Card>
          <CardHeader className="w-full flex flex-row items-center justify-between flex-wrap gap-2">
            <CardTitle>Profile Information</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>Go to Home Page</Button>
          </CardHeader>
          <CardContent className="space-y-6">


            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Enter your last name"
                />
              </div>
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
                {user?.email_verified && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                    Verified
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="phone">Phone Number</Label>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsPhoneModalOpen(true)}
                >
                  Change Phone
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="phone"
                  value={user?.phone || ''}
                  disabled
                  className="cursor-not-allowed"
                />
                {user?.phone_verified && (
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
              {emailOtpSent
                ? 'Enter the OTP sent to your current email address.'
                : ''}
            </DialogDescription>
          </DialogHeader>

          {!emailOtpSent ? (
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
                  disabled={isSendingEmailOtp || !newEmail}
                >
                  {isSendingEmailOtp ? 'Sending...' : 'Continue'}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="emailOtp">Enter OTP</Label>
                <InputOTP
                  id="emailOtp"
                  maxLength={6}
                  value={emailOtp}
                  onChange={setEmailOtp}
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
                  disabled={isSendingEmailOtp}
                >
                  Back
                </Button>
                <div className="flex gap-2">
                  <DialogClose asChild>
                    <Button variant="secondary">Cancel</Button>
                  </DialogClose>
                  <Button
                    onClick={handleVerifyEmailChange}
                    disabled={isVerifyingEmailOtp || emailOtp.length < 6}
                  >
                    {isVerifyingEmailOtp ? 'Verifying...' : 'Verify'}
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPhoneModalOpen} onOpenChange={(open) => {
        setIsPhoneModalOpen(open);
        if (!open) resetPhoneModal();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Phone Number</DialogTitle>
            <DialogDescription>
              {phoneOtpSent
                ? 'Enter the OTP sent to your current phone number.'
                : ''}
            </DialogDescription>
          </DialogHeader>

          {!phoneOtpSent ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="newPhone">New Phone Number</Label>
                <Input
                  id="newPhone"
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Enter your new phone number"
                />
              </div>
              <DialogFooter className="mt-4">
                <DialogClose asChild>
                  <Button variant="secondary">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={handleRequestChangePhone}
                  disabled={isSendingPhoneOtp || !newPhone}
                >
                  {isSendingPhoneOtp ? 'Sending...' : 'Continue'}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="phoneOtp">Enter OTP</Label>
                <InputOTP
                  id="phoneOtp"
                  maxLength={6}
                  value={phoneOtp}
                  onChange={setPhoneOtp}
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
                  onClick={resetPhoneModal}
                  disabled={isSendingPhoneOtp}
                >
                  Back
                </Button>
                <div className="flex gap-2">
                  <DialogClose asChild>
                    <Button variant="secondary">Cancel</Button>
                  </DialogClose>
                  <Button
                    onClick={handleVerifyPhoneChange}
                    disabled={isVerifyingPhoneOtp || phoneOtp.length < 6}
                  >
                    {isVerifyingPhoneOtp ? 'Verifying...' : 'Verify'}
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
