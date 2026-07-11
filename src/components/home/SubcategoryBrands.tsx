import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight, Plus, Minus, ArrowUpRight } from 'lucide-react';
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
  button_1_text?: string | null;
  button_1_link?: string | null;
  button_1_visible?: boolean;
  button_2_text?: string | null;
  button_2_link?: string | null;
  button_2_visible?: boolean;
  button_3_text?: string | null;
  button_3_link?: string | null;
  button_3_visible?: boolean;
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
      
      if (subcategoryData) {
        setSubcategory({
          ...(subcategoryData as Subcategory),
          button_1_text: (subcategoryData as any).button_1_text,
          button_1_link: (subcategoryData as any).button_1_link,
          button_1_visible: (subcategoryData as any).button_1_visible ?? false,
          button_2_text: (subcategoryData as any).button_2_text,
          button_2_link: (subcategoryData as any).button_2_link,
          button_2_visible: (subcategoryData as any).button_2_visible ?? false,
          button_3_text: (subcategoryData as any).button_3_text,
          button_3_link: (subcategoryData as any).button_3_link,
          button_3_visible: (subcategoryData as any).button_3_visible ?? false,
        });
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

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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

              <div className="flex flex-wrap justify-end gap-4 pr-60 md:pr-14">
                {subcategory.button_1_visible && subcategory.button_1_text && (
                  <a
                    href={subcategory.button_1_link || '#'}
                    target={subcategory.button_1_link ? '_blank' : undefined}
                    rel={subcategory.button_1_link ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-4 py-3 text-base font-medium text-[#111111] transition-all duration-200 hover:border-[#1d4ed8] hover:text-[#1d4ed8]"
                  >
                    {subcategory.button_1_text}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                )}
                {subcategory.button_2_visible && subcategory.button_2_text && (
                  <a
                    href={subcategory.button_2_link || '#'}
                    target={subcategory.button_2_link ? '_blank' : undefined}
                    rel={subcategory.button_2_link ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-4 py-2 text-base font-medium text-[#111111] transition-all duration-200 hover:border-[#1d4ed8] hover:text-[#1d4ed8]"
                  >
                    {subcategory.button_2_text}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                )}
                {subcategory.button_3_visible && subcategory.button_3_text && (
                  <a
                    href={subcategory.button_3_link || '#'}
                    target={subcategory.button_3_link ? '_blank' : undefined}
                    rel={subcategory.button_3_link ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center gap-2 rounded-md border border-[#E5E7EB] bg-white px-4 py-2 text-base font-medium text-[#111111] transition-all duration-200 hover:border-[#1d4ed8] hover:text-[#1d4ed8]"
                  >
                    {subcategory.button_3_text}
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Brands Grid */}
        <div className="container mx-auto px-4 md:px-8 lg:px-10 py-8">
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
                  <div key={brand.id} className="rounded-xl border border-gray-300 bg-card p-2">
                    <BrandActionLinks
                      brand={brand}
                      isExpanded={isExpanded}
                      onToggle={() => setExpandedBrandId(isExpanded ? null : brand.id)}
                      categoryId={categoryId}
                      subcategoryId={subcategoryId}
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
