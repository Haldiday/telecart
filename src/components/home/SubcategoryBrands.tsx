import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface BrandItem {
  id: string;
  name: string;
  link: string;
  logo_url?: string | null;
  description?: string | null;
  sort_order: number;
}

const normalizeExternalUrl = (url: string) => {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) return null;
  return /^https?:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
};

export default function SubcategoryBrands() {
  const { categoryId, subcategoryId } = useParams<{ categoryId: string; subcategoryId: string }>();
  const [category, setCategory] = useState<any>(null);
  const [subcategory, setSubcategory] = useState<any>(null);
  const [brands, setBrands] = useState<BrandItem[]>([]);

  useEffect(() => {
    if (!subcategoryId) return;

    const loadData = async () => {
      const [{ data: categoryData }, { data: subcategoryData }, { data: brandData }] = await Promise.all([
        supabase.from('categories').select('*').eq('id', categoryId).single(),
        supabase.from('subcategories').select('*').eq('id', subcategoryId).single(),
        supabase.from('subcategory_brands').select('*').eq('subcategory_id', subcategoryId).order('sort_order'),
      ]);

      if (categoryData) setCategory(categoryData);
      if (subcategoryData) setSubcategory(subcategoryData);
      if (brandData) {
        const visibleBrands = brandData.filter((brand: any) => brand.is_visible !== false);
        setBrands(visibleBrands.map((brand: any) => ({
          id: brand.id,
          name: brand.name || '',
          link: brand.link || '',
          logo_url: brand.logo_url || null,
          description: brand.description || null,
          sort_order: brand.sort_order ?? 0,
        })));
      }
    };

    loadData();
  }, [categoryId, subcategoryId]);

  if (!category || !subcategory) {
    return (
      <div className="flex flex-col bg-background min-h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-lg text-muted-foreground">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 md:px-8 lg:px-10 py-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              <ChevronDown className="h-3 w-3 rotate-270" style={{ transform: 'rotate(-90deg)' }} />
              <Link to={`/category/${category.id}/subcategories`} className="hover:text-foreground transition-colors">{category.name}</Link>
              <ChevronDown className="h-3 w-3 rotate-270" style={{ transform: 'rotate(-90deg)' }} />
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
                  Brands
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Brands Grid */}
        <div className="container mx-auto px-4 md:px-8 lg:px-10 py-8">
          {brands.length === 0 ? (
            <p className="text-center text-muted-foreground">No brands available.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {brands.map((brand) => {
                const externalUrl = normalizeExternalUrl(brand.link || '');
                const brandBoxClassName =
                  'rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md group';
                const content = (
                  <span className="block max-w-full text-base font-medium text-foreground transition-colors group-hover:text-primary">
                    {brand.name || 'Unnamed brand'}
                  </span>
                );

                if (externalUrl) {
                  return (
                    <a
                      key={brand.id}
                      href={externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={brandBoxClassName}
                    >
                      {content}
                    </a>
                  );
                }

                return (
                  <div key={brand.id} className={brandBoxClassName}>
                    {content}
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
