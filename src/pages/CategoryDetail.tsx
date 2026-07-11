import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ChevronRight, List, Plus, Minus } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BrandActionLinks from '@/components/shared/BrandActionLinks';

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

export default function CategoryDetail() {
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [brandsBySubcategory, setBrandsBySubcategory] = useState<Record<string, BrandItem[]>>({});
  const [activeTab, setActiveTab] = useState(1);
  const [expandedSubcategoryId, setExpandedSubcategoryId] = useState<string | null>(null);
  const [expandedBrandIds, setExpandedBrandIds] = useState<Record<string, boolean>>({});

  // Reset all accordion states when location changes
  useEffect(() => {
    setExpandedSubcategoryId(null);
    setExpandedBrandIds({});
  }, [location.pathname]);

  const tabs = [
    { key: 'subcategories', label: 'Subcategories', icon: <List className="h-4 w-4" /> },
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
      }
      const visibleSubcategories = (subcategoryData || []).filter((sub: any) => sub.is_visible !== false);
      if (subcategoryData) setSubcategories(visibleSubcategories);
      
      // Group brands by subcategory
      const brandsMap: Record<string, BrandItem[]> = {};
      if (brandsData) {
        brandsData
          .filter((brand: any) => brand.is_visible !== false && visibleSubcategories.some((sub: any) => sub.id === brand.subcategory_id))
          .forEach((brand: any) => {
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
    setExpandedBrandIds({}); // Reset brand expansions when changing subcategory
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
      <main className="flex-1 pt-20 md:pt-32">
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">{category.name}</span>
            </div>
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
                    {tab.label}
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
                  <div key={sub.id} className="rounded-xl border border-gray-400 bg-card p-4">
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
                          <Minus className="h-3.5 w-3.5 text-gray/400" />
                        ) : (
                          <Plus className="h-3.5 w-3.5 text-gray/400" />
                        )
                      )}
                    </div>
                    
                    {hasBrands && isExpanded && (
                      <div className="mt-3 space-y-2">
                        <div className="space-y-2 border-l-2 border-[#2b7bcc] pl-4 ml-1">
                          {brandsBySubcategory[sub.id]?.slice(0, 5).map((brand) => (
                            <BrandActionLinks
                              key={brand.id}
                              brand={brand}
                              isExpanded={Boolean(expandedBrandIds[brand.id])}
                              onToggle={() => setExpandedBrandIds((prev) => ({
                                ...prev,
                                [brand.id]: !prev[brand.id],
                              }))}
                              categoryId={category.id}
                              subcategoryId={sub.id}
                            />
                          ))}
                          {brandsBySubcategory[sub.id]?.length > 5 && (
                            <Link
                              to={`/category/${category.id}/subcategory/${sub.id}/brands`}
                              className="text-sm font-semibold text-primary hover:underline"
                            >
                              See All →
                            </Link>
                          )}
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