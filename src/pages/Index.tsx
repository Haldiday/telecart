import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSearch } from '@/contexts/SearchContext';
import { ChevronUp } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import FeaturedCards from '@/components/home/FeaturedCards';
import CategoriesSection from '@/components/home/CategoriesSection';
import OffersSection from '@/components/home/OffersSection';
import Ads1ColSection from '@/components/home/Ads1ColSection';
import Ads2ColSection from '@/components/home/Ads2ColSection';
import Ads3ColSection from '@/components/home/Ads3ColSection';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';

interface PageSection {
  id: string;
  section_type: string;
  name: string;
  sort_order: number;
  is_visible: boolean;
  background_color?: string | null;
}

interface HeroSettings {
  main_text?: string;
  animated_words?: string[];
  animated_word_visibility?: boolean[];
  hero_visible?: boolean;
  hero_text_part1_visible?: boolean;
  hero_text_part2_visible?: boolean;
  hero_animated_words_visible?: boolean;
  hero_search_visible?: boolean;
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

async function fetchHomePageSections() {
  const { data, error } = await supabase.from('page_sections').select('*').order('sort_order');
  if (error) throw error;
  return data as PageSection[];
}

async function fetchHeroSettings() {
  const { data, error } = await supabase.from('hero_settings').select('*').limit(1).single();
  if (error) throw error;
  return data as HeroSettings;
}

export default function Index() {
  const queryClient = useQueryClient();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const heroSectionRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const { showMobileStickySearch } = useSearch();

  const sectionsQuery = useQuery({
    queryKey: queryKeys.pageSections.home,
    queryFn: fetchHomePageSections,
  });

  const heroSettingsQuery = useQuery({
    queryKey: queryKeys.heroSettings.all,
    queryFn: fetchHeroSettings,
  });

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
    // Subscribe to real-time changes
    const subscription = supabase
      .channel('page_sections_homepage')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'page_sections' },
        () => {
          // Refetch sections when any change happens
          queryClient.invalidateQueries({ queryKey: queryKeys.pageSections.home });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hero_settings' },
        () => {
          // Refetch hero settings when any change happens
          queryClient.invalidateQueries({ queryKey: queryKeys.heroSettings.all });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const isLoading = sectionsQuery.isLoading || heroSettingsQuery.isLoading;
  const sections = sectionsQuery.data || [];
  const heroSettings = heroSettingsQuery.data || null;

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

  useEffect(() => {
    const handleScroll = () => {
      const heroElement = heroSectionRef.current;
      if (!heroElement) {
        setShowScrollTop(false);
        return;
      }

      const heroBottom = heroElement.getBoundingClientRect().bottom;
      setShowScrollTop(heroBottom <= 0);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className={`flex-1 ${showMobileStickySearch ? 'pt-40' : 'pt-24'} md:pt-32`}>
        {isLoading ? (
          // Placeholder to prevent footer from showing early
          <div className="h-screen" />
        ) : (
          <>
            {/* Always render Hero Section first */}
            <div ref={heroSectionRef}>
              <HeroSection heroSettings={heroSettings} />
            </div>

            {/* Render other sections from database */}
            {sections
              .filter(s => s.is_visible && s.section_type !== 'hero')
              .map((section) => {
                const Component = SECTION_MAP[section.section_type];
                if (!Component) return null;

                const sectionContent = (() => {
                  // Hide "See All" on mobile for Featured Cards in overview
                  if (section.section_type === 'cards') {
                    return <Component sectionId={section.id} hideSeeAllOnMobile={true} backgroundColor={section.background_color} />;
                  }

                  return <Component sectionId={section.id} backgroundColor={section.background_color} />;
                })();

                // Apply background color to section container if specified
                if (section.background_color) {
                  return (
                    <div key={section.id} style={{ backgroundColor: section.background_color }}>
                      {sectionContent}
                    </div>
                  );
                }

                return <div key={section.id}>{sectionContent}</div>;
              })}
          </>
        )}
      </main>
      {!isLoading && (
        <>
          <Footer />
          {showScrollTop && (
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-6 right-6 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl transition-opacity duration-300 hover:bg-slate-800"
              aria-label="Scroll to top"
            >
              <ChevronUp className="h-6 w-6" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
