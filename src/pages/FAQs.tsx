
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import RichTextContent from '@/components/shared/RichTextContent';
import { buildFaqTree, type FAQRecord } from '@/lib/faqUtils';

interface FAQ extends FAQRecord {}

export default function FAQs() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMainId, setOpenMainId] = useState<string | null>(null);
  const [openSubId, setOpenSubId] = useState<string | null>(null);
  const [faqHeading, setFaqHeading] = useState('Frequently Asked Questions');

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
    const loadAllData = async () => {
      try {
        // Load FAQs and Heading in parallel
        const [faqsResult, headingResult] = await Promise.all([
          supabase
            .from('faqs')
            .select('*')
            .eq('is_visible', true)
            .order('sort_order', { ascending: true }),
          supabase
            .from('footer_settings')
            .select('faq_heading')
            .limit(1)
            .maybeSingle()
        ]);

        if (faqsResult.error) throw faqsResult.error;
        setFaqs(faqsResult.data as FAQ[]);

        if (headingResult.data?.faq_heading) {
          setFaqHeading(headingResult.data.faq_heading);
        }
      } catch (error) {
        console.error('Error loading FAQ data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  const toggleMainAccordion = (id: string) => {
    setOpenMainId((currentId) => (currentId === id ? null : id));
    setOpenSubId(null);
  };

  const toggleSubAccordion = (parentId: string, childId: string) => {
    setOpenMainId(parentId);
    setOpenSubId((currentId) => (currentId === childId ? null : childId));
  };

  const faqTree = buildFaqTree(faqs);

  return (
    <div className="flex flex-col min-h-screen">
      <style>{fadeUpAnimation}</style>
      
      {!loading ? (
        <>
          <Header />
          <main className="flex-1 bg-white pt-24 md:pt-36 pb-12">
            <div className="container mx-auto px-4 md:px-8 max-w-[900px]">
              <h1 
                className="text-3xl md:text-[32px] font-semibold mb-8 text-[#222222] text-center"
                style={{
                  opacity: 0,
                  animation: 'fadeUp 0.6s ease-out forwards',
                  animationDelay: '0.1s'
                }}
              >{faqHeading}</h1>
              
              <div
                style={{
                  opacity: 0,
                  animation: 'fadeUp 0.6s ease-out forwards',
                  animationDelay: '0.2s'
                }}
              >
                {faqTree.length === 0 ? (
                  <p className="text-[#333333]">No FAQs available yet.</p>
                ) : (
                  <div className="space-y-4">
                    {faqTree.map((faq) => {
                      const isMainOpen = openMainId === faq.id;

                      return (
                        <div key={faq.id} className="border-b border-gray-200 pb-4">
                          <button
                            onClick={() => toggleMainAccordion(faq.id)}
                            className="w-full flex items-center justify-between text-left py-2 focus:outline-none"
                          >
                            <RichTextContent
                              content={faq.question}
                              className="text-lg font-semibold text-[#111111] [&_p]:m-0"
                            />
                            <span className={`text-2xl transition-transform duration-300 ${isMainOpen ? 'rotate-45' : ''}`}>
                              +
                            </span>
                          </button>
                          {isMainOpen && (
                            <div className="mt-2">
                              {faq.children.length > 0 ? (
                                faq.children.map((child) => {
                                  const isChildOpen = openSubId === child.id;

                                  return (
                                    <div key={child.id} className="border-b border-gray-200 last:border-b-0 pl-4 py-2">
                                      <button
                                        onClick={() => toggleSubAccordion(faq.id, child.id)}
                                        className="w-full flex items-center justify-between text-left -py-2 focus:outline-none"
                                      >
                                        <RichTextContent
                                          content={child.question}
                                          className="text-base font-medium text-[#111111] [&_p]:m-0"
                                        />
                                        <span className={`text-xl transition-transform duration-300 ${isChildOpen ? 'rotate-45' : ''}`}>
                                          +
                                        </span>
                                      </button>
                                      {isChildOpen && (
                                        <RichTextContent content={child.answer} className="mt-2 text-[#333333]" />
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                <RichTextContent content={faq.answer} className="mt-2 text-[#333333]" />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </main>
          <Footer />
        </>
      ) : null}
    </div>
  );
}

