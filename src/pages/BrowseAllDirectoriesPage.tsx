
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Category {
  id: string;
  name: string;
  sort_order: number;
  section_id: string;
  is_visible?: boolean;
}

interface PageSection {
  id: string;
  heading: string;
  name: string;
  sort_order: number;
  is_visible: boolean;
}

interface PageSettings {
  heading: string;
}

export default function BrowseAllDirectoriesPage() {
  const [settings, setSettings] = useState<PageSettings | null>(null);
  const [sections, setSections] = useState<PageSection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      // Load page settings
      const { data: settingsData } = await (supabase as any)
        .from('browse_all_directories_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (settingsData) {
        setSettings(settingsData);
      } else {
        setSettings({ heading: 'All Directories' });
      }

      // Load page sections
      const { data: sectionsData } = await supabase
        .from('page_sections')
        .select('*')
        .order('sort_order');
      
      if (sectionsData) {
        setSections(sectionsData.filter((s: PageSection) => s.is_visible));
      }

      // Load categories
      const { data: catsData } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');
      
      if (catsData) {
        setCategories(catsData.filter((c: Category) => c.is_visible !== false));
      }

      setIsLoading(false);
    };

    loadData();

    const channel = supabase
      .channel('browse_all_directories_live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'browse_all_directories_settings' as any },
        () => loadData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'page_sections' },
        () => loadData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories' },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSectionClick = (section: PageSection) => {
    // Navigate to home page and scroll to the section
    navigate(`/#section-${section.id}`);
  };

  const handleCategoryClick = (category: Category) => {
    // Navigate to category detail page
    navigate(`/category/${category.id}`);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSectionId(expandedSectionId === sectionId ? null : sectionId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-4 py-24"></div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <section className="py-16 px-4 md:px-8 mt-20 md:mt-24" style={{ backgroundColor: '#eff3f8' }}>
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-left text-gray-900 mb-12">
            {settings?.heading || 'All Directories'}
          </h1>

          <div className="space-y-0">
            {sections.filter(section => categories.some(cat => cat.section_id === section.id)).map((section) => {
              const isSectionExpanded = expandedSectionId === section.id;
              const sectionCategories = categories.filter(
                (cat) => cat.section_id === section.id
              );

              return (
                <div key={section.id} className="border-b border-gray-200 last:border-0">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className="flex w-full items-center justify-between py-5 px-4 md:px-6 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-900">
                      {section.heading || section.name}
                    </h2>
                    {isSectionExpanded ? (
                      <Minus className="h-5 w-5 text-gray-700" />
                    ) : (
                      <Plus className="h-5 w-5 text-gray-700" />
                    )}
                  </button>

                  {isSectionExpanded && (
                    <div className="bg-gray-50 px-4 md:px-10 pt-4 pb-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
                        {sectionCategories.map((category) => (
                          <button
                            key={category.id}
                            onClick={() => handleCategoryClick(category)}
                            className="text-left text-gray-700 hover:text-blue-600 transition-colors py-1.5 text-lg"
                          >
                            {category.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
