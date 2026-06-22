import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInfiniteStepCarousel } from '@/hooks/useInfiniteStepCarousel';
import SubcategorySectionShell from './SubcategorySectionShell';

interface Ad {
  id: string;
  image_url: string | null;
  link: string | null;
  sort_order: number;
  is_fixed: boolean;
  show_border: boolean;
  border_color: string | null;
  background_color: string | null;
  show_image: boolean;
}

interface Ads1ColSectionProps {
  sectionId: string;
  sectionTable?: string;
  adsTable?: string;
  mobileContainImage?: boolean;
  compact?: boolean;
  backgroundColor?: string | null;
  headingClassName?: string;
}

export default function Ads1ColSection({
  sectionId,
  sectionTable = 'page_sections',
  adsTable = 'ads_2col',
  mobileContainImage = true,
  compact = false,
  backgroundColor,
  headingClassName,
}: Ads1ColSectionProps) {
  const db = supabase as any;
  const [ads, setAds] = useState<Ad[]>([]);
  const [heading, setHeading] = useState('Featured Ad');
  const [showHeading, setShowHeading] = useState(true);
  const isMobile = useIsMobile();
  const fixedMode = ads.some((ad) => ad.is_fixed);
  const adsToDisplay = fixedMode ? ads.filter((ad) => ad.is_fixed) : ads;
  const needsCarousel = !fixedMode && adsToDisplay.length > 1;

  const {
    index,
    animate,
    goNext,
    goPrev,
    handleTransitionEnd,
    slideWidth,
    duplicatedCount,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseEnter,
    onMouseLeave,
    dragOffset,
    containerRef,
  } = useInfiniteStepCarousel(adsToDisplay.length, 1, needsCarousel);

  const displayAds = needsCarousel
    ? [...adsToDisplay, ...adsToDisplay.slice(0, duplicatedCount)]
    : adsToDisplay;

  useEffect(() => {
    let mounted = true;
    
    const loadAds = () => {
      db
        .from(adsTable)
        .select('*')
        .eq('section_id', sectionId)
        .order('sort_order')
        .then(({ data }) => {
          if (data && mounted) {
            setAds(
              (data as any[])
                .filter(ad => ad.is_visible !== false)
                .map((ad) => ({
                  ...ad,
                  is_fixed: ad.is_fixed ?? false,
                  show_border: ad.show_border ?? false,
                  border_color: ad.border_color ?? null,
                  background_color: ad.background_color ?? null,
                  show_image: ad.show_image ?? true,
                  is_visible: ad.is_visible ?? true,
                }))
            );
          }
        });
    };

    const loadSection = async () => {
      const { data } = await db
        .from(sectionTable)
        .select('heading, name, show_heading')
        .eq('id', sectionId)
        .single();

      if (data && mounted) {
        setHeading(data.heading || data.name || 'Featured Ad');
        setShowHeading(data.show_heading !== false);
      }
    };

    loadAds();
    loadSection();

    const adsChannel = supabase
      .channel(`ads_1col_${sectionId}_live`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: adsTable },
        loadAds
      )
      .subscribe();

    const sectionChannel = supabase
      .channel(`page_sections_1col_${sectionId}_live`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: sectionTable },
        loadSection
      )
      .subscribe();

    return () => {
      mounted = false;
      adsChannel.unsubscribe();
      sectionChannel.unsubscribe();
    };
  }, [adsTable, db, sectionId, sectionTable]);

  if (ads.length === 0) return null;

  return (
    <SubcategorySectionShell compact={compact} backgroundColor={backgroundColor} hasHeading={showHeading}>
    <div className={compact ? '' : 'py-4 md:py-6'}>
      <div className={compact ? '' : 'mx-auto max-w-[1580px] px-6 md:px-12'}>
        {showHeading && (
          <h2 className={headingClassName || "section-heading"}>
            {heading}
          </h2>
        )}

        <div className="relative">
          {!isMobile && needsCarousel && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-0 md:-left-12 top-1/2 -translate-y-1/2 z-10 p-1 md:p-2 text-black hover:text-black/70 transition-colors"
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-8 w-8 md:h-12 md:w-12 stroke-[1.5px]" />
              </button>
              <button
                onClick={goNext}
                className="absolute right-0 md:-right-12 top-1/2 -translate-y-1/2 z-10 p-1 md:p-2 text-black hover:text-black/70 transition-colors"
                aria-label="Next slide"
              >
                <ChevronRight className="h-8 w-8 md:h-12 md:w-12 stroke-[1.5px]" />
              </button>
            </>
          )}

          {needsCarousel ? (
            <div
              className="overflow-hidden touch-pan-y"
              style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
              ref={containerRef}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
            >
              <div
                className="flex"
                onTransitionEnd={handleTransitionEnd}
                style={{
                  transform: `translateX(calc(-${index * slideWidth}% + ${dragOffset}%))`,
                  transition: animate ? 'transform 650ms ease' : 'none',
                }}
              >
                {displayAds.map((ad, displayIndex) => (
                  <div
                    key={`${ad.id}-${displayIndex}`}
                    className="w-full flex-none"
                    style={{ width: `${slideWidth}%` }}
                  >
                    <div
                      className={`rounded-[12px] overflow-hidden shadow-sm cursor-pointer ${ad.show_border ? 'border' : ''}`}
                      style={{
                        ...(ad.show_border && ad.border_color ? { borderColor: ad.border_color } : {}),
                        backgroundColor: ad.background_color || undefined,
                      }}
                      onClick={() => {
                        if (ad.link) {
                          window.location.href = ad.link;
                        }
                      }}
                    >
                      <div className="block overflow-hidden rounded-[12px] transition-transform duration-300 hover:scale-[1.01]">
                        <div className="h-[160px] md:h-[220px] lg:h-[300px] w-full flex items-center justify-center">
                          {ad.show_image !== false && ad.image_url && (
                            <img
                              src={ad.image_url}
                              alt="Ad"
                              className={`h-full w-full ${mobileContainImage ? 'object-contain md:object-contain' : 'object-contain'}`}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {adsToDisplay.map((ad) => (
                <div 
                  key={ad.id}
                  className={`rounded-[12px] overflow-hidden shadow-sm cursor-pointer ${ad.show_border ? 'border' : ''}`} 
                  style={{
                    ...(ad.show_border && ad.border_color ? { borderColor: ad.border_color } : {}),
                    backgroundColor: ad.background_color || undefined,
                  }}
                  onClick={() => {
                    if (ad.link) {
                      window.location.href = ad.link;
                    }
                  }}
                >
                  <div
                    className="block overflow-hidden rounded-[12px] transition-transform duration-300 hover:scale-[1.01]"
                  >
                    <div className="h-[160px] md:h-[220px] lg:h-[300px] w-full flex items-center justify-center">
                      {ad.show_image !== false && ad.image_url && (
                        <img
                          src={ad.image_url}
                          alt="Ad"
                          className={`h-full w-full ${mobileContainImage ? 'object-contain md:object-contain' : 'object-contain'}`}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </SubcategorySectionShell>
  );
}
