import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, List, Plus, Minus } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface Category {
  id: string;
  name: string;
  icon_url: string | null;
  bg_color: string;
  subcategories_tab_label?: string | null;
  detail_heading?: string | null;
  detail_description?: string | null;
}

interface Subcategory {
  id: string;
  name: string;
  link: string | null;
  custom_link?: string | null;
  custom_link_type?: 'link' | 'iframe' | null;
}

interface BrandItem {
  id: string;
  subcategory_id: string;
  name: string;
  link?: string | null;
}

export default function CategoryDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [brandsBySubcategory, setBrandsBySubcategory] = useState<Record<string, BrandItem[]>>({});
  const [subcategoriesTabLabel, setSubcategoriesTabLabel] = useState('Subcategories');
  const [activeTab, setActiveTab] = useState(1);
  const [expandedSubcategoryId, setExpandedSubcategoryId] = useState<string | null>(null);

  const tabs = [
    { key: 'subcategories', label: subcategoriesTabLabel, icon: <List className="h-4 w-4" /> },
  ];

  useEffect(() => {
    if (!id) return;

    let mounted = true;
    
    const loadData = async () => {
      const [
        { data: categoryData },
        { data: subcategoryData },
        { data: brandsData },
      ] = await Promise.all([
        supabase.from('categories').select('*').eq('id', id).single(),
        supabase.from('subcategories').select('*').eq('category_id', id).order('sort_order'),
        supabase.from('subcategory_brands').select('*'),
      ]);

      if (!mounted) return;

      if (categoryData) {
        setCategory(categoryData);
        setSubcategoriesTabLabel(categoryData.subcategories_tab_label || 'Subcategories');
      }
      if (subcategoryData) setSubcategories(subcategoryData);
      
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
    };

    loadData();

    const channel = supabase
      .channel(`category_detail_${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories', filter: `id=eq.${id}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories', filter: `category_id=eq.${id}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategory_brands' }, loadData)
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleSubcategoryClick = (sub: Subcategory) => {
    if (brandsBySubcategory[sub.id]?.length > 0) {
      setExpandedSubcategoryId(expandedSubcategoryId === sub.id ? null : sub.id);
    } else if (sub.custom_link) {
      window.open(sub.custom_link, '_blank');
    }
    // Else do nothing
  };

  if (!category) return <div className="flex min-h-[100dvh] items-center justify-center">Loading...</div>;

  return (
    <div className="flex flex-col bg-background min-h-screen">
      <Header />
      <main className="flex-1">
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-6">
            <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </Link>
            <div className="flex items-center gap-4">
              {category.icon_url && (
                <div className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: category.bg_color }}>
                  <img src={category.icon_url} alt={category.name} className="h-9 w-9 object-contain" />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{category.name}</h1>
                {category.detail_description && (
                  <p className="mt-2 text-sm text-muted-foreground">{category.detail_description}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab, index) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(index + 1)}
                  className={`whitespace-nowrap border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
                    activeTab === index + 1 ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {tab.icon}
                    {isAdmin && tab.key === 'subcategories' ? (
                      <input
                        type="text"
                        value={subcategoriesTabLabel}
                        onChange={(e) => setSubcategoriesTabLabel(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-28 rounded-lg border border-border bg-transparent px-2 py-1 text-sm font-medium text-current outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                      />
                    ) : (
                      tab.label
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {activeTab === 1 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 items-start">
              {subcategories.map((sub) => {
                const hasBrands = brandsBySubcategory[sub.id]?.length > 0;
                const isClickable = sub.custom_link || hasBrands;
                const isExpanded = expandedSubcategoryId === sub.id;
                
                return (
                  <div key={sub.id} className="rounded-xl border border-border bg-card p-4">
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
              {subcategories.length === 0 && <p className="text-muted-foreground">No subcategories available.</p>}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
