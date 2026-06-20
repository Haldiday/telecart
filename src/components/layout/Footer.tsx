import { Link } from 'react-router-dom';
import { useLayoutEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface FooterSettings {
  description: string;
  twitter_label: string;
  twitter_link: string;
  twitter_visible?: boolean;
  linkedin_label: string;
  linkedin_link: string;
  linkedin_visible?: boolean;
  facebook_label: string;
  facebook_link: string;
  facebook_visible?: boolean;
  instagram_label: string;
  instagram_link: string;
  instagram_visible?: boolean;
  youtube_label: string;
  youtube_link: string;
  youtube_visible?: boolean;
  refund_policy_visible?: boolean;
  whatsapp_number?: string;
  whatsapp_visible?: boolean;
  bottom_branding_visible?: boolean;
  bottom_branding_text?: string;
}

const FOOTER_ICON_FILES = {
  twitter: 'twitter.png',
  linkedin: 'linkedin.png',
  facebook: 'facebook.png',
  instagram: 'instagram.png',
  youtube: 'youtube.png',
  whatsapp: 'whatsapp.png',
} as const;

const FOOTER_SETTINGS_CACHE_KEY = 'footer-settings-cache';

const getPublicVideoIconPath = (fileName?: string) =>
  fileName ? `/videos/${fileName}` : '';

const PublicIcon = ({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
};

const getCachedFooterSettings = (): FooterSettings => {
  if (typeof window === 'undefined') {
    return {
      description: '',
      twitter_label: 'Twitter',
      twitter_link: '#',
      linkedin_label: 'LinkedIn',
      linkedin_link: '#',
      facebook_label: 'Facebook',
      facebook_link: '#',
      instagram_label: 'Instagram',
      instagram_link: '#',
      youtube_label: 'YouTube',
      youtube_link: '#',
      refund_policy_visible: true,
      whatsapp_number: '',
      whatsapp_visible: false,
      bottom_branding_visible: true,
      bottom_branding_text: '',
    };
  }

  try {
    const cached = window.localStorage.getItem(FOOTER_SETTINGS_CACHE_KEY);
    if (!cached) {
      return {
        description: '',
        twitter_label: 'Twitter',
        twitter_link: '#',
        linkedin_label: 'LinkedIn',
        linkedin_link: '#',
        facebook_label: 'Facebook',
        facebook_link: '#',
        instagram_label: 'Instagram',
        instagram_link: '#',
        youtube_label: 'YouTube',
        youtube_link: '#',
        refund_policy_visible: true,
        whatsapp_number: '',
        whatsapp_visible: false,
        bottom_branding_visible: true,
        bottom_branding_text: '',
      };
    }

    return JSON.parse(cached) as FooterSettings;
  } catch {
    return {
      description: '',
      twitter_label: 'Twitter',
      twitter_link: '#',
      linkedin_label: 'LinkedIn',
      linkedin_link: '#',
      facebook_label: 'Facebook',
      facebook_link: '#',
      instagram_label: 'Instagram',
      instagram_link: '#',
      youtube_label: 'YouTube',
      youtube_link: '#',
      refund_policy_visible: true,
      whatsapp_number: '',
      whatsapp_visible: false,
      bottom_branding_visible: true,
      bottom_branding_text: '',
    };
  }
};

export default function Footer() {
  const [settings, setSettings] = useState<FooterSettings>(() => getCachedFooterSettings());
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubscribing(true);
    try {
      const { error } = await supabase
        .from('footer_subscribers')
        .insert({ email: email.trim() });

      if (error) {
        console.error('Subscribe error:', error);
        if (error.code === '23505') {
          toast.error('This email is already subscribed');
        } else {
          toast.error(`Failed to subscribe: ${error.message}`);
        }
      } else {
        toast.success('Thank you for subscribing!');
        setEmail('');
      }
    } catch (err) {
      console.error('Unexpected subscribe error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubscribing(false);
    }
  };

  useLayoutEffect(() => {
    const loadFooterSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('footer_settings')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (error) {
          console.warn('Error loading footer settings:', error);
          return;
        }

        if (data) {
          const footerData = data as any;

          const nextSettings: FooterSettings = {
            description: footerData.description ?? '',
            twitter_label: footerData.twitter_label ?? 'Twitter',
            twitter_link: footerData.twitter_link ?? '#',
            linkedin_label: footerData.linkedin_label ?? 'LinkedIn',
            linkedin_link: footerData.linkedin_link ?? '#',
            facebook_label: footerData.facebook_label ?? 'Facebook',
            facebook_link: footerData.facebook_link ?? '#',
            instagram_label: footerData.instagram_label ?? 'Instagram',
            instagram_link: footerData.instagram_link ?? '#',
            youtube_label: footerData.youtube_label ?? 'YouTube',
            youtube_link: footerData.youtube_link ?? '#',
            refund_policy_visible: footerData.refund_policy_visible ?? true,
            twitter_visible: footerData.twitter_visible ?? true,
            linkedin_visible: footerData.linkedin_visible ?? true,
            facebook_visible: footerData.facebook_visible ?? true,
            instagram_visible: footerData.instagram_visible ?? false,
            youtube_visible: footerData.youtube_visible ?? false,
            whatsapp_number: footerData.whatsapp_number ?? '',
            whatsapp_visible: footerData.whatsapp_visible ?? false,
            bottom_branding_visible: footerData.bottom_branding_visible ?? true,
            bottom_branding_text: footerData.bottom_branding_text ?? '',
          };

          setSettings(prev => ({ ...prev, ...nextSettings }));
          window.localStorage.setItem(FOOTER_SETTINGS_CACHE_KEY, JSON.stringify(nextSettings));
        }
      } catch (err) {
        console.error('Failed to load footer settings:', err);
      }
    };

    loadFooterSettings();

    const channel = supabase
      .channel('footer_settings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'footer_settings' },
        () => loadFooterSettings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const socialLinks = [
    {
      key: 'twitter',
      fileName: FOOTER_ICON_FILES.twitter,
      link: settings.twitter_link,
      visible: settings.twitter_visible ?? true,
      alt: 'Twitter',
    },
    {
      key: 'linkedin',
      fileName: FOOTER_ICON_FILES.linkedin,
      link: settings.linkedin_link,
      visible: settings.linkedin_visible ?? true,
      alt: 'LinkedIn',
    },
    {
      key: 'facebook',
      fileName: FOOTER_ICON_FILES.facebook,
      link: settings.facebook_link,
      visible: settings.facebook_visible ?? true,
      alt: 'Facebook',
    },
    {
      key: 'instagram',
      fileName: FOOTER_ICON_FILES.instagram,
      link: settings.instagram_link,
      visible: settings.instagram_visible ?? false,
      alt: 'Instagram',
    },
    {
      key: 'youtube',
      fileName: FOOTER_ICON_FILES.youtube,
      link: settings.youtube_link,
      visible: settings.youtube_visible ?? false,
      alt: 'YouTube',
    },
  ].filter(link => link.visible);

  const showBottomBranding = settings.bottom_branding_visible ?? true;
  const brandingText = settings.bottom_branding_text?.trim();

  return (
    <>
      <footer className="pt-16 pb-8" style={{ backgroundColor: '#F2F2F2' }}>
        <div className="container mx-auto px-4 md:px-6 lg:px-10 xl:px-12">
          <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-2 xl:gap-4 mb-12">
            {/* Logo */}
            <div className="flex flex-col items-start gap-4 text-left">
              <div className="flex items-center gap-3 pt-0.5">
                <span className="text-2xl md:text-3xl font-bold text-black">Biz<span className="text-[#1d4ed8]">Req</span></span>
              </div>
              <div className="flex flex-col gap-2 w-full">
                {settings.description && (
                  <p className="text-sm sm:text-base text-gray-500 leading-relaxed max-w-md">
                    {settings.description}
                  </p>
                )}
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold mb-6 text-base text-black">Company</h4>
              <ul className="space-y-4">
                <li><Link to="/about-us" className="text-sm text-gray-800 hover:text-[#0055DD] transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="text-sm text-gray-800 hover:text-[#0055DD] transition-colors">Contact Us</Link></li>
                <li><Link to="/faqs" className="text-sm text-gray-800 hover:text-[#0055DD] transition-colors">FAQs</Link></li>
              </ul>
            </div>

            {/* Help & Support */}
            <div>
              <h4 className="font-bold mb-6 text-base text-black">Help & Support</h4>
              <ul className="space-y-4">
                <li><Link to="/privacy-policy" className="text-sm text-gray-800 hover:text-[#0055DD] transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="text-sm text-gray-800 hover:text-[#0055DD] transition-colors">Terms of Service</Link></li>
                {(settings.refund_policy_visible ?? true) && (
                  <li><Link to="/refund-policy" className="text-sm text-gray-800 hover:text-[#0055DD] transition-colors">Refund Policy</Link></li>
                )}
              </ul>
            </div>

            {/* Subscribe + Social Media + WhatsApp */}
            <div className="w-full">
              <h4 className="font-bold mb-6 text-base text-black">Subscribe for Offers</h4>
              <form onSubmit={handleSubscribe} className="flex flex-col gap-3 sm:flex-row sm:items-stretch mb-6">
                <Input
                  type="email"
                  placeholder="Enter Your Email Id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full min-w-0 sm:flex-[2_2_0%] lg:flex-[3_3_0%] bg-white border-[#0055DD] text-gray-900 placeholder:text-gray-400 pr-4"
                  disabled={isSubscribing}
                />
                <Button
                  type="submit"
                  disabled={isSubscribing}
                  className="w-full shrink-0 sm:w-auto sm:flex-none bg-[#1d4ed8] hover:bg-[#0055DD] text-white"
                >
                  {isSubscribing ? 'Subscribing...' : 'Subscribe'}
                </Button>
              </form>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-4">
                {socialLinks.map((link) => (
                  <a
                    key={link.key}
                    href={link.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-800 hover:text-[#0055DD] transition-colors"
                  >
                    <PublicIcon
                      src={getPublicVideoIconPath(link.fileName)}
                      alt={link.alt}
                      className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
                    />
                  </a>
                ))}
              </div>
              {settings.whatsapp_visible && settings.whatsapp_number && (
                <div className="relative inline-flex items-center bg-white rounded-full border-[2px] px-4 py-2 pl-8 sm:w-auto" style={{ borderColor: '#29A71A' }}>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/3 w-12 h-12 flex items-center justify-center rounded-full">
                    <PublicIcon
                      src={getPublicVideoIconPath(FOOTER_ICON_FILES.whatsapp)}
                      alt="WhatsApp"
                      className="w-11 h-11 object-contain"
                    />
                  </div>
                  <span className="ml-1 text-sm font-semibold break-all" style={{ color: '#020302ff' }}>
                    {settings.whatsapp_number}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </footer>
      
      {showBottomBranding && (
        <div className="bg-[#F2F2F2] py-6 md:py-8">
          <div className="container mx-auto px-4 md:px-8 lg:px-12 flex justify-center items-center">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex flex-wrap items-center justify-center gap-1">
                <span className="text-2xl md:text-3xl font-bold text-black">Biz<span className="text-[#1d4ed8]">Req</span></span>
                {brandingText && (
                  <span className="text-black/500 text-sm md:text-lg">{brandingText}</span>
                )}
              </div>
              <p className="text-sm text-gray-500 font-medium">
                © {new Date().getFullYear()} BizReq. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
