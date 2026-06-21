import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export default function FAQs() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const loadFaqs = async () => {
      try {
        const { data, error } = await supabase
          .from('faqs')
          .select('*')
          .eq('is_visible', true)
          .order('sort_order', { ascending: true });

        if (error) throw error;
        setFaqs(data as FAQ[]);
      } catch (error) {
        console.error('Error loading FAQs:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFaqs();
  }, []);

  const toggleAccordion = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  if (loading) {
    return <div className="flex min-h-[100dvh] items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-white pt-24 md:pt-36 pb-12">
        <div className="container mx-auto px-4 md:px-8 max-w-[900px]">
          <h1 className="text-3xl md:text-[32px] font-semibold mb-8 text-[#222222] text-center">Frequently Asked Questions</h1>
          
          {faqs.length === 0 ? (
            <p className="text-[#333333]">No FAQs available yet.</p>
          ) : (
            <div className="space-y-4">
              {faqs.map((faq) => (
                <div key={faq.id} className="border-b border-gray-200 pb-4">
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full flex items-center justify-between text-left py-2 focus:outline-none"
                  >
                    <span className="text-lg font-semibold text-[#111111]">{faq.question}</span>
                    <span className={`text-2xl transition-transform duration-300 ${openId === faq.id ? 'rotate-45' : ''}`}>
                      +
                    </span>
                  </button>
                  {openId === faq.id && (
                    <div className="mt-2 text-[#333333]">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
