
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

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

  useEffect(() => {
    const loadData = async () => {
      console.log('WriteForUsPage: Loading data...');
      setIsLoading(true);

      const { data, error } = await (supabase as any)
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

      setIsLoading(false);
    };
    loadData();

    const channel = supabase
      .channel('write_for_us_settings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'write_for_us_settings' as any },
        async () => {
          const { data } = await (supabase as any)
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

  const renderContent = (html: string) => {
    return { __html: html };
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="py-16 px-4 md:px-8 mt-20 md:mt-24">
        <div className="max-w-5xl mx-auto">
          {!isLoading && (
            <>
              {settings?.heading && (
                <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
                  {settings.heading}
                </h1>
              )}

              {settings?.banner_image_url && (
                <div className="bg-gray-100 rounded-xl p-6 mb-12">
                  <img
                    src={settings.banner_image_url}
                    alt="Banner"
                    className="w-full h-auto rounded-lg object-contain"
                  />
                </div>
              )}

              {settings?.content && (
                <div
                  className="prose prose-lg max-w-none mb-12"
                  dangerouslySetInnerHTML={renderContent(settings.content)}
                />
              )}

              {settings?.contact_email && (
                    <div className="bg-blue-50 rounded-xl p-6 text-center">
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
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default WriteForUsPage;
