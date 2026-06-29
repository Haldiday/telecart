import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSearch } from '@/contexts/SearchContext';
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
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const { showMobileStickySearch } = useSearch();

  const scrollToSectionElement = (sectionElement: HTMLElement | null) => {
    if (!sectionElement) return;

    console.log('[Index] Scrolling to section:', sectionElement.id);
    const headingElement = sectionElement.querySelector('h2') as HTMLElement | null;
    const targetElement = headingElement || sectionElement;
    const headerOffset = 88;
    const top = targetElement.getBoundingClientRect().top + window.scrollY - headerOffset;

    window.scrollTo({ top, behavior: 'smooth' });
  };

  const waitForElementAndScroll = (targetId: string, maxAttempts = 20, interval = 100) => {
    console.log('[Index] waitForElementAndScroll called for:', targetId);
    let attempts = 0;

    const checkElement = () => {
      attempts++;
      const element = document.getElementById(targetId);
      
      if (element) {
        console.log('[Index] Element found after', attempts, 'attempts:', targetId);
        scrollToSectionElement(element);
        return;
      }

      if (attempts < maxAttempts) {
        console.log('[Index] Element not found, retrying (attempt', attempts, '/', maxAttempts, ')');
        setTimeout(checkElement, interval);
      } else {
        console.warn('[Index] Element not found after max attempts:', targetId);
      }
    };

    checkElement();
  };

  useEffect(() => {
    let mounted = true;
    
    // Initial fetch
    const loadSections = async () => {
      const { data } = await supabase.from('page_sections').select('*').order('sort_order');
      if (data && mounted) {
        setSections(data as PageSection[]);
        setIsLoading(false);
      }
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

  useEffect(() => {
    // Only scroll after sections are loaded
    if (isLoading) return;

    // When sections are loaded or hash changes, try to scroll
    if (location.hash.startsWith('#section-')) {
      const sectionId = location.hash.replace('#section-', '');
      const targetId = `section-${sectionId}`;
      console.log('[Index] Hash detected or sections loaded, targetId:', targetId);
      waitForElementAndScroll(targetId);
    } else {
      // If no hash, scroll to top on initial load
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [location.hash, isLoading]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className={`flex-1 ${showMobileStickySearch ? 'pt-40' : 'pt-24'} md:pt-32`}>
        {isLoading ? (
          // Placeholder to prevent footer from showing early
          <div className="h-screen" />
        ) : (
          sections.filter(s => s.is_visible).map((section) => {
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
          })
        )}
      </main>
      {!isLoading && <Footer />}
    </div>
  );
}
