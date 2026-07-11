import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Minus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import BrandActionLinks from '@/components/shared/BrandActionLinks';

interface Brand {
  id: string;
  name: string;
  link: string | null;
  sort_order: number;
  action_link_1_text?: string | null;
  action_link_1_url?: string | null;
  action_link_1_new_tab?: boolean;
  action_link_1_enabled?: boolean;
  action_link_2_text?: string | null;
  action_link_2_url?: string | null;
  action_link_2_new_tab?: boolean;
  action_link_2_enabled?: boolean;
  action_link_3_text?: string | null;
  action_link_3_url?: string | null;
  action_link_3_new_tab?: boolean;
  action_link_3_enabled?: boolean;
}

interface Subcategory {
  id: string;
  name: string;
  link: string | null;
  custom_link?: string | null;
  custom_link_type?: 'link' | 'iframe' | null;
  sort_order: number;
  brands: Brand[];
}

interface Category {
  id: string;
  name: string;
  icon_url: string | null;
  bg_color: string;
  sort_order: number;
  subcategories: Subcategory[];
}

interface CategoriesSectionProps {
  sectionId: string;
  backgroundColor?: string | null;
}

export default function CategoriesSection({ sectionId, backgroundColor: propBackgroundColor }: CategoriesSectionProps) {
  const location = useLocation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [mobileExpanded, setMobileExpanded] = useState<Record<string, boolean>>({});
  const [subcategoryExpanded, setSubcategoryExpanded] = useState<Record<string, boolean>>({});
  const [expandedBrandId, setExpandedBrandId] = useState<string | null>(null);
  const [heading, setHeading] = useState('Explore companies by category');
  const [showHeading, setShowHeading] = useState(true);
  const [sectionBackgroundColor, setSectionBackgroundColor] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const accordionRef = useRef<HTMLDivElement | null>(null);

  // Reset all accordion states when location changes
  useEffect(() => {
    setExpanded({});
    setMobileExpanded({});
    setSubcategoryExpanded({});
    setExpandedBrandId(null);
  }, [location.pathname]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const targetNode = event.target as Node | null;
      if (!targetNode) return;
      if (!accordionRef.current) return;
      if (accordionRef.current.contains(targetNode)) return;
      setExpanded({});
      setMobileExpanded({});
      setSubcategoryExpanded({});
      setExpandedBrandId(null);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    
    async function load() {
      const { data: cats } = await supabase.from('categories').select('*').eq('section_id', sectionId).order('sort_order');
      if (!cats) return;
      const { data: subs } = await supabase.from('subcategories').select('*').order('sort_order');
      const { data: brands } = await supabase.from('subcategory_brands' as any).select('*').order('sort_order');
      
      const merged = cats
        .filter((cat: any) => cat.is_visible !== false)
        .map((category) => ({
          ...category,
          subcategories: (subs || [])
            .filter((sub: any) => sub.category_id === category.id && sub.is_visible !== false)
            .map((sub: any) => ({
              ...sub,
              brands: (brands || [])
                .filter((b: any) => b.subcategory_id === sub.id && b.is_visible !== false)
            })),
        }));
      if (mounted) setCategories(merged as unknown as Category[]);
    }

    async function loadSection() {
      const { data } = await supabase
        .from('page_sections')
        .select('heading, name, show_heading, background_color')
        .eq('id', sectionId)
        .single();
      
      if (data && mounted) {
        setHeading(data.heading || data.name || 'Explore companies by category');
        setShowHeading(data.show_heading !== false);
        setSectionBackgroundColor(data.background_color);
      }
    }

    load();
    loadSection();

    const channel = supabase
      .channel(`categories_live_${sectionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategory_brands' }, () => load())
      .subscribe();

    const sectionsChannel = supabase
      .channel(`page_sections_cat_${sectionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'page_sections', filter: `id=eq.${sectionId}` }, () => loadSection())
      .subscribe();

    return () => {
      mounted = false;
      channel.unsubscribe();
      sectionsChannel.unsubscribe();
    };
  }, [sectionId]);

  if (categories.length === 0) return null;

  const toggleSubcategory = (subcategoryId: string) => {
    setExpandedBrandId(null); // Reset brand expansion when changing subcategory
    setSubcategoryExpanded((prev) => (
      prev[subcategoryId] ? {} : { [subcategoryId]: true }
    ));
  };

  return (
    <section id={`section-${sectionId}`} className="py-2 md:py-3 bg-white md:bg-[#f9f8f5]" style={{ backgroundColor: propBackgroundColor || sectionBackgroundColor || undefined }}>
     

      <div ref={accordionRef} className="mx-auto max-w-[1580px] px-6 md:px-8 lg:px-12">
        {showHeading && (
          <h2 className="section-heading mt-1 md:mt-4 mb-4 md:mb-6">
            {heading}
          </h2>
        )}

        {/* Mobile: Collapsible View */}
        {isMobile ? (
          <div className="space-y-0">
            {categories.map((category) => {
              const isExpanded = mobileExpanded[category.id];

              return (
                <div
                  key={category.id}
                  className="relative"
                >
                  <div className="absolute bottom-0 left-0 w-screen border-b border-border/70"></div>
                  {/* Category Header */}
                  <button
                    type="button"
                    onClick={() => {
                      const isCurrentlyOpen = !!mobileExpanded[category.id];

                      setSubcategoryExpanded({});
                      setExpandedBrandId(null);

                      setMobileExpanded(isCurrentlyOpen ? {} : { [category.id]: true });
                    }}
                    className="flex w-full items-center justify-between px-4 py-3 transition-colors bg-white hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4 text-left">
                      {category.icon_url && (
                        <img
                          src={category.icon_url}
                          alt={category.name}
                          className="h-6 w-6 object-contain"
                        />
                      )}
                      <h3 className="text-[14px] font-normal text-left">
                        {category.name}
                      </h3>
                    </div>
                    {isExpanded ? (
                      <Minus className="h-3 w-3 flex-shrink-0 text-foreground" />
                    ) : (
                      <Plus className="h-3 w-3 flex-shrink-0 text-foreground" />
                    )}
                  </button>

                  {/* Expanded Subcategories */}
                  {isExpanded && (
                    <div className="bg-white border-l border-border/30 ml-4">
                      {category.subcategories.map((sub) => {
                        const isSubExpanded = subcategoryExpanded[sub.id];
                        const displayBrands = sub.brands;
                        const hasBrands = sub.brands.length > 0;

                        const handleSubcategoryClick = () => {
                          if (hasBrands) {
                            toggleSubcategory(sub.id);
                          } else if (sub.custom_link) {
                            window.open(sub.custom_link, '_blank');
                          }
                          // Else do nothing
                        };

                        const hasBrandsOrLink = sub.custom_link || hasBrands;

                        return (
                          <div key={sub.id} className="border-b border-border/30 last:border-0">
                            <div
                              onClick={() => hasBrandsOrLink && handleSubcategoryClick()}
                              className={`flex items-center justify-between px-4 py-3 text-left ${hasBrandsOrLink ? 'cursor-pointer' : 'opacity-100'}`}
                            >
                              <span className={`text-[14px] font-medium ${hasBrandsOrLink ? 'text-black hover:text-[#1d4ed8]' : 'text-black'}`}>
                                {sub.name}
                              </span>
                              {hasBrands && (
                                isSubExpanded ? (
                                  <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                                ) : (
                                  <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                                )
                              )}
                            </div>

                            {hasBrands && isSubExpanded && (
                              <div className="px-4 pb-4 pt-1">
                                <div className="border-l-2 border-blue-500 pl-4 ml-1">
                                  {displayBrands.slice(0, 6).map((brand) => (
                                    <BrandActionLinks
                                    key={brand.id}
                                    brand={brand}
                                    isExpanded={expandedBrandId === brand.id}
                                    onToggle={() => setExpandedBrandId(expandedBrandId === brand.id ? null : brand.id)}
                                    categoryId={category.id}
                                    subcategoryId={sub.id}
                                  />
                                  ))}
                                  {displayBrands.length > 6 && (
                                    <Link
                                      to={`/category/${category.id}/subcategory/${sub.id}/brands`}
                                      className="text-sm font-semibold text-primary hover:underline"
                                    >
                                      See all →
                                    </Link>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Desktop: Grid View */
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {categories.map((category) => {
              const showAll = expanded[category.id];
              const visibleSubs = showAll
                ? category.subcategories
                : category.subcategories.slice(0, 6);

              return (
                <div
                  key={category.id}
                  id={`category-${category.id}`}
                  className="overflow-hidden rounded-xl border border-border/50 bg-card"
                >
                  <Link
                    to={`/category/${category.id}`}
                    className="block w-full border-b py-4 px-2 text-center transition-opacity hover:opacity-90"
                    style={{ backgroundColor: category.bg_color }}
                  >
                    {category.icon_url && (
                      <img
                        src={category.icon_url}
                        alt={category.name}
                        className="mx-auto mb-2 h-10 w-10 md:h-14 md:w-14 object-contain"
                      />
                    )}
                    <h3 className="text-lg font-medium">
                      {category.name}
                    </h3>
                  </Link>

                  <div className="py-4 pl-8 text-left">
                    {visibleSubs.map((sub) => {
                      const isSubExpanded = subcategoryExpanded[sub.id];
                      const displayBrands = sub.brands;
                      const hasBrands = sub.brands.length > 0;

                      const handleSubcategoryClick = () => {
                        if (hasBrands) {
                          toggleSubcategory(sub.id);
                        } else if (sub.custom_link) {
                          window.open(sub.custom_link, '_blank');
                        }
                        // Else do nothing
                      };

                      const hasBrandsOrLink = sub.custom_link || hasBrands;

                      return (
                        <div key={sub.id} className="border-b border-border/30 last:border-0">
                          <div
                            onClick={() => hasBrandsOrLink && handleSubcategoryClick()}
                            className={`flex items-center justify-between py-2 text-left text-sm md:text-base font-normal text-foreground ${hasBrandsOrLink ? 'hover:text-[#1d4ed8] cursor-pointer' : 'opacity-100'}`}
                          >
                            <span className={hasBrandsOrLink ? '' : 'text-foreground'}>{sub.name}</span>
                            {hasBrands && (
                              isSubExpanded ? (
                                <Minus className="h-3.5 w-3.5 text-muted-foreground mr-2" />
                              ) : (
                                <Plus className="h-3.5 w-3.5 text-muted-foreground mr-2" />
                              )
                            )}
                          </div>

                          {hasBrands && isSubExpanded && (
                            <div className="pb-3 pt-1">
                              <div className="border-l-2 border-[#2b7bcc] pl-4 ml-1">
                                {displayBrands.slice(0, 6).map((brand) => (
                                  <BrandActionLinks
                                    key={brand.id}
                                    brand={brand}
                                    isExpanded={expandedBrandId === brand.id}
                                    onToggle={() => setExpandedBrandId(expandedBrandId === brand.id ? null : brand.id)}
                                    categoryId={category.id}
                                    subcategoryId={sub.id}
                                  />
                                ))}
                                {displayBrands.length > 6 && (
                                  <Link
                                    to={`/category/${category.id}/subcategory/${sub.id}/brands`}
                                    className="text-sm font-semibold text-primary hover:underline"
                                  >
                                    See all →
                                  </Link>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {category.subcategories.length > 6 && !showAll && (
                      <Link
                        to={`/category/${category.id}/subcategories`}
                        className="mt-3 text-sm md:text-base font-semibold text-primary hover:underline text-left"
                      >
                        See all →
                      </Link>
                    )}

                    {category.subcategories.length > 6 && showAll && (
                      <button
                        type="button"
                        onClick={() => {
                          const expandedSubId = Object.keys(subcategoryExpanded)[0];
                          const expandedSubBelongsToCategory = !!expandedSubId
                            && category.subcategories.some((s) => s.id === expandedSubId);

                          if (expandedSubBelongsToCategory) {
                            setSubcategoryExpanded({});
                            setExpandedBrandId(null);
                          }

                          setExpanded((prev) => ({
                            ...prev,
                            [category.id]: false,
                          }));
                        }}
                        className="mt-3 text-sm md:text-base font-semibold text-primary hover:underline"
                      >
                        Show less
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            

          </div>
        )}
      </div>
    </section>
  );
}
