import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ChevronRight, Plus, Minus } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface Category {
  id: string;
  name: string;
  icon_url: string | null;
  bg_color: string;
}

interface Subcategory {
  id: string;
  name: string;
  link: string | null;
  custom_link?: string | null;
  custom_link_type?: 'link' | 'iframe' | null;
  sort_order: number;
}

interface BrandItem {
  id: string;
  subcategory_id: string;
  name: string;
  link?: string | null;
}

export default function AllSubcategoriesPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [brandsBySubcategory, setBrandsBySubcategory] = useState<Record<string, BrandItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedSubcategoryId, setExpandedSubcategoryId] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) return;

    let mounted = true;
    
    const loadData = async () => {
      if (!mounted) return;
      setLoading(true);

      const [{ data: categoryData }, { data: subcategoriesData }, { data: brandsData }] = await Promise.all([
        supabase.from('categories').select('*').eq('id', categoryId).single(),
        supabase
          .from('subcategories')
          .select('*')
          .eq('category_id', categoryId)
          .order('sort_order'),
        supabase.from('subcategory_brands').select('*'),
      ]);

      if (!mounted) return;

      if (categoryData) setCategory(categoryData);
      if (subcategoriesData) setSubcategories(subcategoriesData);
      
      // Group brands by subcategory
      const brandsMap: Record<string, BrandItem[]> = {};
      if (brandsData) {
        brandsData.forEach((brand: any) => {
          if (!brandsMap[brand.subcategory_id]) {
            brandsMap[brand.subcategory_id] = [];
          }
          brandsMap[brand.subcategory_id].push(brand);
        });
      }
      setBrandsBySubcategory(brandsMap);
      
      setLoading(false);
    };

    loadData();

    const channel = supabase
      .channel(`subcategories_${categoryId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `id=eq.${categoryId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories', filter: `category_id=eq.${categoryId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategory_brands' }, loadData)
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [categoryId]);

  const handleSubcategoryClick = (sub: Subcategory) => {
    if (brandsBySubcategory[sub.id]?.length > 0) {
      setExpandedSubcategoryId(expandedSubcategoryId === sub.id ? null : sub.id);
    } else if (sub.custom_link) {
      window.open(sub.custom_link, '_blank');
    }
    // Else do nothing
  };

  if (loading)
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );

  if (!category)
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="text-lg text-muted-foreground">Category not found</div>
      </div>
    );

  return (
    <div className="flex flex-col bg-background min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 md:px-8 lg:px-10 py-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">{category.name}</span>
            </div>

            <div className="flex items-center gap-4">
              {category.icon_url && (
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg"
                  style={{ backgroundColor: category.bg_color }}
                >
                  <img src={category.icon_url} alt={category.name} className="h-7 w-7 object-contain" />
                </div>
              )}
              <div>
                <h1 className="text-xl md:text-2xl font-bold">{category.name}</h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {subcategories.length} Products
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 🔥 Compact Subcategories Grid */}
        <div className="container mx-auto px-4 md:px-8 lg:px-10 py-6">
          {subcategories.length === 0 ? (
            <p className="text-center text-muted-foreground">No subcategories available.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 items-start">
              {subcategories.map((sub) => {
                  const hasBrands = brandsBySubcategory[sub.id]?.length > 0;
                  const isClickable = sub.custom_link || hasBrands;
                  const isExpanded = expandedSubcategoryId === sub.id;
                  
                  return (
                    <div key={sub.id} className="rounded-xl border border-border/50 bg-card p-4">
                      <div
                        onClick={() => isClickable && handleSubcategoryClick(sub)}
                        className={`flex items-center justify-between text-left text-sm md:text-base font-normal text-foreground ${
                          isClickable 
                            ? 'hover:text-primary cursor-pointer' 
                            : ''
                        }`}
                      >
                        <span>{sub.name}</span>
                        {hasBrands && (
                          isExpanded ? (
                            <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                          )
                        )}
                      </div>
                      
                      {hasBrands && isExpanded && (
                        <div className="mt-3 space-y-2">
                          <div className="space-y-2 border-l-2 border-[#2b7bcc] pl-4 ml-1">
                            {brandsBySubcategory[sub.id]?.map((brand) => (
                              brand.link ? (
                                <a
                                  key={brand.id}
                                  href={brand.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block w-full text-left text-xs md:text-sm font-normal text-muted-foreground hover:text-primary transition-colors border-b border-border/30 last:border-0 py-1"
                                >
                                  {brand.name}
                                </a>
                              ) : (
                                <div
                                  key={brand.id}
                                  className="block w-full text-left text-xs md:text-sm font-normal text-muted-foreground border-b border-border/30 last:border-0 py-1"
                                >
                                  {brand.name}
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
