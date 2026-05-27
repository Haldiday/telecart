import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInfiniteStepCarousel } from '@/hooks/useInfiniteStepCarousel';
import SubcategorySectionShell from './SubcategorySectionShell';
import { useMSG91Auth } from '@/contexts/MSG91AuthContext';

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
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isLoggedIn, checkAuthAndNavigate } = useMSG91Auth();
  const visibleCount = isMobile ? 1 : 3;
  const fixedMode = cards.some((card) => card.is_fixed);
  const cardsToDisplay = fixedMode ? cards.filter(card => card.is_fixed) : cards;
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

  const needsCarousel = !fixedMode && cards.length > visibleCount;
  const showFixedControls = fixedMode && cardsToDisplay.length > visibleCount;

  const {
    index,
    animate,
    goNext,
    handleTransitionEnd,
    slideWidth,
    duplicatedCount,
  } = useInfiniteStepCarousel(cards.length, visibleCount, needsCarousel);

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
            setCards((data as any[]).map((card) => ({
              ...card,
              link: card.link ?? null,
              is_fixed: card.is_fixed ?? false,
              show_border: card.show_border ?? false,
              border_color: card.border_color ?? null,
            })));
          }
        });
    };

    const loadSection = async () => {
      const { data } = await db
        .from(sectionTable)
        .select('heading, show_heading')
        .eq('id', sectionId)
        .single();
      
      if (data && mounted) {
        setHeading(data.heading || 'Featured Companies');
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
    () => !fixedMode && needsCarousel ? [...cardsToDisplay, ...cardsToDisplay.slice(0, duplicatedCount)] : cardsToDisplay,
    [cardsToDisplay, duplicatedCount, fixedMode, needsCarousel]
  );

  if (cards.length === 0) return null;

  return (
    <SubcategorySectionShell compact={compact} backgroundColor={backgroundColor}>
    <div className={compact ? '' : 'py-6 md:py-8'}>
      <div className={compact ? '' : 'mx-auto max-w-[1580px] px-6 md:px-12'}>
        {showHeading && (
          <h2 className={headingClassName || `section-heading ${compact ? 'mt-0' : ''}`}>
            {heading}
          </h2>
        )}
        <div className="relative group/fixed">
          {showFixedControls && !isMobile && (
            <>
              <button
                onClick={handleFixedPrev}
                className="absolute -left-8 md:-left-12 top-[120px] -translate-y-1/2 z-10 p-1 md:p-2 text-black hover:text-black/70 transition-colors disabled:opacity-30"
                disabled={fixedPageIndex === 0}
                aria-label="Previous slide"
              >
                <ChevronLeft className="h-8 w-8 md:h-12 md:w-12 stroke-[1.5px]" />
              </button>
              <button
                onClick={handleFixedNext}
                className="absolute -right-8 md:-right-12 top-[120px] -translate-y-1/2 z-10 p-1 md:p-2 text-black hover:text-black/70 transition-colors disabled:opacity-30"
                disabled={fixedPageIndex === totalFixedPages - 1}
                aria-label="Next slide"
              >
                <ChevronRight className="h-8 w-8 md:h-12 md:w-12 stroke-[1.5px]" />
              </button>
            </>
          )}

          {fixedMode && isMobile ? (
            <div className="flex flex-col gap-6">
              {cardsToDisplay.map((card) => {
                const handleCardClick = () => {
                  if (card.link) {
                    if (isLoggedIn) {
                      window.open(card.link, '_blank', 'noopener,noreferrer');
                    } else {
                      checkAuthAndNavigate(card.link);
                    }
                  }
                };
                return (
                  <div key={card.id}>
                    <div
                      onClick={handleCardClick}
                      className={`h-[240px] rounded-[28px] bg-[#fcf9f5] pt-8 pl-8 pr-6 pb-6 transition-all duration-300 flex flex-col group cursor-pointer overflow-hidden ${card.show_border ? 'border' : ''} ${card.link ? 'hover:shadow-[0_20px_50px_rgba(15,23,42,0.25)]' : ''}`}
                      style={card.show_border && card.border_color ? { borderColor: card.border_color } : {}}
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
                      <p className="text-base leading-relaxed text-muted-foreground line-clamp-2">
                        {card.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (fixedMode && cardsToDisplay.length > visibleCount) ? (
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${fixedPageIndex * 100}%)` }}
              >
                {fixedPages.map((page, pageIdx) => (
                  <div key={pageIdx} className="w-full flex-none grid grid-cols-1 gap-6 md:grid-cols-3">
                    {page.map((card) => {
                      const handleCardClick = () => {
                        if (card.link) {
                          if (isLoggedIn) {
                            window.open(card.link, '_blank', 'noopener,noreferrer');
                          } else {
                            checkAuthAndNavigate(card.link);
                          }
                        }
                      };
                      return (
                        <div key={card.id}>
                          <div
                            onClick={handleCardClick}
                            className={`h-[240px] rounded-[28px] bg-[#fcf9f5] pt-8 pl-8 pr-6 pb-6 transition-all duration-300 flex flex-col group cursor-pointer overflow-hidden ${card.show_border ? 'border' : ''} ${card.link ? 'hover:shadow-[0_20px_50px_rgba(15,23,42,0.25)]' : ''}`}
                            style={card.show_border && card.border_color ? { borderColor: card.border_color } : {}}
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
                            <p className="text-base leading-relaxed text-muted-foreground line-clamp-2">
                              {card.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {/* Fill empty spaces in fixed mode if current page has less than visibleCount items */}
                    {Array.from({ length: visibleCount - page.length }).map((_, i) => (
                      <div key={`empty-${i}`} className="hidden md:flex h-full" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : needsCarousel ? (
            <div className="relative">
              <div className="overflow-hidden py-6">
                <div
                  className="flex"
                  onTransitionEnd={handleTransitionEnd}
                  style={{
                    transform: `translateX(-${index * slideWidth}%)`,
                    transition: animate ? 'transform 650ms ease' : 'none',
                  }}
                >
                  {displayCards.map((card, displayIndex) => {
                    const handleCardClick = () => {
                      if (card.link) {
                        if (isLoggedIn) {
                          window.open(card.link, '_blank', 'noopener,noreferrer');
                        } else {
                          checkAuthAndNavigate(card.link);
                        }
                      }
                    };
                    return (
                      <div
                        key={`${card.id}-${displayIndex}`}
                        className="flex-none px-2.5"
                        style={{ width: `${slideWidth}%` }}
                      >
                        <div
                          onClick={handleCardClick}
                          className={`h-[240px] rounded-[28px] bg-[#fcf9f5] pt-8 pl-8 pr-6 pb-6 transition-all duration-300 flex flex-col group cursor-pointer overflow-hidden ${card.show_border ? 'border' : ''} ${card.link ? 'hover:shadow-[0_20px_50px_rgba(15,23,42,0.25)]' : ''}`}
                          style={card.show_border && card.border_color ? { borderColor: card.border_color } : {}}
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
                          <h3 className="mb-2 text-lg md:text-2xl font-semibold leading-tight flex items-center gap-2 line-clamp-1">
                            {card.title}
                            {card.link && <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />}
                          </h3>
                          <p className="text-sm md:text-base leading-relaxed text-muted-foreground line-clamp-2">
                            {card.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className={`flex ${cardsToDisplay.length < 3 ? 'justify-center' : ''}`}>
              {cardsToDisplay.map((card, index) => {
                const handleCardClick = () => {
                  if (card.link) {
                    /*
                    if (isLoggedIn) {
                      window.open(card.link, '_blank', 'noopener,noreferrer');
                    } else {
                      checkAuthAndNavigate(card.link);
                    }
                    */
                    window.open(card.link, '_blank', 'noopener,noreferrer');
                  }
                };
                return (
                  <div key={card.id} className={`${cardsToDisplay.length < 3 ? 'w-full md:w-[calc(33.333%-10px)]' : 'flex-1'} px-2.5`}>
                    <div
                      onClick={handleCardClick}
                      className={`h-[240px] rounded-[28px] bg-[#fcf9f5] pt-8 pl-8 pr-6 pb-6 transition-all duration-300 flex flex-col group cursor-pointer overflow-hidden ${card.show_border ? 'border' : ''} ${card.link ? 'hover:shadow-[0_20px_50px_rgba(15,23,42,0.25)]' : ''}`}
                      style={card.show_border && card.border_color ? { borderColor: card.border_color } : {}}
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
                      <p className="text-base leading-relaxed text-muted-foreground line-clamp-2">
                        {card.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {needsCarousel && !(hideSeeAllOnMobile && isMobile) && (
          <div className="mt-6 flex justify-center">
            
          </div>
        )}
      </div>
    </div>
    </SubcategorySectionShell>
  );
}
