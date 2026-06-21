import { Link } from 'react-router-dom';
import { useLayoutEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface FooterBusinessLink {
  label: string;
  link: string;
}

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
  whatsapp_number?: string;
  whatsapp_visible?: boolean;
  for_businesses_title?: string;
  for_businesses_links?: FooterBusinessLink[];
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
      twitter_visible: true,
      linkedin_label: 'LinkedIn',
      linkedin_link: '#',
      linkedin_visible: true,
      facebook_label: 'Facebook',
      facebook_link: '#',
      facebook_visible: true,
      instagram_label: 'Instagram',
      instagram_link: '#',
      instagram_visible: false,
      youtube_label: 'YouTube',
      youtube_link: '#',
      youtube_visible: false,
      whatsapp_number: '',
      whatsapp_visible: false,
      for_businesses_title: 'For Businesses',
      for_businesses_links: [
        { label: 'Advertise With Us', link: '#' },
        { label: 'Write with us', link: '#' },
        { label: 'Sell With Us', link: '#' },
        { label: 'Editorial Policy', link: '#' },
      ],
    };
  }

  try {
    const cached = window.localStorage.getItem(FOOTER_SETTINGS_CACHE_KEY);
    if (!cached) {
      return {
        description: '',
        twitter_label: 'Twitter',
        twitter_link: '#',
        twitter_visible: true,
        linkedin_label: 'LinkedIn',
        linkedin_link: '#',
        linkedin_visible: true,
        facebook_label: 'Facebook',
        facebook_link: '#',
        facebook_visible: true,
        instagram_label: 'Instagram',
        instagram_link: '#',
        instagram_visible: false,
        youtube_label: 'YouTube',
        youtube_link: '#',
        youtube_visible: false,
        whatsapp_number: '',
        whatsapp_visible: false,
        for_businesses_title: 'For Businesses',
        for_businesses_links: [
          { label: 'Advertise With Us', link: '#' },
          { label: 'Write with us', link: '#' },
          { label: 'Sell With Us', link: '#' },
          { label: 'Editorial Policy', link: '#' },
        ],
      };
    }

    return JSON.parse(cached) as FooterSettings;
  } catch {
    return {
      description: '',
      twitter_label: 'Twitter',
      twitter_link: '#',
      twitter_visible: true,
      linkedin_label: 'LinkedIn',
      linkedin_link: '#',
      linkedin_visible: true,
      facebook_label: 'Facebook',
      facebook_link: '#',
      facebook_visible: true,
      instagram_label: 'Instagram',
      instagram_link: '#',
      instagram_visible: false,
      youtube_label: 'YouTube',
      youtube_link: '#',
      youtube_visible: false,
      whatsapp_number: '',
      whatsapp_visible: false,
      for_businesses_title: 'For Businesses',
      for_businesses_links: [
        { label: 'Advertise With Us', link: '#' },
        { label: 'Write with us', link: '#' },
        { label: 'Sell With Us', link: '#' },
        { label: 'Editorial Policy', link: '#' },
      ],
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
            twitter_visible: footerData.twitter_visible ?? true,
            linkedin_label: footerData.linkedin_label ?? 'LinkedIn',
            linkedin_link: footerData.linkedin_link ?? '#',
            linkedin_visible: footerData.linkedin_visible ?? true,
            facebook_label: footerData.facebook_label ?? 'Facebook',
            facebook_link: footerData.facebook_link ?? '#',
            facebook_visible: footerData.facebook_visible ?? true,
            instagram_label: footerData.instagram_label ?? 'Instagram',
            instagram_link: footerData.instagram_link ?? '#',
            instagram_visible: footerData.instagram_visible ?? false,
            youtube_label: footerData.youtube_label ?? 'YouTube',
            youtube_link: footerData.youtube_link ?? '#',
            youtube_visible: footerData.youtube_visible ?? false,
            whatsapp_number: footerData.whatsapp_number ?? '',
            whatsapp_visible: footerData.whatsapp_visible ?? false,
            for_businesses_title: footerData.for_businesses_title ?? 'For Businesses',
            for_businesses_links: footerData.for_businesses_links ?? [
              { label: 'Advertise With Us', link: '#' },
              { label: 'Write with us', link: '#' },
              { label: 'Sell With Us', link: '#' },
              { label: 'Editorial Policy', link: '#' },
            ],
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
      key: 'facebook',
      fileName: FOOTER_ICON_FILES.facebook,
      link: settings.facebook_link,
      visible: settings.facebook_visible ?? true,
      alt: 'Facebook',
    },
    {
      key: 'twitter',
      fileName: FOOTER_ICON_FILES.twitter,
      link: settings.twitter_link,
      visible: settings.twitter_visible ?? true,
      alt: 'X/Twitter',
    },
    {
      key: 'linkedin',
      fileName: FOOTER_ICON_FILES.linkedin,
      link: settings.linkedin_link,
      visible: settings.linkedin_visible ?? true,
      alt: 'LinkedIn',
    },
    {
      key: 'youtube',
      fileName: FOOTER_ICON_FILES.youtube,
      link: settings.youtube_link,
      visible: settings.youtube_visible ?? false,
      alt: 'YouTube',
    },
    {
      key: 'instagram',
      fileName: FOOTER_ICON_FILES.instagram,
      link: settings.instagram_link,
      visible: settings.instagram_visible ?? false,
      alt: 'Instagram',
    },
    {
      key: 'whatsapp',
      fileName: FOOTER_ICON_FILES.whatsapp,
      link: settings.whatsapp_number ? `https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}` : '#',
      visible: settings.whatsapp_visible ?? false,
      alt: 'WhatsApp',
    },
  ].filter(link => link.visible);

  return (
    <footer className="pt-8 pb-8" style={{ backgroundColor: '#F2F2F2' }}>
      <div className="container mx-auto px-4 md:px-6 lg:px-10 xl:px-12">
        {/* Subscribe Section */}
        <div className="mb-10 border-b border-gray-300 pb-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
            <h3 className="text-xl md:text-2xl font-bold text-gray-900">
              Subscribe For Offers & Updates
            </h3>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Input
                type="email"
                placeholder="Enter Your Email Id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full sm:w-80 bg-white border border-gray-300 text-gray-900 placeholder:text-gray-400"
                disabled={isSubscribing}
              />
              <Button
                type="submit"
                disabled={isSubscribing}
                className="w-full sm:w-auto bg-[#1d4ed8] hover:bg-[#0055DD] text-white"
              >
                {isSubscribing ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </form>
          </div>
        </div>

        {/* Footer Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Column 1: Logo & Description */}
          <div className="flex flex-col items-start gap-4 text-left">
            <div className="flex items-center gap-3 pt-0.5">
              <span className="text-2xl md:text-3xl font-bold text-black">Biz<span className="text-[#1d4ed8]">Req</span></span>
            </div>
            <div className="flex flex-col gap-2 w-full">
              {settings.description && (
                <p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-xs">
                  {settings.description}
                </p>
              )}
              
            </div>
          </div>

          {/* Column 2: Company */}
          <div>
            <h4 className="font-semibold mb-6 text-[16px] text-[#222222]">Company</h4>
            <ul className="space-y-4">
              <li><Link to="/about-us" className="font-regular text-[14px] text-[#666666] hover:text-[#0055DD] transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="font-regular text-[14px] text-[#666666] transition-colors">Contact Us</Link></li>
              <li><Link to="/faqs" className="font-regular text-[14px] text-[#666666] transition-colors">FAQs</Link></li>
            </ul>
          </div>

          {/* Column 3: Help & Support */}
          <div>
            <h4 className="font-semibold mb-6 text-[16px] text-[#222222]">Help & Support</h4>
            <ul className="space-y-4">
              <li><Link to="/privacy-policy" className="font-regular text-[14px] text-[#666666] hover:text-[#0055DD] transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="font-regular text-[14px] text-[#666666] hover:text-[#0055DD] transition-colors">Terms of Service</Link></li>
              <li><Link to="/refund-policy" className="font-regular text-[14px] text-[#666666] hover:text-[#0055DD] transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

          {/* Column 4: For Businesses */}
          <div>
            <h4 className="font-semibold mb-6 text-[16px] text-[#222222]">{settings.for_businesses_title}</h4>
            <ul className="space-y-4">
              {settings.for_businesses_links?.map((link, index) => (
                <li key={index}>
                  <a href={link.link} className="font-regular text-[14px] text-[#666666] hover:text-[#0055DD] transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Footer Bar */}
        <div className="pt-6 border-t border-gray-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <p className="text-sm text-gray-500 font-medium">
              © {new Date().getFullYear()} BizReq. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-700">Connect with us</span>
              <div className="flex items-center gap-3">
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
                      className="w-5 h-5 md:w-6 md:h-6 object-contain"
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}