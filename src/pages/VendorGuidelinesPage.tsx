
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import RichTextContent from '@/components/shared/RichTextContent';

interface VendorGuidelinesSettings {
  id?: string;
  heading: string;
  content: string;
  contact_email: string;
  contact_intro_text?: string;
}

const DEFAULT_CONTENT = '';

const VendorGuidelinesPage = () => {
  const [settings, setSettings] = useState<VendorGuidelinesSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fade-up animation keyframes
  const fadeUpAnimation = `
    @keyframes fadeUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;

  useEffect(() => {
    const loadData = async () => {
      console.log('VendorGuidelinesPage: Loading data...');
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from('vendor_guidelines_settings')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error loading vendor guidelines settings:', error);
        }

        if (data) {
          setSettings(data as unknown as VendorGuidelinesSettings);
        } else {
          setSettings({
            heading: '',
            content: DEFAULT_CONTENT,
            contact_email: '',
            contact_intro_text: ''
          });
        }
      } catch (error) {
        console.error('Error loading vendor guidelines settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();

    const channel = supabase
      .channel('vendor_guidelines_settings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vendor_guidelines_settings' },
        async () => {
          const { data } = await supabase
            .from('vendor_guidelines_settings')
            .select('*')
            .limit(1)
            .maybeSingle();
          if (data) {
            setSettings(data as unknown as VendorGuidelinesSettings);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50">
      <style>{fadeUpAnimation}</style>

      {!isLoading ? (
        <>
          <Header />

          <main className="flex-1">
            <section className="py-16 px-4 md:px-8 mt-12 md:mt-24">
              <div className="max-w-6xl mx-auto">
                <div 
                  className="bg-white border border-gray-200 shadow-2xl p-6 md:p-10"
                  style={{
                    opacity: 0,
                    animation: 'fadeUp 0.6s ease-out forwards',
                    animationDelay: '0.1s'
                  }}
                >
                  {settings?.heading && (
                    <h1 className="text-3xl md:text-[32px] font-semibold text-center text-[#222222] mb-12">
                      {settings.heading}
                    </h1>
                  )}

                  {settings?.content && (
                    <RichTextContent content={settings.content} className="max-w-none mb-12" />
                  )}
                </div>
              </div>
            </section>
          </main>

          <Footer />
        </>
      ) : null}
    </div>
  );
};

export default VendorGuidelinesPage;
