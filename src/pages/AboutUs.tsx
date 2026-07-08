
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import RichTextContent from '@/components/shared/RichTextContent';

interface LegalPage {
  id: string;
  slug: string;
  title: string;
  content: string | null;
}

export default function AboutUs() {
  const [page, setPage] = useState<LegalPage | null>(null);
  const [loading, setLoading] = useState(true);

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
    const loadPage = async () => {
      try {
        const { data, error } = await supabase
          .from('legal_pages')
          .select('*')
          .eq('slug', 'about-us')
          .maybeSingle();

        if (error) throw error;
        setPage(data as LegalPage);
      } catch (error) {
        console.error('Error loading about us page:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <style>{fadeUpAnimation}</style>
      
      {!loading ? (
        <>
          <Header />
          <main className="flex-1 bg-white pt-24 md:pt-36 pb-12">
            <div className="container mx-auto px-4 md:px-8 max-w-[1400px]">
              <h1 
                className="text-3xl md:text-[32px] font-semibold mb-8 text-[#222222]"
                style={{
                  opacity: 0,
                  animation: 'fadeUp 0.6s ease-out forwards',
                  animationDelay: '0.1s'
                }}
              >{page?.title || 'About Us'}</h1>
              <div
                style={{
                  opacity: 0,
                  animation: 'fadeUp 0.6s ease-out forwards',
                  animationDelay: '0.2s'
                }}
              >
                <RichTextContent
                  content={page?.content || '<p>No content available.</p>'}
                  className="text-[#333333] legal-content tiptap-editor-content"
                />
              </div>
            </div>
          </main>
          <Footer />
        </>
      ) : null}
    </div>
  );
}

