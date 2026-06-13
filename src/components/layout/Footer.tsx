import { Link } from 'react-router-dom';
import { useLayoutEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
}

const FOOTER_SETTINGS_CACHE_KEY = 'footer-settings-cache';

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
    };
  }
};

export default function Footer() {
  const [settings, setSettings] = useState<FooterSettings>(() => getCachedFooterSettings());

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
          const nextSettings: FooterSettings = {
            description: data.description ?? '',
            twitter_label: data.twitter_label ?? 'Twitter',
            twitter_link: data.twitter_link ?? '#',
            linkedin_label: data.linkedin_label ?? 'LinkedIn',
            linkedin_link: data.linkedin_link ?? '#',
            facebook_label: data.facebook_label ?? 'Facebook',
            facebook_link: data.facebook_link ?? '#',
            instagram_label: data.instagram_label ?? 'Instagram',
            instagram_link: data.instagram_link ?? '#',
            youtube_label: data.youtube_label ?? 'YouTube',
            youtube_link: data.youtube_link ?? '#',
            refund_policy_visible: data.refund_policy_visible ?? true,
            twitter_visible: data.twitter_visible ?? true,
            linkedin_visible: data.linkedin_visible ?? true,
            facebook_visible: data.facebook_visible ?? true,
            instagram_visible: data.instagram_visible ?? false,
            youtube_visible: data.youtube_visible ?? false,
          };

          setSettings(prev => ({ ...prev, ...nextSettings }));
          window.localStorage.setItem(FOOTER_SETTINGS_CACHE_KEY, JSON.stringify(nextSettings));
        }
      } catch (err) {
        console.error('Failed to load footer settings:', err);
      }
    };

    loadFooterSettings();

    // Subscribe to real-time changes
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
    { label: settings.twitter_label, link: settings.twitter_link, visible: settings.twitter_visible ?? true },
    { label: settings.linkedin_label, link: settings.linkedin_link, visible: settings.linkedin_visible ?? true },
    { label: settings.facebook_label, link: settings.facebook_link, visible: settings.facebook_visible ?? true },
    { label: settings.instagram_label, link: settings.instagram_link, visible: settings.instagram_visible ?? false },
    { label: settings.youtube_label, link: settings.youtube_link, visible: settings.youtube_visible ?? false },
  ].filter(link => link.visible);

  return (
    <>
      <footer className="text-primary-foreground pt-16 pb-8" style={{ backgroundColor: '#000000' }}>
        <div className="container mx-auto px-4 md:px-8 lg:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Logo */}
            <div className="flex flex-col items-start gap-4">
              <div className="flex items-center gap-3 pt-0.5"> {/* Slight padding to align text baseline with headings */}
                <div className="w-10 h-10 rounded-xl bg-[#0066FF] flex items-center justify-center shadow-lg shrink-0">
                  <span className="text-white font-black text-lg">B</span>
                </div>
                <span className="text-2xl font-black tracking-tight text-white leading-none">BizReq</span>
              </div>
              <div className="flex flex-col gap-2">
                {settings.description && (
                  <p className="text-sm text-gray-400 leading-relaxed max-w-[280px]">
                    {settings.description}
                  </p>
                )}
                <p className="text-sm text-gray-500 font-medium">
                  © {new Date().getFullYear()} BizReq. All rights reserved.
                </p>
              </div>
            </div>

            {/* Help & Support */}
            <div>
              <h4 className="font-bold mb-6 text-base text-white">Help & Support</h4>
              <ul className="space-y-4">
                <li><Link to="/contact" className="text-sm text-gray-400 hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link to="/faqs" className="text-sm text-gray-400 hover:text-white transition-colors">FAQs</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-bold mb-6 text-base text-white">Company</h4>
              <ul className="space-y-4">
                <li><Link to="/about-us" className="text-sm text-gray-400 hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/privacy-policy" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
                {(settings.refund_policy_visible ?? true) && (
                  <li><Link to="/refund-policy" className="text-sm text-gray-400 hover:text-white transition-colors">Refund Policy</Link></li>
                )}
              </ul>
            </div>

            {/* Social Media */}
            <div>
              <h4 className="font-bold mb-6 text-base text-white">Social Media</h4>
              <ul className="space-y-4">
                {socialLinks.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-400 hover:text-white transition-colors block"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Bottom Branding Section */}
      <div className="bg-white py-6 md:py-8">
        <div className="container mx-auto px-4 md:px-8 lg:px-12 flex justify-center items-center">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3">
            <span className="text-2xl md:text-3xl font-black">
              <span className="text-black">Biz</span>
              <span className="text-[#1d4ed8]">Req</span>
            </span>
            <span className="text-black/90 text-sm md:text-lg">by Diverse Domain LLP</span>
          </div>
        </div>
      </div>
    </>
  );
}
