import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import SubcategorySectionShell from './SubcategorySectionShell';

interface Ad {
  id: string;
  image_url: string | null;
  link: string | null;
  sort_order: number;
  is_fixed: boolean;
  show_border: boolean;
  border_color: string | null;
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
  mobileContainImage = false,
  compact = false,
  backgroundColor,
  headingClassName,
}: Ads1ColSectionProps) {
  const db = supabase as any;
  const [ads, setAds] = useState<Ad[]>([]);
  const [heading, setHeading] = useState('Featured Ad');
  const [showHeading, setShowHeading] = useState(true);

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
              (data as any[]).map((ad) => ({
                ...ad,
                is_fixed: ad.is_fixed ?? false,
                show_border: ad.show_border ?? false,
                border_color: ad.border_color ?? null,
              }))
            );
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
        setHeading(data.heading || 'Featured Ad');
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
    <SubcategorySectionShell compact={compact} backgroundColor={backgroundColor}>
    <div className={compact ? '' : 'py-4 md:py-6'}>
      <div className={compact ? '' : 'mx-auto max-w-[1580px] px-6 md:px-12'}>
        {showHeading && (
          <h2 className={headingClassName || "section-heading"}>
            {heading}
          </h2>
        )}

        <div className="space-y-4">
          {ads.map((ad) => (
            <div 
              key={ad.id}
              className={`rounded-[12px] overflow-hidden bg-muted shadow-sm ${ad.show_border ? 'border' : ''}`} 
              style={ad.show_border && ad.border_color ? { borderColor: ad.border_color } : {}}
            >
              <a
                href={ad.link || '#'}
                className="block overflow-hidden rounded-[12px] transition-transform duration-300 hover:scale-[1.01]"
              >
                {/* ✅ Banner size */}
                <div className="h-[110px] md:h-[130px] lg:h-[400px] w-full bg-[#f5f5f5] flex items-center justify-center">
                  {ad.image_url && (
                    <img
                      src={ad.image_url}
                      alt="Ad"
                      className={`h-full w-full ${mobileContainImage ? 'object-contain md:object-cover' : 'object-cover'}`}
                    />
                  )}
                </div>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
    </SubcategorySectionShell>
  );
}
