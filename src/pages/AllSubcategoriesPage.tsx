import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';
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
  sort_order: number;
}

// Helper function to handle subcategory navigation
const navigateToSubcategory = (subcategory: Subcategory, categoryId: string | undefined, navigate: ReturnType<typeof useNavigate>) => {
  if (subcategory.custom_link) {
    // If custom_link exists, redirect to it
    window.location.href = subcategory.custom_link;
  } else {
    // Otherwise, navigate to the detail page
    navigate(`/category/${categoryId}/subcategory/${subcategory.id}`);
  }
};

export default function AllSubcategoriesPage() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );

  if (!category)
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-muted-foreground">Category not found</div>
      </div>
    );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-6">
            <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>

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
        <div className="container mx-auto px-4 py-6">
          {subcategories.length === 0 ? (
            <p className="text-center text-muted-foreground">No subcategories available.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">

              {subcategories.map((sub) => (
                <div
                  key={sub.id}
                  className="flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md"
                >
                  <button
                    onClick={() => navigateToSubcategory(sub, categoryId, navigate)}
                    className="group min-w-0 flex-1 text-left"
                  >
                    <span className="block max-w-full text-base font-medium text-foreground transition-colors group-hover:text-primary">
                      {sub.name}
                    </span>
                  </button>
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
