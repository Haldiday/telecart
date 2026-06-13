import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import FeaturedCards from '@/components/home/FeaturedCards';
import CategoriesSection from '@/components/home/CategoriesSection';
import OffersSection from '@/components/home/OffersSection';
import Ads1ColSection from '@/components/home/Ads1ColSection';
import Ads2ColSection from '@/components/home/Ads2ColSection';
import Ads3ColSection from '@/components/home/Ads3ColSection';

interface PageSection {
  id: string;
  section_type: string;
  name: string;
  sort_order: number;
  is_visible: boolean;
  background_color?: string | null;
}

const SECTION_MAP: Record<string, React.FC<any>> = {
  hero: HeroSection as any,
  cards: FeaturedCards,
  categories: CategoriesSection,
  offers: OffersSection,
  ads_1col: Ads1ColSection,
  ads_2col: Ads2ColSection,
  ads_3col: Ads3ColSection,
};

export default function Index() {
  const [sections, setSections] = useState<PageSection[]>([]);

  useEffect(() => {
    let mounted = true;
    
    // Initial fetch
    const loadSections = async () => {
      const { data } = await supabase.from('page_sections').select('*').order('sort_order');
      if (data && mounted) setSections(data as PageSection[]);
    };
    
    loadSections();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('page_sections_homepage')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'page_sections' },
        () => {
          // Refetch sections when any change happens
          loadSections();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {sections.filter(s => s.is_visible).map((section) => {
          const Component = SECTION_MAP[section.section_type];
          if (!Component) return null;

          const sectionContent = (() => {
            // Hero section doesn't need sectionId
            if (section.section_type === 'hero') {
              return <Component />;
            }

            // Hide "See All" on mobile for Featured Cards in overview
            if (section.section_type === 'cards') {
              return <Component sectionId={section.id} hideSeeAllOnMobile={true} />;
            }

            return <Component sectionId={section.id} />;
          })();

          // Apply background color to section container if specified
          if (section.background_color && section.section_type !== 'hero') {
            return (
              <div key={section.id} style={{ backgroundColor: section.background_color }}>
                {sectionContent}
              </div>
            );
          }

          return <div key={section.id}>{sectionContent}</div>;
        })}
      </main>
      <Footer />
    </div>
  );
}
