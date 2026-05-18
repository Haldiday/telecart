import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useInfiniteStepCarousel } from '@/hooks/useInfiniteStepCarousel';
import SubcategorySectionShell from './SubcategorySectionShell';

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

export default function Ads3ColSection({
  sectionId,
  sectionTable = 'page_sections',
  adsTable = 'ads_3col',
  mobileContainImage = false,
  compact = false,
  backgroundColor,
  headingClassName,
}: Ads3ColSectionProps) {
  const db = supabase as any;
  const [ads, setAds] = useState<Ad[]>([]);
  const [heading, setHeading] = useState('3 Column Ads');
  const [showHeading, setShowHeading] = useState(true);
  const isMobile = useIsMobile();
  const fixedMode = ads.some((ad) => ad.is_fixed);
  const adsToDisplay = fixedMode ? ads.slice(0, 3) : ads;
  
  // Dynamic layout based on number of ads
  let visibleCount: number;
  if (adsToDisplay.length < 3) {
    // Use 2-column layout for 1-2 ads
    visibleCount = isMobile ? 1 : 2;
  } else {
    // Use 3-column layout for 3+ ads
    visibleCount = isMobile ? 1 : 3;
  }
  
  const needsCarousel = !fixedMode && adsToDisplay.length > visibleCount;
  const {
    index,
    animate,
    goNext,
    handleTransitionEnd,
    slideWidth,
    duplicatedCount,
  } = useInfiniteStepCarousel(ads.length, visibleCount, needsCarousel);

  useEffect(() => {
    let mounted = true;
    
    const loadAds = () => {
      db.from(adsTable).select('*').eq('section_id', sectionId).order('sort_order').then(({ data }: { data: Ad[] | null }) => {
        if (data && mounted) setAds((data as any[]).map((ad) => ({ ...ad, is_fixed: ad.is_fixed ?? false, show_border: ad.show_border ?? false, border_color: ad.border_color ?? null })));
      });
    };

    const loadSection = async () => {
      const { data } = await db
        .from(sectionTable)
        .select('heading, show_heading')
        .eq('id', sectionId)
        .single();
      
      if (data && mounted) {
        setHeading(data.heading || '3 Column Ads');
        setShowHeading(data.show_heading !== false);
      }
    };

    loadAds();
    loadSection();

    const adsChannel = supabase
      .channel(`ads_3col_${sectionId}_live`)
      .on('postgres_changes', { event: '*', schema: 'public', table: adsTable }, loadAds)
      .subscribe();

    const sectionsChannel = supabase
      .channel(`page_sections_3col_${sectionId}_live`)
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
    <SubcategorySectionShell compact={compact} backgroundColor={backgroundColor}>
    <div className={compact ? '' : 'py-6 md:py-10'}>
      <div className={compact ? '' : 'mx-auto max-w-[1580px] px-6 md:px-12'}>
        {showHeading && (
          <h2 className={headingClassName || "section-heading"}>
            {heading}
          </h2>
        )}
        {needsCarousel ? (
          <div className="relative">
            
            <div className="overflow-hidden">
              <div
                className="flex"
                onTransitionEnd={handleTransitionEnd}
                style={{
                  transform: `translateX(-${index * slideWidth}%)`,
                  transition: animate ? 'transform 650ms ease' : 'none',
                }}
              >
                {displayAds.map((ad, displayIndex) => (
                  <div
                    key={`${ad.id}-${displayIndex}`}
                    className="flex-none px-1.5"
                    style={{ width: `${slideWidth}%` }}
                  >
                    <a
                      href={ad.link || '#'}
                      className={`block group rounded-[28px] overflow-hidden ${ad.show_border ? 'border' : ''}`}
                      style={ad.show_border && ad.border_color ? { borderColor: ad.border_color } : {}}
                    >
                      <div
                        className={`overflow-hidden bg-muted ${
                          ads.length < 3
                            ? 'h-[160px] md:h-[300px]'
                            : 'h-[160px] md:h-auto md:aspect-[16/9]'
                        }`}
                      >
                        {ad.image_url && <img src={ad.image_url} alt={ad.heading || 'Ad'} className={`h-full w-full transition-transform duration-300 group-hover:scale-105 object-cover`} />}
                      </div>
                      {(ad.heading || ad.description) && (
                        <div className="p-3">
                          {ad.heading && <h3 className="text-xl font-semibold leading-tight text-foreground">{ad.heading}</h3>}
                          {ad.description && <p className="mt-2 text-base leading-relaxed text-muted-foreground">{ad.description}</p>}
                        </div>
                      )}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            {adsToDisplay.map((ad) => (
              <div key={ad.id} className="flex-1">
                <a
                  href={ad.link || '#'}
                  className={`block group rounded-[28px] overflow-hidden ${ad.show_border ? 'border' : ''}`}
                  style={ad.show_border && ad.border_color ? { borderColor: ad.border_color } : {}}
                >
                  <div
                    className={`overflow-hidden bg-muted ${
                      adsToDisplay.length < 3
                        ? 'h-[160px] md:h-[300px]'
                        : 'h-[160px] md:h-auto md:aspect-[16/9]'
                    }`}
                  >
                    {ad.image_url && <img src={ad.image_url} alt={ad.heading || 'Ad'} className={`h-full w-full transition-transform duration-300 group-hover:scale-105 object-cover`} />}
                  </div>
                  {(ad.heading || ad.description) && (
                    <div className="p-3">
                      {ad.heading && <h3 className="text-xl font-semibold leading-tight text-foreground">{ad.heading}</h3>}
                      {ad.description && <p className="mt-2 text-base leading-relaxed text-muted-foreground">{ad.description}</p>}
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
