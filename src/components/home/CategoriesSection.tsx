import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Minus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMSG91Auth } from '@/contexts/MSG91AuthContext';

interface Subcategory {
  id: string;
  name: string;
  link: string | null;
  custom_link?: string | null;
  sort_order: number;
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
  const [heading, setHeading] = useState('Explore companies by category');
  const [showHeading, setShowHeading] = useState(true);
  const isMobile = useIsMobile();
  const { checkAuthAndNavigate } = useMSG91Auth();

  // Helper function to handle subcategory navigation
  const handleSubcategoryClick = (subcategory: Subcategory, categoryId: string) => {
    const targetPath = subcategory.custom_link || `/category/${categoryId}/subcategory/${subcategory.id}`;
    checkAuthAndNavigate(targetPath);
  };

  const handleCategoryClick = (categoryId: string) => {
    checkAuthAndNavigate(`/category/${categoryId}`);
  };

  useEffect(() => {
    let mounted = true;
    
    async function load() {
      const { data: cats } = await supabase.from('categories').select('*').eq('section_id', sectionId).order('sort_order');
      if (!cats) return;
      const { data: subs } = await supabase.from('subcategories').select('*').order('sort_order');
      const merged = cats.map((category) => ({
        ...category,
        subcategories: (subs || []).filter((sub) => sub.category_id === category.id),
      }));
      if (mounted) setCategories(merged);
    }

    async function loadSection() {
      const { data } = await supabase
        .from('page_sections')
        .select('heading, show_heading')
        .eq('id', sectionId)
        .single();
      
      if (data && mounted) {
        setHeading(data.heading || 'Explore companies by category');
        setShowHeading(data.show_heading !== false);
      }
    }

    load();
    loadSection();

    const channel = supabase
      .channel(`categories_live_${sectionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, () => load())
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
    <section id="categories" className="py-2 md:py-3 bg-white md:bg-[#f9f8f5]">
  

      <div className="mx-auto max-w-[1580px] px-6 md:px-8 lg:px-12">
        {showHeading && (
          <h2 className="section-heading">
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
                    className="flex w-full items-center justify-between px-4 py-3 transition-colors"
                    style={{ backgroundColor: isExpanded ? category.bg_color : 'transparent' }}
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
                    <div className="space-y-2 bg-white px-4 py-4">
                      {category.subcategories.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => handleSubcategoryClick(sub, category.id)}
                          className="block w-full text-left text-sm font-normal text-black hover:text-blue-600 hover:underline transition-colors"
                        >
                          {sub.name}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleCategoryClick(category.id)}
                        className="mt-4 w-full rounded-lg bg-primary/10 py-2 text-center text-sm font-medium text-primary hover:bg-primary/20"
                      >
                        Explore all
                      </button>
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
                  className="overflow-hidden rounded-xl border border-border/50 bg-card"
                >
                  <button
                    type="button"
                    onClick={() => handleCategoryClick(category.id)}
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
                  </button>

                  <div className="py-4 pl-8 text-left">
                    {visibleSubs.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => handleSubcategoryClick(sub, category.id)}
                        className="block w-full text-left border-b border-border/30 py-2 last:border-b-0 text-sm md:text-base font-normal text-foreground hover:text-primary hover:underline transition-colors"
                      >
                        {sub.name}
                      </button>
                    ))}

                    {category.subcategories.length > 5 && !showAll && (
                      <button
                        type="button"
                        onClick={() => checkAuthAndNavigate(`/category/${category.id}/subcategories`)}
                        className="mt-3 text-sm md:text-base font-semibold text-primary hover:underline text-left"
                      >
                        See all {'->'}
                      </button>
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
