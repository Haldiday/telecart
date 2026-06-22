import { Link } from 'react-router-dom';
import { useLayoutEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface FooterBusinessLink {
  label: string;
  link: string;
  is_visible?: boolean;
}

interface FooterSettings {
  description: string;
  description_visible?: boolean;
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
  social_whatsapp_visible?: boolean;
  social_media_visible?: boolean;
  about_us_visible?: boolean;
  contact_visible?: boolean;
  privacy_policy_visible?: boolean;
  terms_of_service_visible?: boolean;
  refund_policy_visible?: boolean;
  faq_visible?: boolean;
  faq_heading?: string;
  whatsapp_number?: string;
  whatsapp_visible?: boolean;
  phone?: string;
  phone_visible?: boolean;
  email?: string;
  email_visible?: boolean;
  bottom_branding_visible?: boolean;
  bottom_branding_text?: string;
  for_businesses_title?: string;
  for_businesses_links?: FooterBusinessLink[];
}

interface LegalPage {
  id: string;
  slug: string;
  title: string;
  content: string | null;
  is_visible?: boolean;
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
      social_whatsapp_visible: false,
      whatsapp_number: '',
      whatsapp_visible: false,
      phone: '',
      phone_visible: false,
      email: '',
      email_visible: false,
      for_businesses_title: 'For Businesses',
      for_businesses_links: [
        { label: 'Get Listed', link: '#' },
        { label: 'Advertise', link: '#' },
        { label: 'Write for Us', link: '#' },
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
        social_whatsapp_visible: false,
        whatsapp_number: '',
        whatsapp_visible: false,
        phone: '',
        phone_visible: false,
        email: '',
        email_visible: false,
        for_businesses_title: 'For Businesses',
        for_businesses_links: [
          { label: 'Get Listed', link: '#' },
          { label: 'Advertise', link: '#' },
          { label: 'Write for Us', link: '#' },
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
      social_whatsapp_visible: false,
      whatsapp_number: '',
      whatsapp_visible: false,
      phone: '',
      phone_visible: false,
      email: '',
      email_visible: false,
      for_businesses_title: 'For Businesses',
      for_businesses_links: [
        { label: 'Get Listed', link: '#' },
        { label: 'Advertise', link: '#' },
        { label: 'Write for Us', link: '#' },
      ],
    };
  }
};

interface ContactSettings {
  heading: string;
  is_visible?: boolean;
}

export default function Footer() {
  const [settings, setSettings] = useState<FooterSettings>(() => getCachedFooterSettings());
  const [legalPages, setLegalPages] = useState<LegalPage[]>([]);
  const [contactSettings, setContactSettings] = useState<ContactSettings>({ heading: 'Contact', is_visible: true });
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const getLegalPageInfo = (slug: string, defaultTitle: string) => {
    const page = legalPages.find(p => p.slug === slug);
    return {
      title: (page as any)?.title || defaultTitle,
      isVisible: (page as any)?.is_visible ?? true
    };
  };

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
            description_visible: footerData.description_visible ?? true,
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
            social_whatsapp_visible: footerData.social_whatsapp_visible ?? false,
            social_media_visible: footerData.social_media_visible ?? true,
            about_us_visible: footerData.about_us_visible ?? true,
            contact_visible: footerData.contact_visible ?? true,
            privacy_policy_visible: footerData.privacy_policy_visible ?? true,
            terms_of_service_visible: footerData.terms_of_service_visible ?? true,
            refund_policy_visible: footerData.refund_policy_visible ?? true,
            faq_visible: footerData.faq_visible ?? true,
            faq_heading: footerData.faq_heading ?? 'Frequently Asked Questions',
            whatsapp_number: footerData.whatsapp_number ?? '',
            whatsapp_visible: footerData.whatsapp_visible ?? false,
            phone: footerData.phone ?? '',
            phone_visible: footerData.phone_visible ?? false,
            email: footerData.email ?? '',
            email_visible: footerData.email_visible ?? false,
            bottom_branding_visible: footerData.bottom_branding_visible ?? true,
            bottom_branding_text: footerData.bottom_branding_text ?? '',
            for_businesses_title: footerData.for_businesses_title ?? 'For Businesses',
            for_businesses_links: footerData.for_businesses_links ?? [
              { label: 'Get Listed', link: '#', is_visible: true },
              { label: 'Advertise', link: '#', is_visible: true },
              { label: 'Write for Us', link: '#', is_visible: true },
            ],
          };

          setSettings(prev => ({ ...prev, ...nextSettings }));
          window.localStorage.setItem(FOOTER_SETTINGS_CACHE_KEY, JSON.stringify(nextSettings));
        }
      } catch (err) {
        console.error('Failed to load footer settings:', err);
      }
    };

    const loadLegalPages = async () => {
      try {
        const { data, error } = await supabase
          .from('legal_pages')
          .select('*');
        
        if (error) {
          console.warn('Error loading legal pages:', error);
          return;
        }
        
        if (data) {
          setLegalPages(data as LegalPage[]);
        }
      } catch (err) {
        console.error('Failed to load legal pages:', err);
      }
    };

    const loadContactSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('contact_settings')
          .select('*')
          .limit(1)
          .maybeSingle();
        
        if (error) {
          console.warn('Error loading contact settings:', error);
          return;
        }
        
        if (data) {
          setContactSettings({
            heading: data.heading ?? 'Contact',
            is_visible: (data as any).is_visible ?? true,
          });
        }
      } catch (err) {
        console.error('Failed to load contact settings:', err);
      }
    };
  
    loadFooterSettings();
    loadLegalPages();
    loadContactSettings();

    const footerChannel = supabase
      .channel('footer_settings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'footer_settings' },
        () => loadFooterSettings()
      )
      .subscribe();

    const legalChannel = supabase
      .channel('legal_pages_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'legal_pages' },
        () => loadLegalPages()
      )
      .subscribe();

    const contactChannel = supabase
      .channel('contact_settings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contact_settings' },
        () => loadContactSettings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(footerChannel);
      supabase.removeChannel(legalChannel);
      supabase.removeChannel(contactChannel);
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
      visible: settings.social_whatsapp_visible ?? false,
      alt: 'WhatsApp',
    },
  ].filter(link => link.visible);

  return (
    <footer className="pt-12 pb-6" style={{ backgroundColor: '#F2F2F2' }}>
      <div className="container mx-auto px-4 md:px-6 lg:px-10 xl:px-12">
        {/* Footer Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Column 1: Logo & Description */}
          <div className="flex flex-col items-start gap-4 text-left">
            <div className="flex items-center gap-3 pt-0.5">
              <span className="text-2xl md:text-3xl font-bold text-black">Biz<span className="text-[#1d4ed8]">Req</span></span>
            </div>
            {settings.description && (
              <p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-xs">
                {settings.description}
              </p>
            )}
          </div>

          {/* Column 2: Company */}
          <div>
            <h4 className="font-semibold mb-6 text-[16px] text-[#222222]">Company</h4>
            <ul className="space-y-3">
              {(() => {
                const aboutInfo = getLegalPageInfo('about-us', 'About Us');
                const showAbout = (aboutInfo.isVisible && (settings.about_us_visible ?? true));
                if (showAbout) {
                  return (
                    <li key="about"><Link to="/about-us" className="font-regular text-[14px] text-[#666666] hover:text-[#0055DD] transition-colors">{aboutInfo.title}</Link></li>
                  );
                }
                return null;
              })()}
              {(() => {
                const showContact = (contactSettings.is_visible ?? true) && (settings.contact_visible ?? true);
                if (showContact) {
                  return (
                    <li key="contact"><Link to="/contact" className="font-regular text-[14px] text-[#666666] hover:text-[#0055DD] transition-colors">{contactSettings.heading}</Link></li>
                  );
                }
                return null;
              })()}
              {(() => {
                const showFaq = settings.faq_visible ?? true;
                if (showFaq) {
                  return (
                    <li key="faqs"><Link to="/faqs" className="font-regular text-[14px] text-[#666666] hover:text-[#0055DD] transition-colors">{settings.faq_heading ?? 'FAQs'}</Link></li>
                  );
                }
                return null;
              })()}
            </ul>
          </div>

          {/* Column 3: For Businesses */}
          <div>
            <h4 className="font-semibold mb-6 text-[16px] text-[#222222]">{settings.for_businesses_title}</h4>
            <ul className="space-y-3">
              {settings.for_businesses_links?.filter((link) => link.is_visible ?? true).map((link, index) => (
                <li key={index}>
                  <a href={link.link} className="font-regular text-[14px] text-[#666666] hover:text-[#0055DD] transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Reach Us */}
          <div>
            <h4 className="font-semibold mb-6 text-[16px] text-[#222222]">Reach Us</h4>
            <ul className="space-y-3 mb-6">
              
              {settings.whatsapp_visible && settings.whatsapp_number && (
                <li className="flex items-center gap-3">
                  <PublicIcon
                    src={getPublicVideoIconPath('whatsapp.png')}
                    alt="WhatsApp"
                    className="w-5 h-5 object-contain"
                  />
                  <a href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, '')}`} className="font-regular text-[14px] text-[#666666] hover:text-[#0055DD] transition-colors">
                    {settings.whatsapp_number}
                  </a>
                </li>
              )}
              {settings.email_visible && settings.email && (
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#1d4ed8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href={`mailto:${settings.email}`} className="font-regular text-[14px] text-[#666666] hover:text-[#0055DD] transition-colors">
                    {settings.email}
                  </a>
                </li>
              )}
            </ul>

            {/* Social Links */}
            <div className="flex items-center gap-4">
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
                    className="w-6 h-6 object-contain"
                  />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Subscribe Section */}
        <div className="mb-10 flex flex-col md:flex-row items-start md:items-center justify-start md:justify-center gap-4 md:gap-6">
          <h4 className="font-semibold text-[16px] text-[#222222]">Subscribe for Offers</h4>
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

        {/* Bottom Footer Bar */}
        <div className="pt-6 border-t border-gray-300">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left: Copyright */}
            <span className="text-sm text-gray-500 font-medium">
              © {new Date().getFullYear()} BizReq. All rights reserved.
            </span>

            {/* Center: Legal Links */}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {(() => {
                const termsInfo = getLegalPageInfo('terms-of-service', 'Terms of Service');
                const privacyInfo = getLegalPageInfo('privacy-policy', 'Privacy Policy');
                const refundInfo = getLegalPageInfo('refund-policy', 'Refund Policy');
                
                const visibleLinks = [];
                
                if (termsInfo.isVisible && (settings.terms_of_service_visible ?? true)) {
                  visibleLinks.push(
                    <Link key="terms" to="/terms-of-service" className="hover:text-[#0055DD] transition-colors">{termsInfo.title}</Link>
                  );
                }
                
                if (privacyInfo.isVisible && (settings.privacy_policy_visible ?? true)) {
                  if (visibleLinks.length > 0) visibleLinks.push(<span key="sep1">|</span>);
                  visibleLinks.push(
                    <Link key="privacy" to="/privacy-policy" className="hover:text-[#0055DD] transition-colors">{privacyInfo.title}</Link>
                  );
                }
                
                if (refundInfo.isVisible && (settings.refund_policy_visible ?? true)) {
                  if (visibleLinks.length > 0) visibleLinks.push(<span key="sep2">|</span>);
                  visibleLinks.push(
                    <Link key="refund" to="/refund-policy" className="hover:text-[#0055DD] transition-colors">{refundInfo.title}</Link>
                  );
                }
                
                return visibleLinks;
              })()}
            </div>

            {/* Right: Email */}
            {settings.email_visible && settings.email && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#1d4ed8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href={`mailto:${settings.email}`} className="text-sm text-gray-700 hover:text-[#0055DD] transition-colors">
                  {settings.email}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}