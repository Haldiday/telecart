import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Minus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Brand {
  id: string;
  name: string;
  link: string | null;
  sort_order: number;
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
}

export default function CategoriesSection({ sectionId }: CategoriesSectionProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [mobileExpanded, setMobileExpanded] = useState<Record<string, boolean>>({});
  const [subcategoryExpanded, setSubcategoryExpanded] = useState<Record<string, boolean>>({});
  const [heading, setHeading] = useState('Explore companies by category');
  const [showHeading, setShowHeading] = useState(true);
  const isMobile = useIsMobile();

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
            .filter((sub) => sub.category_id === category.id)
            .map(sub => ({
              ...sub,
              brands: (brands || []).filter((b: any) => b.subcategory_id === sub.id)
            })),
        }));
      if (mounted) setCategories(merged as unknown as Category[]);
    }

    async function loadSection() {
      const { data } = await supabase
        .from('page_sections')
        .select('heading, name, show_heading')
        .eq('id', sectionId)
        .single();
      
      if (data && mounted) {
        setHeading(data.heading || data.name || 'Explore companies by category');
        setShowHeading(data.show_heading !== false);
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

  return (
    <section id={`section-${sectionId}`} className="py-2 md:py-3 bg-white md:bg-[#f9f8f5]">
  

      <div className="mx-auto max-w-[1580px] px-6 md:px-8 lg:px-12">
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
                    onClick={() =>
                      setMobileExpanded((prev) => ({
                        ...prev,
                        [category.id]: !prev[category.id],
                      }))
                    }
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
                            setSubcategoryExpanded(prev => ({ ...prev, [sub.id]: !prev[sub.id] }));
                          } else {
                            // Just navigate directly
                          }
                        };

                        return (
                          <div key={sub.id} className="border-b border-border/30 last:border-0">
                            {hasBrands ? (
                              <button
                                onClick={handleSubcategoryClick}
                                className="flex w-full items-center justify-between px-4 py-3 text-left"
                              >
                                <span className="text-[14px] font-medium text-black">
                                  {sub.name}
                                </span>
                                {isSubExpanded ? (
                                  <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                                ) : (
                                  <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                              </button>
                            ) : (
                              sub.custom_link ? (
                                <a
                                  href={sub.custom_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                                >
                                  <span className="text-[14px] font-medium text-black">
                                    {sub.name}
                                  </span>
                                </a>
                              ) : (
                                <Link
                                  to={`/category/${category.id}/subcategory/${sub.id}`}
                                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                                >
                                  <span className="text-[14px] font-medium text-black">
                                    {sub.name}
                                  </span>
                                </Link>
                              )
                            )}

                            {hasBrands && isSubExpanded && (
                              <div className="px-4 pb-4 pt-1 space-y-3">
                                <div className="space-y-2 border-l-2 border-border/50 pl-4 ml-1">
                                  {displayBrands.map((brand) => (
                                    brand.link ? (
                                      <a
                                        key={brand.id}
                                        href={brand.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full text-left text-sm font-normal text-muted-foreground hover:text-primary transition-colors"
                                      >
                                        {brand.name}
                                      </a>
                                    ) : (
                                      <Link
                                        key={brand.id}
                                        to={`/category/${category.id}/subcategory/${sub.id}`}
                                        className="block w-full text-left text-sm font-normal text-muted-foreground hover:text-primary transition-colors"
                                      >
                                        {brand.name}
                                      </Link>
                                    )
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      <div className="p-4">
                        <Link
                          to={`/category/${category.id}`}
                          className="w-full rounded-lg bg-primary/10 py-2.5 text-center text-sm font-semibold text-primary hover:bg-primary/20 transition-all"
                        >
                          Explore all
                        </Link>
                      </div>
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
                : category.subcategories.slice(0, 5);

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
                          setSubcategoryExpanded(prev => ({ ...prev, [sub.id]: !prev[sub.id] }));
                        }
                      };

                      return (
                        <div key={sub.id} className="border-b border-border/30 last:border-0">
                          {hasBrands ? (
                            <button
                              onClick={handleSubcategoryClick}
                              className="flex w-full items-center justify-between py-2 text-left text-sm md:text-base font-normal text-foreground hover:text-primary transition-colors"
                            >
                              <span>{sub.name}</span>
                              {isSubExpanded ? (
                                <Minus className="h-3.5 w-3.5 text-muted-foreground mr-2" />
                              ) : (
                                <Plus className="h-3.5 w-3.5 text-muted-foreground mr-2" />
                              )}
                            </button>
                          ) : (
                            sub.custom_link ? (
                              <a
                                href={sub.custom_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full text-left py-2 text-sm md:text-base font-normal text-foreground hover:text-primary hover:underline transition-colors"
                              >
                                {sub.name}
                              </a>
                            ) : (
                              <Link
                                to={`/category/${category.id}/subcategory/${sub.id}`}
                                className="block w-full text-left py-2 text-sm md:text-base font-normal text-foreground hover:text-primary hover:underline transition-colors"
                              >
                                {sub.name}
                              </Link>
                            )
                          )}

                          {hasBrands && isSubExpanded && (
                            <div className="pb-3 pt-1 space-y-2">
                              <div className="space-y-2 border-l-2 border-border/50 pl-4 ml-1">
                                {displayBrands.map((brand) => (
                                  brand.link ? (
                                    <a
                                      key={brand.id}
                                      href={brand.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="block w-full text-left text-xs md:text-sm font-normal text-muted-foreground hover:text-primary transition-colors py-1"
                                    >
                                      {brand.name}
                                    </a>
                                  ) : (
                                    <Link
                                      key={brand.id}
                                      to={`/category/${category.id}/subcategory/${sub.id}`}
                                      className="block w-full text-left text-xs md:text-sm font-normal text-muted-foreground hover:text-primary transition-colors py-1"
                                    >
                                      {brand.name}
                                    </Link>
                                  )
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {category.subcategories.length > 5 && !showAll && (
                      <Link
                        to={`/category/${category.id}/subcategories`}
                        className="mt-3 text-sm md:text-base font-semibold text-primary hover:underline text-left"
                      >
                        See all →
                      </Link>
                    )}

                    {category.subcategories.length > 5 && showAll && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpanded((prev) => ({
                            ...prev,
                            [category.id]: false,
                          }))
                        }
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
