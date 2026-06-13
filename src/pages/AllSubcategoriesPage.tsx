import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ChevronRight } from 'lucide-react';
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

export default function AllSubcategoriesPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) return;

    let mounted = true;
    
    const loadData = async () => {
      if (!mounted) return;
      setLoading(true);

      const [{ data: categoryData }, { data: subcategoriesData }] = await Promise.all([
        supabase.from('categories').select('*').eq('id', categoryId).single(),
        supabase
          .from('subcategories')
          .select('*')
          .eq('category_id', categoryId)
          .order('sort_order'),
      ]);

      if (!mounted) return;

      if (categoryData) setCategory(categoryData);
      if (subcategoriesData) setSubcategories(subcategoriesData);
      setLoading(false);
    };

    loadData();

    const channel = supabase
      .channel(`subcategories_${categoryId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `id=eq.${categoryId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories', filter: `category_id=eq.${categoryId}` }, loadData)
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [categoryId]);

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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

              {subcategories.map((sub) => (
                sub.custom_link ? (
                  <a
                    key={sub.id}
                    href={sub.custom_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
                  >
                    <div className="group min-w-0 flex-1 text-left">
                      <span className="block max-w-full text-sm md:text-base font-normal text-foreground transition-all group-hover:text-primary group-hover:underline">
                        {sub.name}
                      </span>
                    </div>
                  </a>
                ) : (
                  <Link
                    key={sub.id}
                    to={`/category/${categoryId}/subcategory/${sub.id}`}
                    className="flex items-center justify-between rounded-xl border border-border/50 bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
                  >
                    <div className="group min-w-0 flex-1 text-left">
                      <span className="block max-w-full text-sm md:text-base font-normal text-foreground transition-all group-hover:text-primary group-hover:underline">
                        {sub.name}
                      </span>
                    </div>
                  </Link>
                )
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
