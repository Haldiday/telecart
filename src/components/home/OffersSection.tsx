import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInfiniteStepCarousel } from '@/hooks/useInfiniteStepCarousel';
import { useFixedCarouselTouch } from '@/hooks/useFixedCarouselTouch';
import SubcategorySectionShell from './SubcategorySectionShell';

interface Offer {
  id: string;
  image_url: string | null;
  heading: string;
  description: string | null;
  link: string | null;
  sort_order: number;
  is_fixed: boolean;
  show_border: boolean;
  border_color: string | null;
  background_color: string | null;
  show_image: boolean;
}

interface OffersSectionProps {
  sectionId: string;
  sectionTable?: string;
  offersTable?: string;
  compact?: boolean;
  backgroundColor?: string | null;
  headingClassName?: string;
  isSubcategory?: boolean;
}

export default function OffersSection({
  sectionId,
  sectionTable = 'page_sections',
  offersTable = 'offers',
  compact = false,
  backgroundColor,
  headingClassName,
  isSubcategory = false,
}: OffersSectionProps) {
  const db = supabase as any;
  const [offers, setOffers] = useState<Offer[]>([]);
  const [heading, setHeading] = useState('Offers & Discounts');
  const [showHeading, setShowHeading] = useState(true);
  const isMobile = useIsMobile();
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const location = useLocation();
  const isSeeAllPage = location.pathname.startsWith("/see-all/offers");

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const visibleCount = useMemo(() => {
    if (windowWidth < 768) return 1;
    if (windowWidth < 1024) return 2;
    return 4;
  }, [windowWidth]);

  const visibleOffers = useMemo(
    () => offers.filter((offer) => offer.show_image !== false),
    [offers]
  );

  const isHomePage = window.location.pathname === '/';
  const fixedMode = visibleOffers.some((offer) => offer.is_fixed);
  const [fixedPageIndex, setFixedPageIndex] = useState(0);

  const totalFixedPages = Math.ceil(visibleOffers.length / visibleCount);

  // Group offers into pages for fixed mode sliding
  const fixedPages = useMemo(() => {
    const pages = [];
    for (let i = 0; i < visibleOffers.length; i += visibleCount) {
      pages.push(visibleOffers.slice(i, i + visibleCount));
    }
    return pages;
  }, [visibleOffers, visibleCount]);

  const handleFixedPrev = () => {
    setFixedPageIndex((prev) => (prev > 0 ? prev - 1 : totalFixedPages - 1));
  };

  const handleFixedNext = () => {
    setFixedPageIndex((prev) => (prev < totalFixedPages - 1 ? prev + 1 : 0));
  };

  const needsCarousel = !fixedMode && visibleOffers.length > visibleCount;
  const showFixedControls = fixedMode && visibleOffers.length > visibleCount;

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
  } = useInfiniteStepCarousel(visibleOffers.length, visibleCount, needsCarousel);

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
    
    const loadOffers = () => {
      db.from(offersTable).select('*').eq('section_id', sectionId).order('sort_order').then(({ data }: { data: Offer[] | null }) => {
        if (data && mounted) setOffers((data as any[])
          .filter(offer => offer.is_visible !== false)
          .map((offer) => ({
            ...offer,
            is_fixed: offer.is_fixed ?? false,
            show_border: offer.show_border ?? false,
            border_color: offer.border_color ?? null,
            background_color: offer.background_color ?? null,
            show_image: offer.show_image ?? true,
            is_visible: offer.is_visible ?? true,
          })));
      });
    };

    const loadSection = async () => {
      const { data } = await db
        .from(sectionTable)
        .select('heading, name, show_heading')
        .eq('id', sectionId)
        .single();
      
      if (data && mounted) {
        setHeading(data.heading || data.name || 'Offers & Discounts');
        setShowHeading(data.show_heading !== false);
      }
    };

    loadOffers();
    loadSection();

    const offersChannel = supabase
      .channel(`offers_${sectionId}_live`)
      .on('postgres_changes', { event: '*', schema: 'public', table: offersTable }, loadOffers)
      .subscribe();

    const sectionsChannel = supabase
      .channel(`page_sections_offers_${sectionId}_live`)
      .on('postgres_changes', { event: '*', schema: 'public', table: sectionTable }, loadSection)
      .subscribe();

    return () => {
      mounted = false;
      offersChannel.unsubscribe();
      sectionsChannel.unsubscribe();
    };
  }, [db, offersTable, sectionId, sectionTable]);

  const displayOffers = useMemo(
    () => !fixedMode && needsCarousel ? [...visibleOffers, ...visibleOffers.slice(0, duplicatedCount)] : visibleOffers,
    [visibleOffers, duplicatedCount, fixedMode, needsCarousel],
  );

  // Render logic for See All page
  const renderSeeAllPage = () => {
    if (visibleOffers.length === 0) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          No offers to display
        </div>
      );
    }

    if (isMobile) {
      // Keep existing carousel behavior on mobile
      return (
        <div className="relative group/fixed">
          {!isMobile && (showFixedControls || needsCarousel) && (
            <>
              <button
                onClick={fixedMode ? handleFixedPrev : goPrev}
                className="absolute left-0 md:-left-12 top-[150px] -translate-y-1/2 z-20 p-1 md:p-2 text-black hover:text-black/70 transition-colors disabled:opacity-30"
                disabled={fixedMode ? fixedPageIndex === 0 : false}
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-8 w-8 md:h-12 md:w-12 stroke-[1.5px]" />
              </button>
              <button
                onClick={fixedMode ? handleFixedNext : goNext}
                className="absolute right-0 md:-right-12 top-[150px] -translate-y-1/2 z-20 p-1 md:p-2 text-black hover:text-black/70 transition-colors disabled:opacity-30"
                disabled={fixedMode ? fixedPageIndex === totalFixedPages - 1 : false}
                aria-label="Next slide"
              >
                <ChevronRight className="h-8 w-8 md:h-12 md:w-12 stroke-[1.5px]" />
              </button>
            </>
          )}

          {needsCarousel ? (
            <div className="relative md:px-20" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
              <div 
                className="overflow-hidden overflow-x-hidden rounded-lg -mx-[9px] md:-mx-10 touch-pan-y"
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
                  {displayOffers.map((offer, displayIndex) => (
                    <div
                      key={`${offer.id}-${displayIndex}`}
                      className="flex-none px-[9px]"
                      style={{ width: `${slideWidth}%` }}
                    >
                      <a 
                        href={offer.link || '#'} 
                        className={`flex flex-col group mx-auto h-full ${(isHomePage || isSubcategory) ? 'w-full' : ''}`}
                        style={{ maxWidth: (isHomePage || isSubcategory) ? '330px' : undefined }}
                      >
                        {offer.show_image !== false && offer.image_url && (
                          <div
                            className={`overflow-hidden rounded-xl w-full flex-shrink-0 ${offer.show_border ? 'border' : ''}`}
                            style={{
                              height: (isHomePage || isSubcategory) ? '335px' : '300px',
                              borderColor: offer.show_border && offer.border_color ? offer.border_color : undefined,
                              backgroundColor: offer.background_color || undefined
                            }}
                          >
                            <img
                              src={offer.image_url}
                              alt={offer.heading || 'Offer'}
                              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                        )}
                        {(offer.heading || offer.description) && (
                          <div className={`px-1 flex-grow flex flex-col justify-start ${offer.show_image !== false && offer.image_url ? 'pt-3' : ''}`}>
                            {offer.heading && (
                              <h3 className="mb-1 text-center text-lg md:text-xl font-semibold line-clamp-1">
                                {offer.heading}
                              </h3>
                            )}
                            {offer.description && (
                              <p className="text-center text-sm md:text-base leading-relaxed text-muted-foreground line-clamp-2">
                                {offer.description}
                              </p>
                            )}
                          </div>
                        )}
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile Navigation */}
              <div className="flex gap-2 md:hidden justify-center mt-4">
                
              </div>
            </div>
          ) : (
            <div 
              className="overflow-hidden overflow-x-hidden touch-pan-y" 
              style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
              ref={fixedContainerRef} 
              onTouchStart={onFixedTouchStart} 
              onTouchMove={onFixedTouchMove} 
              onTouchEnd={onFixedTouchEnd}
            >
              <div 
                className="flex"
                style={{ transform: getTransformStyle(), transition: getTransitionStyle() }}
              >
                {fixedPages.map((page, pageIdx) => (
                  <div key={pageIdx} className="w-full flex-none grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 md:px-12">
                    {page.map((offer) => (
                      <div key={offer.id} className="flex h-full">
                        <a 
                          href={offer.link || '#'} 
                          className={`flex flex-col group mx-auto h-full ${(isHomePage || isSubcategory) ? 'w-full' : ''}`}
                          style={{ maxWidth: (isHomePage || isSubcategory) ? '380px' : undefined }}
                        >
                          {offer.show_image !== false && offer.image_url && (
                            <div
                              className={`overflow-hidden rounded-xl mx-auto w-full flex-shrink-0 ${offer.show_border ? 'border' : ''}`}
                              style={{
                                height: (isHomePage || isSubcategory) ? '335px' : '300px',
                                borderColor: offer.show_border && offer.border_color ? offer.border_color : undefined,
                                backgroundColor: offer.background_color || undefined
                              }}
                            >
                              <img
                                src={offer.image_url}
                                alt={offer.heading || 'Offer'}
                                className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                              />
                            </div>
                          )}
                          {(offer.heading || offer.description) && (
                            <div className={`px-1 flex-grow flex flex-col justify-start ${offer.show_image !== false && offer.image_url ? 'pt-3' : ''}`}>
                              {offer.heading && (
                                <h3 className="mb-1 text-center text-lg md:text-xl font-semibold line-clamp-1">
                                  {offer.heading}
                                </h3>
                              )}
                              {offer.description && (
                                <p className="text-center text-sm md:text-base leading-relaxed text-muted-foreground line-clamp-2">
                                  {offer.description}
                                </p>
                              )}
                            </div>
                          )}
                        </a>
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
          )}
        </div>
      );
    }

    // Desktop/Tablet: Show all offers in grid, no carousel (exact same as home page fixed mode grid)
    return (
      <div className="w-full grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 md:px-12">
        {visibleOffers.map((offer) => (
          <div key={offer.id} className="flex h-full">
            <a 
              href={offer.link || '#'} 
              className={`flex flex-col group mx-auto h-full ${(isHomePage || isSubcategory) ? 'w-full' : ''}`}
              style={{ maxWidth: (isHomePage || isSubcategory) ? '380px' : undefined }}
            >
              {offer.show_image !== false && offer.image_url && (
                <div
                  className={`overflow-hidden rounded-xl mx-auto w-full flex-shrink-0 ${offer.show_border ? 'border' : ''}`}
                  style={{
                    height: (isHomePage || isSubcategory) ? '335px' : '300px',
                    borderColor: offer.show_border && offer.border_color ? offer.border_color : undefined,
                    backgroundColor: offer.background_color || undefined
                  }}
                >
                  <img
                    src={offer.image_url}
                    alt={offer.heading || 'Offer'}
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}
              {(offer.heading || offer.description) && (
                <div className={`px-1 flex-grow flex flex-col justify-start ${offer.show_image !== false && offer.image_url ? 'pt-3' : ''}`}>
                  {offer.heading && (
                    <h3 className="mb-1 text-center text-lg md:text-xl font-semibold line-clamp-1">
                      {offer.heading}
                    </h3>
                  )}
                  {offer.description && (
                    <p className="text-center text-sm md:text-base leading-relaxed text-muted-foreground line-clamp-2">
                      {offer.description}
                    </p>
                  )}
                </div>
              )}
            </a>
          </div>
        ))}
      </div>
    );
  };

  // Render logic for Home page
  const renderHomePage = () => {
    if (visibleOffers.length === 0) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          No offers to display
        </div>
      );
    }

    return (
      <div className="relative group/fixed">
        {!isMobile && (showFixedControls || needsCarousel) && (
          <>
            <button
              onClick={fixedMode ? handleFixedPrev : goPrev}
              className="absolute left-0 md:-left-12 top-[150px] -translate-y-1/2 z-20 p-1 md:p-2 text-black hover:text-black/70 transition-colors disabled:opacity-30"
              disabled={fixedMode ? fixedPageIndex === 0 : false}
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-8 w-8 md:h-12 md:w-12 stroke-[1.5px]" />
            </button>
            <button
              onClick={fixedMode ? handleFixedNext : goNext}
              className="absolute right-0 md:-right-12 top-[150px] -translate-y-1/2 z-20 p-1 md:p-2 text-black hover:text-black/70 transition-colors disabled:opacity-30"
              disabled={fixedMode ? fixedPageIndex === totalFixedPages - 1 : false}
              aria-label="Next slide"
            >
              <ChevronRight className="h-8 w-8 md:h-12 md:w-12 stroke-[1.5px]" />
            </button>
          </>
        )}

        {needsCarousel ? (
          <div className="relative md:px-20" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            <div 
              className="overflow-hidden overflow-x-hidden rounded-lg -mx-[9px] md:-mx-10 touch-pan-y"
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
                {displayOffers.map((offer, displayIndex) => (
                  <div
                    key={`${offer.id}-${displayIndex}`}
                    className="flex-none px-[9px]"
                    style={{ width: `${slideWidth}%` }}
                  >
                    <a 
                      href={offer.link || '#'} 
                      className={`flex flex-col group mx-auto h-full ${(isHomePage || isSubcategory) ? 'w-full' : ''}`}
                      style={{ maxWidth: (isHomePage || isSubcategory) ? '330px' : undefined }}
                    >
                      {offer.show_image !== false && offer.image_url && (
                        <div
                          className={`overflow-hidden rounded-xl w-full flex-shrink-0 ${offer.show_border ? 'border' : ''}`}
                          style={{
                            height: (isHomePage || isSubcategory) ? '335px' : '300px',
                            borderColor: offer.show_border && offer.border_color ? offer.border_color : undefined,
                            backgroundColor: offer.background_color || undefined
                          }}
                        >
                          <img
                            src={offer.image_url}
                            alt={offer.heading || 'Offer'}
                            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      )}
                      {(offer.heading || offer.description) && (
                        <div className={`px-1 flex-grow flex flex-col justify-start ${offer.show_image !== false && offer.image_url ? 'pt-3' : ''}`}>
                          {offer.heading && (
                            <h3 className="mb-1 text-center text-lg md:text-xl font-semibold line-clamp-1">
                              {offer.heading}
                            </h3>
                          )}
                          {offer.description && (
                            <p className="text-center text-sm md:text-base leading-relaxed text-muted-foreground line-clamp-2">
                              {offer.description}
                            </p>
                          )}
                        </div>
                      )}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Navigation */}
            <div className="flex gap-2 md:hidden justify-center mt-4">
              
            </div>
          </div>
        ) : (
          <div 
            className="overflow-hidden overflow-x-hidden touch-pan-y" 
            style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
            ref={fixedContainerRef} 
            onTouchStart={onFixedTouchStart} 
            onTouchMove={onFixedTouchMove} 
            onTouchEnd={onFixedTouchEnd}
          >
            <div 
              className="flex"
              style={{ transform: getTransformStyle(), transition: getTransitionStyle() }}
            >
              {fixedPages.map((page, pageIdx) => (
                <div key={pageIdx} className="w-full flex-none grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 md:px-12">
                  {page.map((offer) => (
                    <div key={offer.id} className="flex h-full">
                      <a 
                        href={offer.link || '#'} 
                        className={`flex flex-col group mx-auto h-full ${(isHomePage || isSubcategory) ? 'w-full' : ''}`}
                        style={{ maxWidth: (isHomePage || isSubcategory) ? '380px' : undefined }}
                      >
                        {offer.show_image !== false && offer.image_url && (
                          <div
                            className={`overflow-hidden rounded-xl mx-auto w-full flex-shrink-0 ${offer.show_border ? 'border' : ''}`}
                            style={{
                              height: (isHomePage || isSubcategory) ? '335px' : '300px',
                              borderColor: offer.show_border && offer.border_color ? offer.border_color : undefined,
                              backgroundColor: offer.background_color || undefined
                            }}
                          >
                            <img
                              src={offer.image_url}
                              alt={offer.heading || 'Offer'}
                              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                        )}
                        {(offer.heading || offer.description) && (
                          <div className={`px-1 flex-grow flex flex-col justify-start ${offer.show_image !== false && offer.image_url ? 'pt-3' : ''}`}>
                            {offer.heading && (
                              <h3 className="mb-1 text-center text-lg md:text-xl font-semibold line-clamp-1">
                                {offer.heading}
                              </h3>
                            )}
                            {offer.description && (
                              <p className="text-center text-sm md:text-base leading-relaxed text-muted-foreground line-clamp-2">
                                {offer.description}
                              </p>
                            )}
                          </div>
                        )}
                      </a>
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
        )}
      </div>
    );
  };

  return (
    <SubcategorySectionShell compact={compact} backgroundColor={backgroundColor} hasHeading={showHeading}>
      <div className={compact ? '' : 'py-4 md:py-6'}>
        <div className={compact ? '' : 'mx-auto max-w-[1580px] px-9 md:px-20 lg:px-10'}>
          {showHeading && (
            <div className="flex items-center justify-between mb-8">
              <h2 className={headingClassName || "section-heading !mb-0"}>
                {heading}
              </h2>
              {!isSeeAllPage && (
                <Link to="/see-all/offers" style={{ color: '#1d4ed8' }} className="text-sm font-medium hover:underline">
                  See All
                </Link>
              )}
            </div>
          )}
          {isSeeAllPage ? renderSeeAllPage() : renderHomePage()}
        </div>
      </div>
    </SubcategorySectionShell>
  );
}
