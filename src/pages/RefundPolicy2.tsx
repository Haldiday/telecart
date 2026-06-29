import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface LegalPage {
  id: string;
  slug: string;
  title: string;
  content: string | null;
}

export default function RefundPolicy2() {
  const [page, setPage] = useState<LegalPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPage = async () => {
      try {
        const { data, error } = await supabase
          .from('legal_pages')
          .select('*')
          .eq('slug', 'refund-policy-2')
          .maybeSingle();

        if (error) throw error;
        setPage(data as LegalPage);
      } catch (error) {
        console.error('Error loading refund policy 2:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, []);

  if (loading) {
    return <div className="flex min-h-[100dvh] items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-white pt-24 md:pt-36 pb-12">
        <div className="container mx-auto px-4 md:px-8 max-w-[1400px]">
          <h1 className="text-3xl md:text-[32px] font-semibold mb-8 text-[#222222]">{page?.title || 'Refund Policy 2'}</h1>
          <div 
            className="text-[#333333] legal-content tiptap-editor-content"
            dangerouslySetInnerHTML={{ __html: page?.content || '<p>No content available.</p>' }}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
