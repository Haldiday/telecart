
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import RichTextContent from '@/components/shared/RichTextContent';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { buildFaqTree, type FAQRecord } from '@/lib/faqUtils';

interface FAQ extends FAQRecord {}

export default function FAQs() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMainId, setOpenMainId] = useState<string | null>(null);
  const [openSubId, setOpenSubId] = useState<string | null>(null);
  const [faqHeading, setFaqHeading] = useState('Frequently Asked Questions');
  const faqSectionRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!faqSectionRef.current) return;
      const target = event.target as Node | null;
      if (target && !faqSectionRef.current.contains(target)) {
        setOpenMainId(null);
        setOpenSubId(null);
      }
    };

    document.addEventListener('click', onClickOutside);
    return () => document.removeEventListener('click', onClickOutside);
  }, []);

  const handleMainChange = (value: string | string[] | null) => {
    const nextValue = Array.isArray(value) ? value[0] : value;
    setOpenMainId(nextValue ?? null);
    setOpenSubId(null);
  };

  const handleSubChange = (value: string | string[] | null) => {
    const nextValue = Array.isArray(value) ? value[0] : value;
    setOpenSubId(nextValue ?? null);
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
                ref={faqSectionRef}
                style={{
                  opacity: 0,
                  animation: 'fadeUp 0.6s ease-out forwards',
                  animationDelay: '0.2s'
                }}
              >
                {faqTree.length === 0 ? (
                  <p className="text-[#333333]">No FAQs available yet.</p>
                ) : (
                  <Accordion
                    type="single"
                    collapsible
                    className="space-y-4"
                    value={openMainId}
                    onValueChange={handleMainChange}
                  >
                    {faqTree.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id} className=" bg-slate-50 shadow-sm overflow-hidden">
                        <AccordionTrigger className="px-4 md:px-6 py-4 text-center text-lg font-semibold text-slate-900">
                          <RichTextContent content={faq.question} className="m-0" />
                        </AccordionTrigger>
                        <AccordionContent className="px-4 md:px-6 pb-4 pt-2 bg-white">
                          {faq.children.length > 0 ? (
                            <Accordion
                              type="single"
                              collapsible
                              className="border-t border-slate-200 space-y-3"
                              value={openSubId}
                              onValueChange={handleSubChange}
                            >
                              {faq.children.map((child) => (
                                <AccordionItem
                                  key={child.id}
                                  value={child.id}
                                  className="border-b border-slate-200 last:border-b-0"
                                >
                                  <AccordionTrigger className="px-4 py-3 text-left text-base font-medium text-slate-800">
                                    <RichTextContent content={child.question} className="m-0" />
                                  </AccordionTrigger>
                                  <AccordionContent className="px-4 pb-4 pt-2 text-sm leading-7 text-slate-700">
                                    <RichTextContent content={child.answer} className="m-0" />
                                  </AccordionContent>
                                </AccordionItem>
                              ))}
                            </Accordion>
                          ) : (
                            <div className="text-sm leading-7 text-slate-700">
                              <RichTextContent content={faq.answer} className="m-0" />
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
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

