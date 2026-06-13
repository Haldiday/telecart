import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface ContactSettings {
  id: string;
  heading: string;
  email_label: string;
  email: string;
  description_1: string;
  description_2: string;
  image_url: string | null;
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

        if (error) throw error;
        setSettings(data);
      } catch (error) {
        console.error('Error loading contact settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('contact_settings_changes')
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

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-white">
        <div className="container mx-auto px-4 md:px-8 lg:px-10 py-16 md:py-24 max-w-[1200px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            <div className="space-y-12">
              <h1 className="text-4xl md:text-[44px] font-bold text-[#111111] leading-tight">
                {settings?.heading || 'Contact'}
              </h1>
              
              <div className="space-y-10">
                <div className="space-y-1">
                  <p className="text-[17px] text-[#111111] leading-relaxed">
                    {settings?.email_label || 'You can contact our Support Team by email:'}
                  </p>
                  <a 
                    href={`mailto:${settings?.email || 'office@freeprivacypolicy.com'}`}
                    className="text-[17px] font-medium text-blue-600 hover:underline transition-colors"
                  >
                    {settings?.email || 'office@freeprivacypolicy.com'}
                  </a>
                </div>

                <div className="space-y-10 max-w-[500px]">
                  <p className="text-[17px] leading-[1.6] text-[#111111]">
                    {settings?.description_1 || "If you haven't received the download link to your Privacy Policy (or any other policy) yet, please check your Spam/Junk folder before contacting us."}
                  </p>
                  <p className="text-[17px] leading-[1.6] text-[#111111]">
                    {settings?.description_2 || "Please note that we provide customer support through email at the moment."}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center md:justify-end">
              {settings?.image_url ? (
                <img 
                  src={settings.image_url} 
                  alt="Contact Us" 
                  className="max-w-full h-auto rounded-2xl shadow-sm"
                />
              ) : (
                <div className="w-full max-w-md aspect-square bg-muted rounded-2xl flex items-center justify-center">
                   <p className="text-muted-foreground italic text-sm">No image provided</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
