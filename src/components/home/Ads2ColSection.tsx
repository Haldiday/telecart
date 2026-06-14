import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInfiniteStepCarousel } from '@/hooks/useInfiniteStepCarousel';
import { useFixedCarouselTouch } from '@/hooks/useFixedCarouselTouch';
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
}

interface Ads2ColSectionProps {
  sectionId: string;
  sectionTable?: string;
  adsTable?: string;
  mobileContainImage?: boolean;
  compact?: boolean;
  backgroundColor?: string | null;
  headingClassName?: string;
}

export default function Ads2ColSection({
  sectionId,
  sectionTable = 'page_sections',
  adsTable = 'ads_2col',
  mobileContainImage = true,
  compact = false,
  backgroundColor,
  headingClassName,
}: Ads2ColSectionProps) {
  const db = supabase as any;
  const [ads, setAds] = useState<Ad[]>([]);
  const [heading, setHeading] = useState('2 Column Ads');
  const [showHeading, setShowHeading] = useState(true);
  const isMobile = useIsMobile();
  const visibleCount = isMobile ? 1 : 2;
  const fixedMode = ads.some((ad) => ad.is_fixed);
  // When Fixed Mode is ON, show only the first 2 ads selected/ordered by admin.
  const adsToDisplay = fixedMode ? ads.filter(ad => ad.is_fixed).slice(0, 2) : ads;
  const [fixedPageIndex, setFixedPageIndex] = useState(0);
  const totalFixedPages = Math.ceil(adsToDisplay.length / visibleCount);

  // Group ads into pages for fixed mode sliding
  const fixedPages = useMemo(() => {
    if (!fixedMode) return [];
    const pages = [];
    for (let i = 0; i < adsToDisplay.length; i += visibleCount) {
      pages.push(adsToDisplay.slice(i, i + visibleCount));
    }
    return pages;
  }, [fixedMode, adsToDisplay, visibleCount]);

  const handleFixedPrev = () => {
    setFixedPageIndex((prev) => (prev > 0 ? prev - 1 : totalFixedPages - 1));
  };

  const handleFixedNext = () => {
    setFixedPageIndex((prev) => (prev < totalFixedPages - 1 ? prev + 1 : 0));
  };

  const needsCarousel = !fixedMode && ads.length > visibleCount;
  // Disable slider/controls in fixed mode as per requirements
  const showFixedControls = false;

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
    dragOffset,
    containerRef,
  } = useInfiniteStepCarousel(ads.length, visibleCount, needsCarousel);

  const {
    containerRef: fixedContainerRef,
    onTouchStart: onFixedTouchStart,
    onTouchMove: onFixedTouchMove,
    onTouchEnd: onFixedTouchEnd,
    getTransformStyle,
    getTransitionStyle,
  } = useFixedCarouselTouch(fixedPageIndex, totalFixedPages, setFixedPageIndex);

  useEffect(() => {
    let mounted = true;
    
    const loadAds = () => {
      db.from(adsTable).select('*').eq('section_id', sectionId).order('sort_order').then(({ data }) => {
        if (data && mounted) {
          setAds((data as any[]).map((ad) => ({
            ...ad,
            is_fixed: ad.is_fixed ?? false,
            show_border: ad.show_border ?? false,
            border_color: ad.border_color ?? null,
            background_color: ad.background_color ?? null,
          })));
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
        setHeading(data.heading || data.name || '2 Column Ads');
        setShowHeading(data.show_heading !== false);
      }
    };

    loadAds();
    loadSection();

    const adsChannel = supabase
      .channel(`ads_2col_${sectionId}_live`)
      .on('postgres_changes', { event: '*', schema: 'public', table: adsTable }, loadAds)
      .subscribe();

    const sectionsChannel = supabase
      .channel(`page_sections_2col_${sectionId}_live`)
      .on('postgres_changes', { event: '*', schema: 'public', table: sectionTable }, loadSection)
      .subscribe();

    return () => {
      mounted = false;
      adsChannel.unsubscribe();
      sectionsChannel.unsubscribe();
    };
  }, [adsTable, db, sectionId, sectionTable]);

  const displayAds = useMemo(
    () => !fixedMode && needsCarousel ? [...adsToDisplay, ...adsToDisplay.slice(0, duplicatedCount)] : adsToDisplay,
    [adsToDisplay, duplicatedCount, fixedMode, needsCarousel],
  );

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
        <div className="relative group/fixed">
          {(showFixedControls || needsCarousel) && (
            <>
              <button
                onClick={fixedMode ? handleFixedPrev : goPrev}
                className="absolute left-0 md:-left-12 top-[80px] md:top-[150px] -translate-y-1/2 z-10 p-1 md:p-2 text-black hover:text-black/70 transition-colors disabled:opacity-30"
                disabled={fixedMode ? fixedPageIndex === 0 : false}
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-8 w-8 md:h-12 md:w-12 stroke-[1.5px]" />
              </button>
              <button
                onClick={fixedMode ? handleFixedNext : goNext}
                className="absolute right-0 md:-right-12 top-[80px] md:top-[150px] -translate-y-1/2 z-10 p-1 md:p-2 text-black hover:text-black/70 transition-colors disabled:opacity-30"
                disabled={fixedMode ? fixedPageIndex === totalFixedPages - 1 : false}
                aria-label="Next slide"
              >
                <ChevronRight className="h-8 w-8 md:h-12 md:w-12 stroke-[1.5px]" />
              </button>
            </>
          )}

          {fixedMode && isMobile ? (
            <div className="flex flex-col gap-5">
              {adsToDisplay.map((ad) => (
                <div key={ad.id} className="w-full">
                  <div
                    onClick={() => {
                      if (ad.link) {
                        window.location.href = ad.link;
                      }
                    }}
                    className={`block w-full h-[120px] md:h-[160px] lg:h-[280px] overflow-hidden rounded-xl cursor-pointer ${ad.show_border ? 'border' : ''}`}
                    style={{
                      ...(ad.show_border && ad.border_color ? { borderColor: ad.border_color } : {}),
                      backgroundColor: ad.background_color || undefined,
                    }}
                  >
                    {ad.image_url && (
                      <div className="w-full h-full flex items-center justify-center">
                        <img
                          src={ad.image_url}
                          alt="Ad"
                          className={`h-full w-full transition-transform duration-300 hover:scale-105 object-contain`}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : needsCarousel ? (
            <div className="relative">
              <div 
                className="overflow-hidden overflow-x-hidden touch-pan-y"
                style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
                ref={containerRef}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
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
                      className="flex-none px-1.5"
                      style={{ width: `${slideWidth}%` }}
                    >
                      <div
                        onClick={() => {
                          if (ad.link) {
                            window.location.href = ad.link;
                          }
                        }}
                        className={`block h-[160px] md:h-[220px] lg:h-[280px] overflow-hidden rounded-xl cursor-pointer ${ad.show_border ? 'border' : ''}`}
                        style={{
                          ...(ad.show_border && ad.border_color ? { borderColor: ad.border_color } : {}),
                          backgroundColor: ad.background_color || undefined,
                        }}
                      >
                        {ad.image_url && (
                          <div className="w-full h-full flex items-center justify-center">
                            <img
                              src={ad.image_url}
                              alt="Ad"
                              className={`h-full w-full transition-transform duration-300 hover:scale-105 object-contain`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (fixedMode && adsToDisplay.length > visibleCount) ? (
            <div className="overflow-hidden overflow-x-hidden touch-pan-y" style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }} ref={fixedContainerRef} onTouchStart={onFixedTouchStart} onTouchMove={onFixedTouchMove} onTouchEnd={onFixedTouchEnd}>
              <div 
                className="flex"
                style={{ transform: getTransformStyle(), transition: getTransitionStyle() }}
              >
                {fixedPages.map((page, pageIdx) => (
                  <div key={pageIdx} className="w-full flex-none grid grid-cols-1 gap-5 md:grid-cols-2">
                    {page.map((ad) => (
                      <div key={ad.id} className="flex h-full">
                        <div
                          onClick={() => {
                            if (ad.link) {
                              window.location.href = ad.link;
                            }
                          }}
                          className={`block w-full h-[120px] md:h-[160px] lg:h-[280px] overflow-hidden rounded-xl bg-muted cursor-pointer ${ad.show_border ? 'border' : ''}`}
                          style={ad.show_border && ad.border_color ? { borderColor: ad.border_color } : {}}
                        >
                          {ad.image_url && (
                          <div className="w-full h-full flex items-center justify-center">
                            <img
                              src={ad.image_url}
                              alt="Ad"
                              className={`h-full w-full transition-transform duration-300 hover:scale-105 object-contain`}
                            />
                          </div>
                        )}
                        </div>
                      </div>
                    ))}
                    {/* Fill empty spaces in fixed mode if current page has less than visibleCount items */}
                    {Array.from({ length: visibleCount - page.length }).map((_, i) => (
                      <div key={`empty-${i}`} className="hidden md:flex h-full" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex gap-5">
              {adsToDisplay.map((ad) => (
                <div key={ad.id} className="w-1/2">
                  <div
                    onClick={() => {
                      if (ad.link) {
                        window.location.href = ad.link;
                      }
                    }}
                    className={`block w-full h-[120px] md:h-[160px] lg:h-[280px] overflow-hidden rounded-xl cursor-pointer ${ad.show_border ? 'border' : ''}`}
                    style={{
                      ...(ad.show_border && ad.border_color ? { borderColor: ad.border_color } : {}),
                      backgroundColor: ad.background_color || undefined,
                    }}
                  >
                    {ad.image_url && (
                      <div className="w-full h-full flex items-center justify-center">
                        <img
                          src={ad.image_url}
                          alt="Ad"
                          className={`h-full w-full transition-transform duration-300 hover:scale-105 object-contain`}
                        />
                      </div>
                    )}
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
