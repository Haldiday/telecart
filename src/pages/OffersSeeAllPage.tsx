import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import OffersSection from '@/components/home/OffersSection';

interface PageSection {
  id: string;
  section_type: string;
  name: string;
  sort_order: number;
  is_visible: boolean;
  background_color?: string | null;
}

export default function OffersSeeAllPage() {
  const [sections, setSections] = useState<PageSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const loadSections = async () => {
      const { data } = await supabase.from('page_sections').select('*').order('sort_order');
      if (data && mounted) {
        // Filter only offers sections
        const filteredSections = data.filter(
          (section) => section.section_type === 'offers' && section.is_visible
        );
        setSections(filteredSections as PageSection[]);
        setIsLoading(false);
        // Start the fade-in animation once we have data
        setIsAnimatingIn(true);
      }
    };
    
    loadSections();

    const subscription = supabase
      .channel('page_sections_see_all_offers')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'page_sections' },
        () => {
          loadSections();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 pt-24 md:pt-36 flex items-center justify-center">
          Loading...
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 pt-24 md:pt-36">
        <div 
          className="border-b border-border bg-card"
          style={{
            opacity: isAnimatingIn ? 1 : 0,
            transform: isAnimatingIn ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 500ms ease-out, transform 500ms ease-out',
          }}
        >
          <div className="mx-auto max-w-[1580px] px-6 md:px-12 py-6">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
          </div>
        </div>

        <div className="py-4">
          {sections.length > 0 ? (
            sections.map((section, index) => {
              const sectionContent = <OffersSection sectionId={section.id} backgroundColor={section.background_color} />;

              const animationDelay = `${index * 200}ms`;

              if (section.background_color) {
                return (
                  <div 
                    key={section.id} 
                    style={{ 
                      backgroundColor: section.background_color,
                      opacity: isAnimatingIn ? 1 : 0,
                      transform: isAnimatingIn ? 'translateY(0)' : 'translateY(30px)',
                      transition: `opacity 600ms ease-out ${animationDelay}, transform 600ms ease-out ${animationDelay}`,
                    }}
                  >
                    {sectionContent}
                  </div>
                );
              }

              return (
                <div 
                  key={section.id}
                  style={{
                    opacity: isAnimatingIn ? 1 : 0,
                    transform: isAnimatingIn ? 'translateY(0)' : 'translateY(30px)',
                    transition: `opacity 600ms ease-out ${animationDelay}, transform 600ms ease-out ${animationDelay}`,
                  }}
                >
                  {sectionContent}
                </div>
              );
            })
          ) : (
            <div 
              className="mx-auto max-w-[1580px] px-6 md:px-12 py-12 text-center"
              style={{
                opacity: isAnimatingIn ? 1 : 0,
                transform: isAnimatingIn ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 600ms ease-out, transform 600ms ease-out',
              }}
            >
              <h3 className="text-lg font-medium text-muted-foreground">No sections to display</h3>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}