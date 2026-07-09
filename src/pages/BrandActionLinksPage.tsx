import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getBrandActionLinks, BrandWithActionLinks } from '@/components/shared/BrandActionLinks';

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
  action_links?: Array<{
    id?: string;
    text?: string | null;
    url?: string | null;
    new_tab?: boolean;
    enabled?: boolean;
  }>;
}

export default function BrandActionLinksPage() {
  const { categoryId, subcategoryId, brandId } = useParams<{ categoryId: string; subcategoryId: string; brandId: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null);
  const [brand, setBrand] = useState<BrandItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId || !subcategoryId || !brandId) return;

    let mounted = true;
    
    const loadData = async () => {
      if (!mounted) return;
      setLoading(true);

      const [{ data: categoryData }, { data: subcategoryData }, { data: brandData }] = await Promise.all([
        supabase.from('categories').select('*').eq('id', categoryId).single(),
        supabase.from('subcategories').select('*').eq('id', subcategoryId).single(),
        supabase.from('subcategory_brands').select('*').eq('id', brandId).single(),
      ]);

      if (!mounted) return;

      if (categoryData) setCategory(categoryData);
      if (subcategoryData) setSubcategory(subcategoryData);
      if (brandData) setBrand(brandData);
      
      setLoading(false);
    };

    loadData();
  }, [categoryId, subcategoryId, brandId]);

  if (loading)
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );

  if (!category || !subcategory || !brand)
    return (
      <div className="flex min-h-[100dvh] items-center justify-center">
        <div className="text-lg text-muted-foreground">Page not found</div>
      </div>
    );

  const actionLinks = getBrandActionLinks(brand as BrandWithActionLinks);
  const hasActionLinks = actionLinks.length > 0;

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
              <Link 
                to={`/category/${category.id}/subcategory/${subcategory.id}/brands`}
                className="hover:text-foreground transition-colors"
              >
                {subcategory.name}
              </Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">{brand.name}</span>
            </div>

            <div className="flex items-center gap-4">
              <Link
                to={`/category/${category.id}/subcategory/${subcategory.id}/brands`}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              {category.icon_url && (
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg"
                  style={{ backgroundColor: category.bg_color }}
                >
                  <img src={category.icon_url} alt={category.name} className="h-7 w-7 object-contain" />
                </div>
              )}
              <div>
                <h1 className="text-xl md:text-2xl font-bold">{brand.name}</h1>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {actionLinks.length} Action Links
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Links Grid */}
        <div className="container mx-auto px-4 md:px-8 lg:px-10 py-6">
          {!hasActionLinks ? (
            <p className="text-center text-muted-foreground">No action links available.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 items-start">
              {actionLinks.map((link, index) => (
                <div key={index} className="rounded-xl border border-border/50 bg-card p-4">
                  {link.isClickable ? (
                    <a
                      href={link.url}
                      target={link.newTab ? '_blank' : undefined}
                      rel={link.newTab ? 'noopener noreferrer' : undefined}
                      className="flex items-center justify-between text-left text-sm md:text-base font-normal text-foreground hover:text-primary cursor-pointer"
                    >
                      <span>{link.text}</span>
                    </a>
                  ) : (
                    <span className="flex items-center justify-between text-left text-sm md:text-base font-normal text-foreground">
                      {link.text}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
