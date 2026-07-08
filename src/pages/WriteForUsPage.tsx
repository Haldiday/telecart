

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import RichTextContent from '@/components/shared/RichTextContent';

interface WriteForUsSettings {
  id?: string;
  heading: string;
  banner_image_url?: string | null;
  content: string;
  contact_email: string;
  contact_intro_text?: string;
}

const DEFAULT_CONTENT = '';

const WriteForUsPage = () => {
  const [settings, setSettings] = useState<WriteForUsSettings | null>(null);
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
      console.log('WriteForUsPage: Loading data...');
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from('write_for_us_settings')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error loading write for us settings:', error);
        }

        if (data) {
          setSettings(data as unknown as WriteForUsSettings);
        } else {
          setSettings({
            heading: '',
            banner_image_url: null,
            content: DEFAULT_CONTENT,
            contact_email: '',
            contact_intro_text: ''
          });
        }
      } catch (error) {
        console.error('Error loading write for us settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();

    const channel = supabase
      .channel('write_for_us_settings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'write_for_us_settings' },
        async () => {
          const { data } = await supabase
            .from('write_for_us_settings')
            .select('*')
            .limit(1)
            .maybeSingle();
          if (data) {
            setSettings(data as unknown as WriteForUsSettings);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-white">
      <style>{fadeUpAnimation}</style>

      {!isLoading ? (
        <>
          <Header />

          <main className="flex-1">
            <section className="py-16 px-4 md:px-8 mt-12 md:mt-24">
              <div className="max-w-5xl mx-auto">
                {settings?.heading && (
                  <h1 
                    className="text-3xl md:text-[32px] font-semibold text-[#222222] mb-12"
                    style={{
                      opacity: 0,
                      animation: 'fadeUp 0.6s ease-out forwards',
                      animationDelay: '0.1s'
                    }}
                  >
                    {settings.heading}
                  </h1>
                )}

                {settings?.banner_image_url && (
                  <div 
                    className=""
                    style={{
                      opacity: 0,
                      animation: 'fadeUp 0.6s ease-out forwards',
                      animationDelay: '0.2s'
                    }}
                  >
                    <img
                      src={settings.banner_image_url}
                      alt="Banner"
                      className="w-full h-auto object-contain"
                    />
                  </div>
                )}

                {settings?.content && (
                  <div
                    style={{
                      opacity: 0,
                      animation: 'fadeUp 0.6s ease-out forwards',
                      animationDelay: '0.3s'
                    }}
                  >
                    <RichTextContent content={settings.content} className="max-w-none mb-10" />
                  </div>
                )}

                {settings?.contact_email && (
                  <div 
                    className="bg-blue-50 rounded-xl p-6 text-center"
                    style={{
                      opacity: 0,
                      animation: 'fadeUp 0.6s ease-out forwards',
                      animationDelay: '0.4s'
                    }}
                  >
                    <p className="text-lg text-gray-800">
                      {settings?.contact_intro_text || 'Or else you connect with us at'}{' '}
                      <a
                        href={`mailto:${settings.contact_email}`}
                        className="text-blue-700 hover:text-blue-900 font-semibold"
                      >
                        {settings.contact_email}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </section>
          </main>

          <Footer />
        </>
      ) : null}
    </div>
  );
};

export default WriteForUsPage;
