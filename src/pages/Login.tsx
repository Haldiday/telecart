import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription } from '../components/ui/alert';
import { authAPI } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';

const loginSchema = z.object({
  phone: z.string().min(1, 'Please enter your phone number'),
});

const countryOptions = [
  { flag: '🇮🇳', name: 'India (भारत)', code: '+91' },
  { flag: '🇺🇸', name: 'United States', code: '+1' },
  { flag: '🇷🇺', name: 'Russia', code: '+7' },
  { flag: '🇪🇬', name: 'Egypt', code: '+20' },
  { flag: '🇿🇦', name: 'South Africa', code: '+27' },
  { flag: '🇬🇷', name: 'Greece', code: '+30' },
  { flag: '🇳🇱', name: 'Netherlands', code: '+31' },
  { flag: '🇧🇪', name: 'Belgium', code: '+32' },
  { flag: '🇫🇷', name: 'France', code: '+33' },
  { flag: '🇪🇸', name: 'Spain', code: '+34' },
  { flag: '🇭🇺', name: 'Hungary', code: '+36' },
  { flag: '🇮🇹', name: 'Italy', code: '+39' },
  { flag: '🇷🇴', name: 'Romania', code: '+40' },
  { flag: '🇨🇭', name: 'Switzerland', code: '+41' },
  { flag: '🇦🇹', name: 'Austria', code: '+43' },
  { flag: '🇬🇧', name: 'United Kingdom', code: '+44' },
  { flag: '🇩🇰', name: 'Denmark', code: '+45' },
  { flag: '🇸🇪', name: 'Sweden', code: '+46' },
  { flag: '🇳🇴', name: 'Norway', code: '+47' },
  { flag: '🇵🇱', name: 'Poland', code: '+48' },
  { flag: '🇩🇪', name: 'Germany', code: '+49' },
  { flag: '🇵🇪', name: 'Peru', code: '+51' },
  { flag: '🇲🇽', name: 'Mexico', code: '+52' },
  { flag: '🇨🇺', name: 'Cuba', code: '+53' },
  { flag: '🇦🇷', name: 'Argentina', code: '+54' },
  { flag: '🇧🇷', name: 'Brazil', code: '+55' },
  { flag: '🇨🇱', name: 'Chile', code: '+56' },
  { flag: '🇨🇴', name: 'Colombia', code: '+57' },
  { flag: '🇻🇪', name: 'Venezuela', code: '+58' },
  { flag: '🇲🇾', name: 'Malaysia', code: '+60' },
  { flag: '🇦🇺', name: 'Australia', code: '+61' },
  { flag: '🇮🇩', name: 'Indonesia', code: '+62' },
  { flag: '🇵🇭', name: 'Philippines', code: '+63' },
  { flag: '🇳🇿', name: 'New Zealand', code: '+64' },
  { flag: '🇸🇬', name: 'Singapore', code: '+65' },
  { flag: '🇹🇭', name: 'Thailand', code: '+66' },
  { flag: '🇯🇵', name: 'Japan', code: '+81' },
  { flag: '🇰🇷', name: 'South Korea', code: '+82' },
  { flag: '🇻🇳', name: 'Vietnam', code: '+84' },
  { flag: '🇨🇳', name: 'China', code: '+86' },
  { flag: '🇹🇷', name: 'Turkey', code: '+90' },
  { flag: '🇵🇰', name: 'Pakistan', code: '+92' },
  { flag: '🇱🇰', name: 'Sri Lanka', code: '+94' },
  { flag: '🇲🇲', name: 'Myanmar', code: '+95' },
  { flag: '🇮🇷', name: 'Iran', code: '+98' },
  { flag: '🇸🇸', name: 'South Sudan', code: '+211' },
  { flag: '🇲🇦', name: 'Morocco', code: '+212' },
  { flag: '🇩🇿', name: 'Algeria', code: '+213' },
  { flag: '🇹🇳', name: 'Tunisia', code: '+216' },
  { flag: '🇱🇾', name: 'Libya', code: '+218' },
  { flag: '🇬🇲', name: 'Gambia', code: '+220' },
  { flag: '🇸🇳', name: 'Senegal', code: '+221' },
  { flag: '🇲🇱', name: 'Mali', code: '+223' },
  { flag: '🇨🇮', name: 'Ivory Coast', code: '+225' },
  { flag: '🇳🇬', name: 'Nigeria', code: '+234' },
  { flag: '🇰🇪', name: 'Kenya', code: '+254' },
  { flag: '🇺🇬', name: 'Uganda', code: '+256' },
  { flag: '🇿🇲', name: 'Zambia', code: '+260' },
  { flag: '🇿🇼', name: 'Zimbabwe', code: '+263' },
  { flag: '🇺🇦', name: 'Ukraine', code: '+380' },
  { flag: '🇷🇸', name: 'Serbia', code: '+381' },
  { flag: '🇦🇪', name: 'United Arab Emirates', code: '+971' },
  { flag: '🇮🇱', name: 'Israel', code: '+972' },
  { flag: '🇶🇦', name: 'Qatar', code: '+974' },
  { flag: '🇳🇵', name: 'Nepal', code: '+977' },
];

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState('+91');
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const selectedCountry = countryOptions.find((option) => option.code === countryCode) ?? countryOptions[0];

  const filteredCountries = useMemo(() => {
    const query = searchTerm.toLowerCase();

    return countryOptions.filter((option) => {
      return option.name.toLowerCase().includes(query) || option.code.toLowerCase().includes(query);
    });
  }, [searchTerm]);

  const countryPickerRef = useRef<HTMLDivElement | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!countryPickerRef.current?.contains(event.target as Node)) {
        setIsCountryOpen(false);
      }
    };

    if (isCountryOpen) {
      document.addEventListener('mousedown', onClickOutside);
      document.addEventListener('touchstart', onClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('touchstart', onClickOutside);
    };
  }, [isCountryOpen]);

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const fullPhone = `${countryCode}${data.phone}`;
      const response = await authAPI.loginSendPhoneOTP({ phone: fullPhone });

      if (response.success) {
        setSuccess('OTP sent successfully!');
        setTimeout(() => {
          navigate('/verify-whatsapp-otp', { state: { phone: fullPhone, mode: 'login-phone' } });
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
          <h1 className="text-2xl md:text-3xl font-bold text-black">Biz<span className="text-[#1d4ed8]">Req</span></h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative" ref={countryPickerRef}>
                <button
                  type="button"
                  onClick={() => setIsCountryOpen((open) => !open)}
                  className="flex h-12 min-w-[130px] items-center justify-between rounded-[10px] border border-gray-200 bg-[#f2f4f7] px-3 text-sm font-medium text-slate-700 outline-none"
                >
                  <span className="flex items-center gap-2 text-base" style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif' }}>
                    <span>{selectedCountry.flag}</span>
                    <span>{selectedCountry.code}</span>
                  </span>
                  <span className="ml-2 text-xs">▾</span>
                </button>

                {isCountryOpen && (
                  <div className="absolute left-0 top-[calc(100%+6px)] z-20 w-[320px] rounded-[10px] border border-gray-200 bg-white shadow-lg">
                    <div className="border-b border-gray-100 px-3 py-2">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search country"
                        className="h-9 w-full rounded-[8px] border border-gray-200 px-3 text-sm outline-none"
                      />
                    </div>

                    <div className="max-h-[260px] overflow-y-auto">
                      {filteredCountries.map((option) => (
                        <button
                          key={`${option.code}-${option.name}`}
                          type="button"
                          onClick={() => {
                            setCountryCode(option.code);
                            setSearchTerm('');
                            setIsCountryOpen(false);
                          }}
                          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <span className="flex items-center gap-2" style={{ fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif' }}>
                            <span className="text-base">{option.flag}</span>
                            <span>{option.name}</span>
                          </span>
                          <span>{option.code}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Input
                id="phone"
                type="tel"
                placeholder="8123456789"
                className="h-12 flex-1 rounded-[10px] border border-gray-200 bg-white px-4 text-[15px] shadow-sm outline-none"
                {...register('phone')}
                disabled={loading}
              />
            </div>

            

            {errors.phone && (
              <p className="text-sm text-red-500">{errors.phone.message}</p>
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
            className="h-14 w-full rounded-[10px] bg-[#1d4ed8] text-base font-semibold text-white transition hover:bg-[#1d4ed8]"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </Button>

          <Button type="button" variant="outline" className="h-12 w-full rounded-[10px] border-[1.5px] border-[#1d4ed8] text-[#1d4ed8]" onClick={() => navigate('/login/email')} disabled={loading}>
            Login in email id
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
