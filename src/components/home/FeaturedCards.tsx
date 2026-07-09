import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInfiniteStepCarousel } from '@/hooks/useInfiniteStepCarousel';
import { useFixedCarouselTouch } from '@/hooks/useFixedCarouselTouch';
import SubcategorySectionShell from './SubcategorySectionShell';

interface Card {
  id: string;
  title: string;
  description: string;
  logo_url: string | null;
  sort_order: number;
  link: string | null;
  section_id: string;
  is_fixed: boolean;
  show_border: boolean;
  border_color: string | null;
  background_color: string | null;
}

interface FeaturedCardsProps {
  sectionId: string;
  sectionTable?: string;
  cardsTable?: string;
  hideSeeAllOnMobile?: boolean;
  compact?: boolean;
  backgroundColor?: string | null;
  headingClassName?: string;
}

export default function FeaturedCards({
  sectionId,
  sectionTable = 'page_sections',
  cardsTable = 'featured_cards',
  hideSeeAllOnMobile = false,
  compact = false,
  backgroundColor,
  headingClassName,
}: FeaturedCardsProps) {
  const db = supabase as any;
  const [cards, setCards] = useState<Card[]>([]);
  const [heading, setHeading] = useState('Featured Companies');
  const [showHeading, setShowHeading] = useState(true);
  const isMobile = useIsMobile();
  const [isTablet, setIsTablet] = useState(false);
  const location = useLocation();
  const isSeeAllPage = location.pathname.startsWith("/see-all/featured-cards");

  useEffect(() => {
    const checkTablet = () => {
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    checkTablet();
    window.addEventListener('resize', checkTablet);
    return () => window.removeEventListener('resize', checkTablet);
  }, []);

  const visibleCount = isMobile ? 1 : isTablet ? 2 : 3;
  const cardsToDisplay = useMemo(() => {
    const fixedCards = cards.filter(card => card.is_fixed);
    return fixedCards.length > 0 ? fixedCards : cards;
  }, [cards]);
  const fixedMode = cards.some((card) => card.is_fixed);
  const [fixedPageIndex, setFixedPageIndex] = useState(0);
  const totalFixedPages = Math.ceil(cardsToDisplay.length / visibleCount);

  // Group cards into pages for fixed mode sliding
  const fixedPages = useMemo(() => {
    if (!fixedMode) return [];
    const pages = [];
    for (let i = 0; i < cardsToDisplay.length; i += visibleCount) {
      pages.push(cardsToDisplay.slice(i, i + visibleCount));
    }
    return pages;
  }, [fixedMode, cardsToDisplay, visibleCount]);

  const handleFixedPrev = () => {
    setFixedPageIndex((prev) => (prev > 0 ? prev - 1 : totalFixedPages - 1));
  };

  const handleFixedNext = () => {
    setFixedPageIndex((prev) => (prev < totalFixedPages - 1 ? prev + 1 : 0));
  };

  const needsCarousel = !fixedMode && cardsToDisplay.length > visibleCount;
  const showFixedControls = fixedMode && cardsToDisplay.length > visibleCount;

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
  } = useInfiniteStepCarousel(cardsToDisplay.length, visibleCount, needsCarousel);

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
    
    const loadCards = () => {
      db
      .from(cardsTable)
      .select('*')
      .eq('section_id', sectionId)
      .order('sort_order')
      .then(({ data }) => {
        if (data && mounted) {
          setCards((data as any[])
            .filter(card => card.is_visible !== false)
            .map((card) => ({
              ...card,
              link: card.link ?? null,
              is_fixed: card.is_fixed ?? false,
              show_border: card.show_border ?? false,
              border_color: card.border_color ?? null,
              background_color: card.background_color ?? null,
              is_visible: card.is_visible ?? true,
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
        setHeading(data.heading || data.name || 'Featured Companies');
        setShowHeading(data.show_heading !== false);
      }
    };

    loadCards();
    loadSection();

    const cardsChannel = supabase
      .channel(`featured_cards_${sectionId}_live`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: cardsTable },
        loadCards
      )
      .subscribe();

    const sectionsChannel = supabase
      .channel(`page_sections_${sectionId}_live`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: sectionTable },
        loadSection
      )
      .subscribe();

    return () => {
      mounted = false;
      cardsChannel.unsubscribe();
      sectionsChannel.unsubscribe();
    };
  }, [cardsTable, db, sectionId, sectionTable]);

  const displayCards = useMemo(
    () => needsCarousel ? [...cardsToDisplay, ...cardsToDisplay.slice(0, duplicatedCount)] : cardsToDisplay,
    [cardsToDisplay, duplicatedCount, needsCarousel]
  );

  // Render logic for See All page
  const renderSeeAllPage = () => {
    if (cardsToDisplay.length === 0) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          No cards to display
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
                onClick={showFixedControls ? handleFixedPrev : goPrev}
                className="absolute left-0 md:-left-12 top-1/2 -translate-y-1/2 z-10 p-1 md:p-2 text-black hover:text-black/70 transition-colors disabled:opacity-30"
                disabled={showFixedControls ? fixedPageIndex === 0 : false}
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-8 w-8 md:h-12 md:w-12 stroke-[1.5px]" />
              </button>
              <button
                onClick={showFixedControls ? handleFixedNext : goNext}
                className="absolute right-0 md:-right-12 top-1/2 -translate-y-1/2 z-10 p-1 md:p-2 text-black hover:text-black/70 transition-colors disabled:opacity-30"
                disabled={showFixedControls ? fixedPageIndex === totalFixedPages - 1 : false}
                aria-label="Next slide"
              >
                <ChevronRight className="h-8 w-8 md:h-12 md:w-12 stroke-[1.5px]" />
              </button>
            </>
          )}

          {(fixedMode && cardsToDisplay.length > visibleCount) ? (
            <div className="overflow-hidden overflow-x-hidden touch-pan-y" style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }} ref={fixedContainerRef} onTouchStart={onFixedTouchStart} onTouchMove={onFixedTouchMove} onTouchEnd={onFixedTouchEnd}>
              <div 
                className="flex"
                style={{ transform: getTransformStyle(), transition: getTransitionStyle() }}
              >
                {fixedPages.map((page, pageIdx) => (
                  <div key={pageIdx} className="w-full flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {page.map((card) => (
                      <div key={card.id}>
                        <div
                          onClick={() => {
                            if (card.link) {
                              window.open(card.link, '_blank', 'noopener,noreferrer');
                            }
                          }}
                          className={`h-[240px] rounded-[28px] pt-8 pl-8 pr-6 pb-6 transition-all duration-300 flex flex-col group cursor-pointer overflow-hidden ${card.show_border ? 'border' : ''} ${card.link ? 'hover:shadow-[0_20px_50px_rgba(15,23,42,0.25)]' : ''}`}
                          style={{ 
                            backgroundColor: card.background_color || '#fcf9f5',
                            borderColor: card.show_border && card.border_color ? card.border_color : undefined 
                          }}
                        >
                          {card.logo_url && (
                            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl flex-shrink-0 bg-white">
                              <img
                                src={card.logo_url}
                                alt={card.title}
                                className="h-full w-full object-contain"
                              />
                            </div>
                          )}
                          <h3 className="mb-2 text-xl font-semibold leading-tight flex items-center gap-2 line-clamp-1">
                            {card.title}
                            {card.link && <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />}
                          </h3>
                          <div className="text-base leading-relaxed text-black line-clamp-2" dangerouslySetInnerHTML={{ __html: card.description }} />
                        </div>
                      </div>
                    ))}
                    {/* Fill empty spaces in fixed mode if current page has less than visibleCount items */}
                    {Array.from({ length: visibleCount - page.length }).map((_, i) => (
                      <div key={`empty-${i}`} className="hidden md:flex lg:flex h-full" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : needsCarousel ? (
            <div className="relative" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
              <div 
                className="overflow-hidden overflow-x-hidden touch-pan-y py-6"
                style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
                ref={containerRef}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                <div className="flex" onTransitionEnd={handleTransitionEnd} style={{
                    transform: `translateX(calc(-${index * slideWidth}% + ${dragOffset}%))`,
                    transition: animate ? 'transform 650ms ease' : 'none',
                  }}>
                  {displayCards.map((card, displayIndex) => (
                    <div
                      key={`${card.id}-${displayIndex}`}
                      className="flex-none px-2.5"
                      style={{ width: `${slideWidth}%` }}
                    >
                      <div
                        onClick={() => {
                          if (card.link) {
                            window.open(card.link, '_blank', 'noopener,noreferrer');
                          }
                        }}
                        className={`h-[240px] rounded-[28px] pt-8 pl-8 pr-6 pb-6 transition-all duration-300 flex flex-col group cursor-pointer overflow-hidden ${card.show_border ? 'border' : ''} ${card.link ? 'hover:shadow-[0_20px_50px_rgba(15,23,42,0.25)]' : ''}`}
                        style={{ 
                          backgroundColor: card.background_color || '#fcf9f5',
                          borderColor: card.show_border && card.border_color ? card.border_color : undefined 
                        }}
                      >
                        {card.logo_url && (
                          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl flex-shrink-0 bg-white">
                            <img
                              src={card.logo_url}
                              alt={card.title}
                              className="h-full w-full object-contain"
                            />
                          </div>
                        )}
                        <h3 className="mb-2 text-xl md:text-2xl font-semibold leading-tight flex items-center gap-2 line-clamp-1">
                          {card.title}
                          {card.link && <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />}
                        </h3>
                        <div className="text-base leading-relaxed text-black line-clamp-2" dangerouslySetInnerHTML={{ __html: card.description }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className={`flex ${cardsToDisplay.length < 3 ? 'justify-center' : ''}`}>
              {cardsToDisplay.map((card) => (
                <div key={card.id} className={`${cardsToDisplay.length < 3 ? 'w-full md:w-[calc(50%-10px)] lg:w-[calc(33.333%-10px)]' : 'flex-1'} px-2.5`}>
                  <div
                    onClick={() => {
                      if (card.link) {
                        window.open(card.link, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    className={`h-[240px] rounded-[28px] pt-8 pl-8 pr-6 pb-6 transition-all duration-300 flex flex-col group cursor-pointer overflow-hidden ${card.show_border ? 'border' : ''} ${card.link ? 'hover:shadow-[0_20px_50px_rgba(15,23,42,0.25)]' : ''}`}
                    style={{ 
                      backgroundColor: card.background_color || '#fcf9f5',
                      borderColor: card.show_border && card.border_color ? card.border_color : undefined 
                    }}
                  >
                    {card.logo_url && (
                      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl flex-shrink-0 bg-white">
                        <img
                          src={card.logo_url}
                          alt={card.title}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    )}
                    <h3 className="mb-2 text-xl font-semibold leading-tight flex items-center gap-2 line-clamp-1">
                      {card.title}
                      {card.link && <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />}
                    </h3>
                    <div className="text-base leading-relaxed text-black line-clamp-2" dangerouslySetInnerHTML={{ __html: card.description }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Desktop/Tablet: Show all cards in grid, no carousel (exact same as home page)
    return (
      <div className={`flex flex-wrap ${cardsToDisplay.length < 3 ? 'justify-center' : ''}`}>
        {cardsToDisplay.map((card) => (
          <div key={card.id} className={`${cardsToDisplay.length < 3 ? 'w-full md:w-[calc(50%-10px)] lg:w-[calc(33.333%-10px)]' : 'w-full md:w-[calc(33.333%-10px)]'} px-2.5 mb-6`}>
            <div
              onClick={() => {
                if (card.link) {
                  window.open(card.link, '_blank', 'noopener,noreferrer');
                }
              }}
              className={`h-[240px] rounded-[28px] pt-8 pl-8 pr-6 pb-6 transition-all duration-300 flex flex-col group cursor-pointer overflow-hidden ${card.show_border ? 'border' : ''} ${card.link ? 'hover:shadow-[0_20px_50px_rgba(15,23,42,0.25)]' : ''}`}
              style={{ 
                backgroundColor: card.background_color || '#fcf9f5',
                borderColor: card.show_border && card.border_color ? card.border_color : undefined 
              }}
            >
              {card.logo_url && (
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl flex-shrink-0 bg-white">
                  <img
                    src={card.logo_url}
                    alt={card.title}
                    className="h-full w-full object-contain"
                  />
                </div>
              )}
              <h3 className="mb-2 text-xl font-semibold leading-tight flex items-center gap-2 line-clamp-1">
                {card.title}
                {card.link && <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />}
              </h3>
              <div className="text-base leading-relaxed text-black line-clamp-2" dangerouslySetInnerHTML={{ __html: card.description }} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render logic for Home page
  const renderHomePage = () => {
    if (cards.length === 0) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          No cards to display
        </div>
      );
    }

    return (
      <div className="relative group/fixed">
        {!isMobile && (showFixedControls || needsCarousel) && (
          <>
            <button
              onClick={showFixedControls ? handleFixedPrev : goPrev}
              className="absolute left-0 md:-left-12 top-1/2 -translate-y-1/2 z-10 p-1 md:p-2 text-black hover:text-black/70 transition-colors disabled:opacity-30"
              disabled={showFixedControls ? fixedPageIndex === 0 : false}
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-8 w-8 md:h-12 md:w-12 stroke-[1.5px]" />
            </button>
            <button
              onClick={showFixedControls ? handleFixedNext : goNext}
              className="absolute right-0 md:-right-12 top-1/2 -translate-y-1/2 z-10 p-1 md:p-2 text-black hover:text-black/70 transition-colors disabled:opacity-30"
              disabled={showFixedControls ? fixedPageIndex === totalFixedPages - 1 : false}
              aria-label="Next slide"
            >
              <ChevronRight className="h-8 w-8 md:h-12 md:w-12 stroke-[1.5px]" />
            </button>
          </>
        )}

        {(fixedMode && cardsToDisplay.length > visibleCount) ? (
          <div className="overflow-hidden overflow-x-hidden touch-pan-y" style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }} ref={fixedContainerRef} onTouchStart={onFixedTouchStart} onTouchMove={onFixedTouchMove} onTouchEnd={onFixedTouchEnd}>
            <div 
              className="flex"
              style={{ transform: getTransformStyle(), transition: getTransitionStyle() }}
            >
              {fixedPages.map((page, pageIdx) => (
                <div key={pageIdx} className="w-full flex-none grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {page.map((card) => (
                    <div key={card.id}>
                      <div
                        onClick={() => {
                          if (card.link) {
                            window.open(card.link, '_blank', 'noopener,noreferrer');
                          }
                        }}
                        className={`h-[240px] rounded-[28px] pt-8 pl-8 pr-6 pb-6 transition-all duration-300 flex flex-col group cursor-pointer overflow-hidden ${card.show_border ? 'border' : ''} ${card.link ? 'hover:shadow-[0_20px_50px_rgba(15,23,42,0.25)]' : ''}`}
                        style={{ 
                          backgroundColor: card.background_color || '#fcf9f5',
                          borderColor: card.show_border && card.border_color ? card.border_color : undefined 
                        }}
                      >
                        {card.logo_url && (
                          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl flex-shrink-0 bg-white">
                            <img
                              src={card.logo_url}
                              alt={card.title}
                              className="h-full w-full object-contain"
                            />
                          </div>
                        )}
                        <h3 className="mb-2 text-xl font-semibold leading-tight flex items-center gap-2 line-clamp-1">
                          {card.title}
                          {card.link && <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />}
                        </h3>
                        <div className="text-base leading-relaxed text-black line-clamp-2" dangerouslySetInnerHTML={{ __html: card.description }} />
                      </div>
                    </div>
                  ))}
                  {/* Fill empty spaces in fixed mode if current page has less than visibleCount items */}
                  {Array.from({ length: visibleCount - page.length }).map((_, i) => (
                    <div key={`empty-${i}`} className="hidden md:flex lg:flex h-full" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : needsCarousel ? (
          <div className="relative" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            <div 
              className="overflow-hidden overflow-x-hidden touch-pan-y py-6"
              style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch' }}
              ref={containerRef}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div className="flex" onTransitionEnd={handleTransitionEnd} style={{
                  transform: `translateX(calc(-${index * slideWidth}% + ${dragOffset}%))`,
                  transition: animate ? 'transform 650ms ease' : 'none',
                }}>
                {displayCards.map((card, displayIndex) => (
                  <div
                    key={`${card.id}-${displayIndex}`}
                    className="flex-none px-2.5"
                    style={{ width: `${slideWidth}%` }}
                  >
                    <div
                      onClick={() => {
                        if (card.link) {
                          window.open(card.link, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      className={`h-[240px] rounded-[28px] pt-8 pl-8 pr-6 pb-6 transition-all duration-300 flex flex-col group cursor-pointer overflow-hidden ${card.show_border ? 'border' : ''} ${card.link ? 'hover:shadow-[0_20px_50px_rgba(15,23,42,0.25)]' : ''}`}
                      style={{ 
                        backgroundColor: card.background_color || '#fcf9f5',
                        borderColor: card.show_border && card.border_color ? card.border_color : undefined 
                      }}
                    >
                      {card.logo_url && (
                        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl flex-shrink-0 bg-white">
                          <img
                            src={card.logo_url}
                            alt={card.title}
                            className="h-full w-full object-contain"
                          />
                        </div>
                      )}
                      <h3 className="mb-2 text-xl md:text-2xl font-semibold leading-tight flex items-center gap-2 line-clamp-1">
                        {card.title}
                        {card.link && <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />}
                      </h3>
                      <div className="text-base leading-relaxed text-black line-clamp-2" dangerouslySetInnerHTML={{ __html: card.description }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className={`flex ${cardsToDisplay.length < 3 ? 'justify-center' : ''}`}>
            {cardsToDisplay.map((card) => (
              <div key={card.id} className={`${cardsToDisplay.length < 3 ? 'w-full md:w-[calc(50%-10px)] lg:w-[calc(33.333%-10px)]' : 'flex-1'} px-2.5`}>
                <div
                  onClick={() => {
                    if (card.link) {
                      window.open(card.link, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className={`h-[240px] rounded-[28px] pt-8 pl-8 pr-6 pb-6 transition-all duration-300 flex flex-col group cursor-pointer overflow-hidden ${card.show_border ? 'border' : ''} ${card.link ? 'hover:shadow-[0_20px_50px_rgba(15,23,42,0.25)]' : ''}`}
                  style={{ 
                    backgroundColor: card.background_color || '#fcf9f5',
                    borderColor: card.show_border && card.border_color ? card.border_color : undefined 
                  }}
                >
                  {card.logo_url && (
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl flex-shrink-0 bg-white">
                      <img
                        src={card.logo_url}
                        alt={card.title}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                  <h3 className="mb-2 text-xl font-semibold leading-tight flex items-center gap-2 line-clamp-1">
                    {card.title}
                    {card.link && <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />}
                  </h3>
                  <div className="text-base leading-relaxed text-black line-clamp-2" dangerouslySetInnerHTML={{ __html: card.description }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <SubcategorySectionShell compact={compact} backgroundColor={backgroundColor} hasHeading={showHeading}>
    <div className={compact ? '' : 'py-6 md:py-8'}>
      <div className={compact ? '' : 'mx-auto max-w-[1580px] px-6 md:px-12'}>
        {showHeading && (
          <div className="flex items-center justify-between">
            <h2 className={headingClassName || `section-heading ${compact ? 'mt-0' : ''}`}>
              {heading}
            </h2>
            {!isSeeAllPage && (
              <Link to={`/see-all/featured-cards/${sectionId}`} style={{ color: '#1d4ed8' }} className="text-base font-medium hover:underline px-3 py-1">
                See All
              </Link>
            )}
          </div>
        )}
        {isSeeAllPage ? renderSeeAllPage() : renderHomePage()}
        {needsCarousel && !(hideSeeAllOnMobile && isMobile) && !isSeeAllPage && (
          <div className="mt-6 flex justify-center">
            
          </div>
        )}
      </div>
    </div>
    </SubcategorySectionShell>
  );
}
