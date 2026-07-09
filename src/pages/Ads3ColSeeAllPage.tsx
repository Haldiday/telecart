import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Ads3ColSection from '@/components/home/Ads3ColSection';

interface PageSection {
  id: string;
  section_type: string;
  name: string;
  sort_order: number;
  is_visible: boolean;
  background_color?: string | null;
}

export default function Ads3ColSeeAllPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const [selectedSection, setSelectedSection] = useState<PageSection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadSelectedSection = async () => {
      setIsLoading(true);

      const targetSectionId = sectionId;
      if (!targetSectionId) {
        if (mounted) {
          setSelectedSection(null);
          setIsLoading(false);
          setIsAnimatingIn(true);
        }
        return;
      }

      const { data } = await supabase
        .from('page_sections')
        .select('*')
        .eq('id', targetSectionId)
        .maybeSingle();

      if (data && mounted) {
        setSelectedSection(data as PageSection);
      } else if (mounted) {
        setSelectedSection(null);
      }

      if (mounted) {
        setIsLoading(false);
        setIsAnimatingIn(true);
      }
    };

    loadSelectedSection();

    const subscription = supabase
      .channel('page_sections_see_all_ads_3col')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'page_sections' },
        () => {
          loadSelectedSection();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [sectionId]);

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
      <main className="flex-1 pt-20 md:pt-28">
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
          {selectedSection ? (
            <div
              style={{
                backgroundColor: selectedSection.background_color || undefined,
                opacity: isAnimatingIn ? 1 : 0,
                transform: isAnimatingIn ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 600ms ease-out 0ms, transform 600ms ease-out 0ms',
              }}
            >
              <Ads3ColSection sectionId={selectedSection.id} backgroundColor={selectedSection.background_color} />
            </div>
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