import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight, Plus, Minus } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BrandActionLinks, { getBrandActionLinks, BrandWithActionLinks } from '@/components/shared/BrandActionLinks';

interface Category {
  id: string;
  name: string;
  icon_url: string | null;
  bg_color: string;
}

interface Subcategory {
  id: string;
  name: string;
}

interface BrandItem {
  id: string;
  subcategory_id: string;
  name: string;
  link: string | null;
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

export default function SubcategoryBrands() {
  const { categoryId, subcategoryId } = useParams<{ categoryId: string; subcategoryId: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [expandedBrandId, setExpandedBrandId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId || !subcategoryId) return;

    let mounted = true;
    
    const loadData = async () => {
      if (!mounted) return;
      setLoading(true);

      const [{ data: categoryData }, { data: subcategoryData }, { data: brandsData }] = await Promise.all([
        supabase.from('categories').select('*').eq('id', categoryId).single(),
        supabase.from('subcategories').select('*').eq('id', subcategoryId).single(),
        supabase.from('subcategory_brands').select('*').eq('subcategory_id', subcategoryId).order('sort_order'),
      ]);

      if (!mounted) return;

      if (categoryData) setCategory(categoryData);
      if (subcategoryData) setSubcategory(subcategoryData);
      
      if (brandsData) {
        const visibleBrands = brandsData.filter((brand: any) => brand.is_visible !== false);
        setBrands(visibleBrands);
      }
      
      setLoading(false);
    };

    loadData();
  }, [categoryId, subcategoryId]);

  if (loading)
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );

  if (!category || !subcategory)
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="text-lg text-muted-foreground">Page not found</div>
      </div>
    );

  return (
    <div className="flex flex-col bg-background min-h-screen">
      <Header />
      <main className="flex-1 pt-24 md:pt-28">
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 md:px-8 lg:px-10 py-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link 
                to={`/category/${category.id}/subcategories`}
                className="hover:text-foreground transition-colors"
              >
                {category.name}
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">{subcategory.name}</span>
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
                <h1 className="text-xl md:text-2xl font-bold">{subcategory.name}</h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {brands.length} Brands
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Brands Grid */}
        <div className="container mx-auto px-4 md:px-8 lg:px-10 py-6">
          {brands.length === 0 ? (
            <p className="text-center text-muted-foreground">No brands available.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 items-start">
              {brands.map((brand) => {
                const actionLinks = getBrandActionLinks(brand as BrandWithActionLinks);
                const hasActionLinks = actionLinks.length > 0;
                const isExpanded = expandedBrandId === brand.id;
                const hasLinkOrActions = brand.link || hasActionLinks;
                
                return (
                  <div key={brand.id} className="rounded-xl border border-border/50 bg-card p-4">
                    <BrandActionLinks
                      brand={brand}
                      isExpanded={isExpanded}
                      onToggle={() => setExpandedBrandId(isExpanded ? null : brand.id)}
                    />
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
