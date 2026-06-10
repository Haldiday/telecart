import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
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
}

export default function Footer() {
  const [settings, setSettings] = useState<FooterSettings>({
    description: 'BizReq empowers teams to transform raw data into clear, compelling visuals — making insights easier to share, understand, and act on.',
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
  });

  useEffect(() => {
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
          setSettings({
            description: 'BizReq empowers teams to transform raw data into clear, compelling visuals — making insights easier to share, understand, and act on.',
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
            ...data
          });
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
    <footer className="text-primary-foreground pt-16 pb-8" style={{ backgroundColor: '#000000' }}>
      <div className="container mx-auto px-4 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Logo */}
          <div className="flex flex-col items-start gap-6">
            <div className="flex items-center gap-3 pt-0.5"> {/* Slight padding to align text baseline with headings */}
              <div className="w-10 h-10 rounded-xl bg-[#0066FF] flex items-center justify-center shadow-lg shrink-0">
                <span className="text-white font-black text-lg">B</span>
              </div>
              <span className="text-2xl font-black tracking-tight text-white leading-none">BizReq</span>
            </div>
            {settings.description && (
              <p className="text-sm text-gray-400 leading-relaxed max-w-[280px]">
                {settings.description}
              </p>
            )}
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

        {/* Bottom Line & Copyright */}
        <div className="border-t border-gray-800/50 w-full mt-8 pt-8 flex justify-center">
          <p className="text-sm text-gray-500 font-medium">
            © {new Date().getFullYear()} BizReq. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
