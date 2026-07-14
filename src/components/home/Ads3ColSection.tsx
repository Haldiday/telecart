import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInfiniteStepCarousel } from '@/hooks/useInfiniteStepCarousel';
import { useFixedCarouselTouch } from '@/hooks/useFixedCarouselTouch';
import SubcategorySectionShell from './SubcategorySectionShell';
import RichTextContent from '@/components/shared/RichTextContent';
import { VideoModal } from '@/components/shared/VideoModal';
import { isVideoUrl } from '@/lib/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';

interface Ad {
  description: string | null;
  heading: string | null;
  id: string;
  image_url: string | null;
  link: string | null;
  sort_order: number;
  is_fixed: boolean;
  show_border: boolean;
  border_color: string | null;
  background_color: string | null;
  show_image: boolean;
  open_in_new_tab: boolean;
}

interface Ads3ColSectionProps {
  sectionId: string;
  sectionTable?: string;
  adsTable?: string;
  mobileContainImage?: boolean;
  compact?: boolean;
  backgroundColor?: string | null;
  headingClassName?: string;
}

async function fetchAds(sectionId: string, adsTable: string) {
  const db = supabase as any;
  const { data } = await db.from(adsTable).select('*').eq('section_id', sectionId).order('sort_order');
  return (data as any[])
    .filter(ad => ad.is_visible !== false)
    .map((ad) => ({
      ...ad,
      is_fixed: ad.is_fixed ?? false,
      show_border: ad.show_border ?? false,
      border_color: ad.border_color ?? null,
      background_color: ad.background_color ?? null,
      show_image: ad.show_image ?? true,
      is_visible: ad.is_visible ?? true,
      open_in_new_tab: ad.open_in_new_tab ?? false,
    }));
}

async function fetchSectionData(sectionId: string, sectionTable: string) {
  const db = supabase as any;
  const { data } = await db.from(sectionTable).select('heading, name, show_heading').eq('id', sectionId).single();
  return data as any;
}

export default function Ads3ColSection({
  sectionId,
  sectionTable = 'page_sections',
  adsTable = 'ads_3col',
  mobileContainImage = true,
  compact = false,
  backgroundColor,
  headingClassName,
}: Ads3ColSectionProps) {
  const queryClient = useQueryClient();
  const { data: ads = [] } = useQuery({
    queryKey: queryKeys.ads.bySectionId(sectionId, '3col'),
    queryFn: () => fetchAds(sectionId, adsTable),
  });
  const { data: sectionData } = useQuery({
    queryKey: [...queryKeys.pageSection.byId(sectionId), sectionTable] as const,
    queryFn: () => fetchSectionData(sectionId, sectionTable),
  });

  const heading = sectionData?.heading || sectionData?.name || '3 Column Ads';
  const showHeading = sectionData?.show_heading !== false;

  const isMobile = useIsMobile();
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const location = useLocation();
  const isSeeAllPage = location.pathname.startsWith("/see-all/3-ads");
  const [videoModal, setVideoModal] = useState<{ isOpen: boolean; url: string }>({ isOpen: false, url: '' });

  const handleAdClick = (ad: Ad) => {
    if (!ad.link) return;

    if (isVideoUrl(ad.link)) {
      setVideoModal({ isOpen: true, url: ad.link });
    } else {
      if (ad.open_in_new_tab) {
        window.open(ad.link, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = ad.link;
      }
    }
  };

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const visibleAds = useMemo(
    () => ads.filter((ad) => ad.show_image !== false),
    [ads]
  );
  const fixedMode = visibleAds.some((ad) => ad.is_fixed);
  const adsToDisplay = fixedMode ? visibleAds.filter(ad => ad.is_fixed) : visibleAds;
  const [fixedPageIndex, setFixedPageIndex] = useState(0);
  
  // Dynamic layout based on number of ads and screen size
  const visibleCount = useMemo(() => {
    if (windowWidth < 768) return 1; // Mobile
    if (windowWidth < 1024) return 2; // Tablet
    
    // Desktop: Always show 3 columns for consistent height
    return 3;
  }, [windowWidth]);
  
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

  const needsCarousel = !fixedMode && adsToDisplay.length > visibleCount;
  const showFixedControls = fixedMode && adsToDisplay.length > visibleCount;

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
  } = useInfiniteStepCarousel(adsToDisplay.length, visibleCount, needsCarousel);

  const {
    containerRef: fixedContainerRef,
    onTouchStart: onFixedTouchStart,
    onTouchMove: onFixedTouchMove,
    onTouchEnd: onFixedTouchEnd,
    getTransformStyle,
    getTransitionStyle,
  } = useFixedCarouselTouch(fixedPageIndex, totalFixedPages, setFixedPageIndex);

  useEffect(() => {
    const adsChannel = supabase
      .channel(`ads_3col_${sectionId}_live`)
      .on('postgres_changes', { event: '*', schema: 'public', table: adsTable }, () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.ads.bySectionId(sectionId, '3col') });
      })
      .subscribe();

    const sectionsChannel = supabase
      .channel(`page_sections_3col_${sectionId}_live`)
      .on('postgres_changes', { event: '*', schema: 'public', table: sectionTable }, () => {
        queryClient.invalidateQueries({ queryKey: [...queryKeys.pageSection.byId(sectionId), sectionTable] as const });
      })
      .subscribe();

    return () => {
      adsChannel.unsubscribe();
      sectionsChannel.unsubscribe();
    };
  }, [adsTable, sectionId, sectionTable, queryClient]);

  const displayAds = useMemo(
    () => !fixedMode && needsCarousel ? [...adsToDisplay, ...adsToDisplay.slice(0, duplicatedCount)] : adsToDisplay,
    [adsToDisplay, duplicatedCount, fixedMode, needsCarousel],
  );

  // Render logic for See All page
  const renderSeeAllPage = () => {
    if (adsToDisplay.length === 0) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          No ads to display
        </div>
      );
    }

    // Always show static grid layout (no carousel) on See All page, even on mobile
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {adsToDisplay.map((ad) => (
          <div key={ad.id} className="w-full">
            <div
                onClick={() => handleAdClick(ad)}
                className={`block w-full group rounded-2xl overflow-hidden cursor-pointer ${ad.show_border ? 'border' : ''}`}
                style={{
                  ...(ad.show_border && ad.border_color ? { borderColor: ad.border_color } : {}),
                  backgroundColor: ad.background_color || undefined
                }}
              >
                <div
                  className="w-full overflow-hidden h-[160px] sm:h-auto sm:aspect-[16/9]"
                >
                {ad.show_image !== false && ad.image_url && (
                  <img
                    src={ad.image_url}
                    alt={ad.heading || 'Ad'}
                    className="h-full w-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                )}
              </div>
              {(ad.heading || ad.description) && (
                <div className="p-3">
                  {ad.heading && <h3 className="text-xl font-semibold leading-tight text-foreground">{ad.heading}</h3>}
                  {ad.description && (
                    <RichTextContent
                      content={ad.description}
                      className="mt-2 text-base leading-relaxed text-muted-foreground [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-blue-600 [&_a]:underline"
                    />
                  )}
                </div>
              )}
              </div>
            </div>
          ))}
      </div>
    );
  };

  // Render logic for Home page
  const renderHomePage = () => {
    if (adsToDisplay.length === 0) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          No ads to display
        </div>
      );
    }

    return (
      <div className="relative group/fixed">
        {!isMobile && (showFixedControls || needsCarousel) && (
          <>
            <button
              onClick={fixedMode ? handleFixedPrev : goPrev}
              className={`absolute left-0 md:-left-12 ${visibleCount === 3 ? 'top-[100px] md:top-[125px]' : 'top-[80px] md:top-[110px] lg:top-[150px]'} -translate-y-1/2 z-10 p-1 md:p-2 text-black hover:text-black/70 transition-colors disabled:opacity-30`}
              disabled={fixedMode ? fixedPageIndex === 0 : false}
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-8 w-8 md:h-12 md:w-12 stroke-[1.5px]" />
            </button>
            <button
              onClick={fixedMode ? handleFixedNext : goNext}
              className={`absolute right-0 md:-right-12 ${visibleCount === 3 ? 'top-[100px] md:top-[125px]' : 'top-[80px] md:top-[110px] lg:top-[150px]'} -translate-y-1/2 z-10 p-1 md:p-2 text-black hover:text-black/70 transition-colors disabled:opacity-30`}
              disabled={fixedMode ? fixedPageIndex === totalFixedPages - 1 : false}
              aria-label="Next slide"
            >
              <ChevronRight className="h-8 w-8 md:h-12 md:w-12 stroke-[1.5px]" />
            </button>
          </>
        )}

        {needsCarousel ? (
          <div className="relative" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            <div 
              className="overflow-hidden overflow-x-hidden touch-pan-y"
              style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
              ref={containerRef}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div
                className="flex flex-row flex-nowrap"
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
                        onClick={() => handleAdClick(ad)}
                        className={`block group rounded-2xl overflow-hidden cursor-pointer ${ad.show_border ? 'border' : ''}`}
                        style={{
                          ...(ad.show_border && ad.border_color ? { borderColor: ad.border_color } : {}),
                          backgroundColor: ad.background_color || undefined
                        }}
                      >
                        <div
                          className="w-full overflow-hidden h-[160px] sm:h-auto sm:aspect-[16/9]"
                        >
                        {ad.show_image !== false && ad.image_url && (
                          <img
                            src={ad.image_url}
                            alt={ad.heading || 'Ad'}
                            className="h-full w-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                          />
                        )}
                      </div>
                      {(ad.heading || ad.description) && (
                        <div className={`p-3 ${ad.show_image !== false && ad.image_url ? '' : ''}`}>
                          {ad.heading && <h3 className="text-xl font-semibold leading-tight text-foreground">{ad.heading}</h3>}
                          {ad.description && (
                            <RichTextContent
                              content={ad.description}
                              className="mt-2 text-base leading-relaxed text-muted-foreground [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-blue-600 [&_a]:underline"
                            />
                          )}
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
              className="flex flex-row flex-nowrap"
              style={{ transform: getTransformStyle(), transition: getTransitionStyle() }}
            >
              {fixedPages.map((page, pageIdx) => (
                <div key={pageIdx} className={`w-full flex-none grid grid-cols-1 gap-3 ${visibleCount === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                  {page.map((ad) => (
                    <div key={ad.id} className="flex h-full">
                      <div
                        onClick={() => handleAdClick(ad)}
                        className={`block w-full group rounded-2xl overflow-hidden cursor-pointer ${ad.show_border ? 'border' : ''}`}
                        style={{
                          ...(ad.show_border && ad.border_color ? { borderColor: ad.border_color } : {}),
                          backgroundColor: ad.background_color || undefined
                        }}
                      >
                        <div
                          className="w-full overflow-hidden h-[160px] sm:h-auto sm:aspect-[16/9]"
                        >
                          {ad.show_image !== false && ad.image_url && (
                            <img
                              src={ad.image_url}
                              alt={ad.heading || 'Ad'}
                              className="h-full w-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                            />
                          )}
                        </div>
                        {(ad.heading || ad.description) && (
                          <div className="p-3">
                            {ad.heading && <h3 className="text-xl font-semibold leading-tight text-foreground">{ad.heading}</h3>}
                            {ad.description && (
                              <RichTextContent
                                content={ad.description}
                                className="mt-2 text-base leading-relaxed text-muted-foreground [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-blue-600 [&_a]:underline"
                              />
                            )}
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
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {adsToDisplay.map((ad) => (
              <div key={ad.id} className="w-full">
                <div
                    onClick={() => handleAdClick(ad)}
                    className={`block w-full group rounded-2xl overflow-hidden cursor-pointer ${ad.show_border ? 'border' : ''}`}
                    style={{
                      ...(ad.show_border && ad.border_color ? { borderColor: ad.border_color } : {}),
                      backgroundColor: ad.background_color || undefined
                    }}
                  >
                    <div
                      className="w-full overflow-hidden h-[160px] sm:h-auto sm:aspect-[16/9]"
                    >
                    {ad.show_image !== false && ad.image_url && (
                      <img
                        src={ad.image_url}
                        alt={ad.heading || 'Ad'}
                        className="h-full w-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    )}
                  </div>
                  {(ad.heading || ad.description) && (
                    <div className="p-3">
                      {ad.heading && <h3 className="text-xl font-semibold leading-tight text-foreground">{ad.heading}</h3>}
                      {ad.description && (
                        <RichTextContent
                          content={ad.description}
                          className="mt-2 text-base leading-relaxed text-muted-foreground [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-blue-600 [&_a]:underline"
                        />
                      )}
                    </div>
                  )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section id={`section-${sectionId}`}>
    <SubcategorySectionShell compact={compact} backgroundColor={backgroundColor} hasHeading={showHeading}>
    <div className={compact ? '' : 'py-4 md:py-6'}>
      <div className={compact ? '' : 'mx-auto max-w-[1580px] px-6 md:px-12'}>
        {showHeading && (
          <div className="flex items-center justify-between mb-8">
            <h2 className={headingClassName || "section-heading !mb-0"}>
              {heading}
            </h2>
            {!isSeeAllPage && (
              <Link to={`/see-all/3-ads/${sectionId}`} style={{ color: '#1d4ed8' }} className="text-base font-medium hover:underline px-8 py-1">
                See All
              </Link>
            )}
          </div>
        )}
        {isSeeAllPage ? renderSeeAllPage() : renderHomePage()}
      </div>
    </div>
    <VideoModal
      isOpen={videoModal.isOpen}
      onClose={() => setVideoModal({ isOpen: false, url: '' })}
      videoUrl={videoModal.url}
    />
    </SubcategorySectionShell>
    </section>
  );
}
