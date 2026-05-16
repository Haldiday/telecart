import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInfiniteStepCarousel } from '@/hooks/useInfiniteStepCarousel';
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
  const visibleCount = isMobile ? 1 : 4;
  const fixedMode = offers.some((offer) => offer.is_fixed);
  const offersToDisplay = fixedMode ? offers.slice(0, 4) : offers;
  const needsCarousel = !fixedMode && offers.length > visibleCount;

  const {
    index,
    animate,
    goNext,
    handleTransitionEnd,
    slideWidth,
    duplicatedCount,
  } = useInfiniteStepCarousel(offers.length, visibleCount, needsCarousel);

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
    () => !fixedMode && needsCarousel ? [...offers, ...offers.slice(0, duplicatedCount)] : offersToDisplay,
    [offers, duplicatedCount, fixedMode, needsCarousel, offersToDisplay],
  );

  if (offers.length === 0) return null;

  return (
    <SubcategorySectionShell compact={compact} backgroundColor={backgroundColor}>
    <div className={compact ? '' : 'py-4 md:py-6'}>
      <div className={compact ? '' : 'container mx-auto px-4 md:px-8 lg:px-12'}>
        <div className={`mb-6 flex items-center justify-between ${compact ? 'mb-4' : ''}`}>
          {showHeading && (
            <h2 className={headingClassName || "text-2xl md:text-3xl font-semibold"}>
              {heading}
            </h2>
          )}

          {needsCarousel && (
            <div className="hidden gap-2 md:flex">
              
            </div>
          )}
        </div>

        {needsCarousel ? (
          <div className="relative">
            <div className="overflow-hidden rounded-lg">
              <div
                className="flex gap-6"
                onTransitionEnd={handleTransitionEnd}
                style={{
                  transform: `translateX(-${index * slideWidth}%)`,
                  transition: animate ? 'transform 650ms ease' : 'none',
                }}
              >
                {displayOffers.map((offer, displayIndex) => (
                  <div
                    key={`${offer.id}-${displayIndex}`}
                    className="flex-none"
                    style={{ width: `calc(${slideWidth}% - 1.5rem)` }}
                  >
                    <a href={offer.link || '#'} className={`flex flex-col group rounded-xl overflow-hidden ${offer.show_border ? 'border' : ''}`} style={offer.show_border && offer.border_color ? { borderColor: offer.border_color } : {}}>
                      {offer.image_url && (
                        <div className="h-[300px] overflow-hidden bg-white">
                          <img
                            src={offer.image_url}
                            alt={offer.heading || 'Offer'}
                            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      )}
                      {(offer.heading || offer.description) && (
                        <div className="p-3">
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            {offersToDisplay.map((offer) => (
              <div key={offer.id} className="flex h-full">
                <a href={offer.link || '#'} className={`flex flex-col w-full group rounded-xl overflow-hidden ${offer.show_border ? 'border' : ''}`} style={offer.show_border && offer.border_color ? { borderColor: offer.border_color } : {}}>
                  {offer.image_url && (
                    <div className="h-[300px] overflow-hidden bg-white">
                      <img
                        src={offer.image_url}
                        alt={offer.heading || 'Offer'}
                        className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  )}
                  {(offer.heading || offer.description) && (
                    <div className="p-3">
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
        )}
      </div>
    </div>
    </SubcategorySectionShell>
  );
}
