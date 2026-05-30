import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInfiniteStepCarousel } from '@/hooks/useInfiniteStepCarousel';
import SubcategorySectionShell from './SubcategorySectionShell';
import { Button } from '@/components/ui/button';

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
}

interface OffersSectionProps {
  sectionId: string;
  sectionTable?: string;
  offersTable?: string;
  compact?: boolean;
  backgroundColor?: string | null;
  headingClassName?: string;
}

export default function OffersSection({
  sectionId,
  sectionTable = 'page_sections',
  offersTable = 'offers',
  compact = false,
  backgroundColor,
  headingClassName,
}: OffersSectionProps) {
  const db = supabase as any;
  const [offers, setOffers] = useState<Offer[]>([]);
  const [heading, setHeading] = useState('Offers & Discounts');
  const [showHeading, setShowHeading] = useState(true);
  const isMobile = useIsMobile();
  const isHomePage = window.location.pathname === '/';
  const visibleCount = isMobile ? 1 : 4;
  const fixedMode = offers.some((offer) => offer.is_fixed);
  const [fixedPageIndex, setFixedPageIndex] = useState(0);

  const totalFixedPages = Math.ceil(offers.length / visibleCount);

  // Group offers into pages for fixed mode sliding
  const fixedPages = useMemo(() => {
    if (!fixedMode) return [];
    const pages = [];
    for (let i = 0; i < offers.length; i += visibleCount) {
      pages.push(offers.slice(i, i + visibleCount));
    }
    return pages;
  }, [fixedMode, offers, visibleCount]);

  const needsCarousel = !fixedMode && offers.length > visibleCount;
  const showFixedControls = fixedMode && offers.length > visibleCount;

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
  } = useInfiniteStepCarousel(offers.length, visibleCount, needsCarousel);

  const handleFixedPrev = () => {
    setFixedPageIndex((prev) => (prev > 0 ? prev - 1 : totalFixedPages - 1));
  };

  const handleFixedNext = () => {
    setFixedPageIndex((prev) => (prev < totalFixedPages - 1 ? prev + 1 : 0));
  };

  useEffect(() => {
    let mounted = true;
    
    const loadOffers = () => {
      db.from(offersTable).select('*').eq('section_id', sectionId).order('sort_order').then(({ data }: { data: Offer[] | null }) => {
        if (data && mounted) setOffers(data);
      });
    };

    const loadSection = async () => {
      const { data } = await db
        .from(sectionTable)
        .select('heading, show_heading')
        .eq('id', sectionId)
        .single();
      
      if (data && mounted) {
        setHeading(data.heading || 'Offers & Discounts');
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
    () => !fixedMode && needsCarousel ? [...offers, ...offers.slice(0, duplicatedCount)] : offers,
    [offers, duplicatedCount, fixedMode, needsCarousel],
  );

  if (offers.length === 0) return null;

  return (
    <SubcategorySectionShell compact={compact} backgroundColor={backgroundColor}>
    <div className={compact ? '' : 'py-4 md:py-6'}>
      <div className={compact ? '' : 'mx-auto max-w-[1580px] px-6 md:px-12'}>
        <div className="flex items-center justify-between mb-4">
          {showHeading && (
            <h2 className={headingClassName || "section-heading !mb-0"}>
              {heading}
            </h2>
          )}
        </div>

        <div className="relative group/fixed">
          {(showFixedControls || needsCarousel) && (
            <>
              <button
                onClick={fixedMode ? handleFixedPrev : goPrev}
                className="absolute left-0 md:-left-12 top-[150px] -translate-y-1/2 z-10 p-1 md:p-2 text-black hover:text-black/70 transition-colors disabled:opacity-30"
                disabled={fixedMode ? fixedPageIndex === 0 : false}
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-8 w-8 md:h-12 md:w-12 stroke-[1.5px]" />
              </button>
              <button
                onClick={fixedMode ? handleFixedNext : goNext}
                className="absolute right-0 md:-right-12 top-[150px] -translate-y-1/2 z-10 p-1 md:p-2 text-black hover:text-black/70 transition-colors disabled:opacity-30"
                disabled={fixedMode ? fixedPageIndex === totalFixedPages - 1 : false}
                aria-label="Next slide"
              >
                <ChevronRight className="h-8 w-8 md:h-12 md:w-12 stroke-[1.5px]" />
              </button>
            </>
          )}

          {fixedMode && isMobile ? (
            <div className="flex flex-col gap-6">
              {offers.map((offer) => (
                <div key={offer.id} className="flex h-full">
                  <a href={offer.link || '#'} className="flex flex-col w-full group">
                    {offer.image_url && (
                      <div 
                          className={`overflow-hidden bg-white rounded-xl mx-auto w-full ${offer.show_border ? 'border' : ''}`}
                          style={{ 
                            maxWidth: isHomePage ? '265px' : undefined, 
                            height: isHomePage ? '318px' : '300px',
                            borderColor: offer.show_border && offer.border_color ? offer.border_color : undefined 
                          }}
                        >
                          <img
                            src={offer.image_url}
                            alt={offer.heading || 'Offer'}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                    )}
                    {(offer.heading || offer.description) && (
                      <div className="pt-3 px-1">
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
          ) : needsCarousel ? (
            <div className="relative">
            <div 
              className="overflow-hidden rounded-lg"
              ref={containerRef}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div
                className="flex gap-6"
                onTransitionEnd={handleTransitionEnd}
                style={{
                  transform: `translateX(calc(-${index * slideWidth}% + ${dragOffset}%))`,
                  transition: animate ? 'transform 650ms ease' : 'none',
                }}
              >
                {displayOffers.map((offer, displayIndex) => (
                  <div
                    key={`${offer.id}-${displayIndex}`}
                    className="flex-none"
                    style={{ width: `calc(${slideWidth}% - 1.5rem)` }}
                  >
                    <a href={offer.link || '#'} className="flex flex-col group">
                      {offer.image_url && (
                        <div 
                          className={`overflow-hidden bg-white rounded-xl w-full ${offer.show_border ? 'border' : ''}`}
                          style={{ 
                            maxWidth: isHomePage ? '265px' : undefined, 
                            height: isHomePage ? '318px' : '300px',
                            borderColor: offer.show_border && offer.border_color ? offer.border_color : undefined 
                          }}
                        >
                          <img
                            src={offer.image_url}
                            alt={offer.heading || 'Offer'}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      )}
                      {(offer.heading || offer.description) && (
                        <div className="pt-3 px-1">
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
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${fixedPageIndex * 100}%)` }}
            >
              {fixedPages.map((page, pageIdx) => (
                <div key={pageIdx} className="w-full flex-none grid grid-cols-1 gap-6 md:grid-cols-4">
                  {page.map((offer) => (
                    <div key={offer.id} className="flex h-full">
                      <a href={offer.link || '#'} className="flex flex-col w-full group">
                        {offer.image_url && (
                          <div 
                            className={`overflow-hidden bg-white rounded-xl mx-auto w-full ${offer.show_border ? 'border' : ''}`}
                            style={{ 
                              maxWidth: isHomePage ? '265px' : undefined, 
                              height: isHomePage ? '318px' : '300px',
                              borderColor: offer.show_border && offer.border_color ? offer.border_color : undefined 
                            }}
                          >
                            <img
                              src={offer.image_url}
                              alt={offer.heading || 'Offer'}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                        )}
                        {(offer.heading || offer.description) && (
                          <div className="pt-3 px-1">
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
      </div>
    </div>
    </SubcategorySectionShell>
  );
}
