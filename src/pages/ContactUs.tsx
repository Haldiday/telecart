import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { MapPin, Phone, Mail } from 'lucide-react';

interface ContactEmail {
  label: string;
  email: string;
}

interface ContactSettings {
  id: string;
  heading: string;
  email_label: string;
  email: string;
  description_1: string;
  description_2: string;
  image_url: string | null;
  phone: string;
  whatsapp: string;
  address: string;
  form_embed: string;
  contact_emails: ContactEmail[];
  nodal_officer_title: string;
  nodal_officer_name: string;
  nodal_officer_phone: string;
  nodal_officer_email: string;
  nodal_officer_visible?: boolean;
  appellate_authority_title: string;
  appellate_authority_name: string;
  appellate_authority_phone: string;
  appellate_authority_email: string;
  appellate_authority_visible?: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export default function ContactUs() {
  const [settings, setSettings] = useState<ContactSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('contact_settings')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching contact settings:', error);
          throw error;
        }
        console.log('ContactUs page loaded settings:', data);
        setSettings(data as unknown as ContactSettings);
      } catch (error) {
        console.error('Error loading contact settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('contact_settings_contact_us_page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contact_settings' },
        () => loadSettings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return <div className="flex min-h-[100dvh] items-center justify-center">Loading...</div>;
  }

  // Function to render form embed (handles both iframe URLs and full embed code)
  const renderFormEmbed = () => {
    if (!settings?.form_embed) return null;

    const embed = settings.form_embed.trim();
    
    // If it's a URL, wrap in iframe
    if (embed.startsWith('http://') || embed.startsWith('https://')) {
      return (
        <iframe
          src={embed}
          className="w-full h-[600px] rounded-xl border border-gray-200"
          title="Contact Form"
          frameBorder="0"
          allowFullScreen
        />
      );
    }

    // Otherwise, render as HTML (for embed codes)
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: embed }}
        className="w-full"
      />
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-white pt-24 md:pt-36">
        <div className="container mx-auto px-4 md:px-8 lg:px-10 pb-16 md:pb-24 max-w-[1200px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div className="space-y-12">
              <h1 className="text-4xl md:text-[32px] font-semibold text-[#222222] leading-tight">
                {settings?.heading || 'Contact'}
              </h1>
              
              <div className="space-y-3">
                {/* Address */}
                {settings?.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#212121] flex-shrink-0 mt-0.5" />
                    <p className="text-[16px] text-[#212121] font-normal leading-[24px]" style={{ fontFamily: 'Poppins, system-ui, -apple-system, sans-serif' }}>
                      {settings.address}
                    </p>
                  </div>
                )}

                {/* Phone */}
                {settings?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#212121] flex-shrink-0" />
                    <a 
                      href={`tel:${settings.phone}`}
                      className="text-[16px] text-[#212121] hover:underline transition-colors font-normal leading-[24px]"
                      style={{ fontFamily: 'Poppins, system-ui, -apple-system, sans-serif' }}
                    >
                      {settings.phone}
                    </a>
                  </div>
                )}

                {/* WhatsApp */}
                {settings?.whatsapp && (
                  <div className="flex items-center gap-2">
                    <img 
                      src="/videos/whatsapp.png" 
                      alt="WhatsApp" 
                      className="w-4 h-4 flex-shrink-0" 
                    />
                    <a 
                      href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[16px] text-[#212121] hover:underline transition-colors font-normal leading-[24px]"
                      style={{ fontFamily: 'Poppins, system-ui, -apple-system, sans-serif' }}
                    >
                      {settings.whatsapp}
                    </a>
                  </div>
                )}

                {/* Legacy Email (always show first if available) */}
                {settings?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#212121] flex-shrink-0" />
                    <a 
                      href={`mailto:${settings.email}`}
                      className="text-[16px] text-[#212121] hover:underline transition-colors font-normal leading-[24px]"
                      style={{ fontFamily: 'Poppins, system-ui, -apple-system, sans-serif' }}
                    >
                      {settings.email}
                    </a>
                  </div>
                )}

                {/* Multiple Emails (show as "Label : Email" without icon) */}
                {settings?.contact_emails && settings.contact_emails.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {settings.contact_emails.map((item, idx) => (
                      <div key={idx} className="flex items-baseline gap-1">
                        {item.label && (
                          <span 
                            className="text-[16px] text-[#212121] font-normal leading-[24px]"
                            style={{ fontFamily: 'Poppins, system-ui, -apple-system, sans-serif' }}
                          >
                            {item.label} :
                          </span>
                        )}
                        <a 
                          href={`mailto:${item.email}`}
                          className="text-[16px] text-[#212121] hover:underline transition-colors font-normal leading-[24px]"
                          style={{ fontFamily: 'Poppins, system-ui, -apple-system, sans-serif' }}
                        >
                          {item.email}
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {/* Descriptions */}
                <div className="space-y-4 max-w-[500px] pt-4">
                  {settings?.description_1 && (
                    <p className="text-[17px] leading-[1.6] text-[#111111]">
                      {settings.description_1}
                    </p>
                  )}
                  {settings?.description_2 && (
                    <p className="text-[17px] leading-[1.6] text-[#111111]">
                      {settings.description_2}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Form Embed */}
            <div className="w-full">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                {renderFormEmbed() || (
                  <div className="w-full h-[600px] flex items-center justify-center text-gray-400">
                    <p>Form will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Nodal Officer & Appellate Authority Section */}
        {((settings?.nodal_officer_title && settings?.nodal_officer_visible !== false) || (settings?.appellate_authority_title && settings?.appellate_authority_visible !== false)) && (
          <div className="bg-gray-50 py-12">
            <div className="container mx-auto px-4 md:px-8 lg:px-10 max-w-[1200px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nodal Officer Card */}
                {settings.nodal_officer_title && settings.nodal_officer_visible !== false && (
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{settings.nodal_officer_title}</h3>
                    {settings.nodal_officer_name && (
                      <p className="text-sm text-gray-600 mb-4">{settings.nodal_officer_name}</p>
                    )}
                    <div className="space-y-3">
                      {settings.nodal_officer_phone && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">
                            <Phone className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs text-gray-500">Call</p>
                            <a
                              href={`tel:${settings.nodal_officer_phone}`}
                              className="text-sm text-gray-900 hover:underline"
                              style={{ fontFamily: 'Poppins, system-ui, -apple-system, sans-serif' }}
                            >
                              {settings.nodal_officer_phone}
                            </a>
                          </div>
                        </div>
                      )}
                      {settings.nodal_officer_email && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">
                            <Mail className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs text-gray-500">Email Us</p>
                            <a
                              href={`mailto:${settings.nodal_officer_email}`}
                              className="text-sm text-gray-900 hover:underline"
                              style={{ fontFamily: 'Poppins, system-ui, -apple-system, sans-serif' }}
                            >
                              {settings.nodal_officer_email}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Appellate Authority Card */}
                {settings.appellate_authority_title && settings.appellate_authority_visible !== false && (
                  <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{settings.appellate_authority_title}</h3>
                    {settings.appellate_authority_name && (
                      <p className="text-sm text-gray-600 mb-4">{settings.appellate_authority_name}</p>
                    )}
                    <div className="space-y-3">
                      {settings.appellate_authority_phone && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">
                            <Phone className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs text-gray-500">Call</p>
                            <a
                              href={`tel:${settings.appellate_authority_phone}`}
                              className="text-sm text-gray-900 hover:underline"
                              style={{ fontFamily: 'Poppins, system-ui, -apple-system, sans-serif' }}
                            >
                              {settings.appellate_authority_phone}
                            </a>
                          </div>
                        </div>
                      )}
                      {settings.appellate_authority_email && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">
                            <Mail className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs text-gray-500">Email Us</p>
                            <a
                              href={`mailto:${settings.appellate_authority_email}`}
                              className="text-sm text-gray-900 hover:underline"
                              style={{ fontFamily: 'Poppins, system-ui, -apple-system, sans-serif' }}
                            >
                              {settings.appellate_authority_email}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
