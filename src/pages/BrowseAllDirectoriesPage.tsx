
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

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

  const handleCategoryClick = (category: Category) => {
    // Navigate to category detail page
    navigate(`/category/${category.id}`);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSectionId(expandedSectionId === sectionId ? null : sectionId);
  };

  const getSectionCategories = (sectionId: string) => {
    return categories.filter((cat) => cat.section_id === sectionId);
  };

  const visibleSections = sections.filter(section => getSectionCategories(section.id).length > 0);

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
      <main className="pt-24 md:pt-28">
        <div className="max-w-6xl mx-auto px-4 md:px-8 lg:px-10 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-[#001965] mb-4">
            <Link to="/" className="hover:underline">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium">{settings?.heading || 'All Directories'}</span>
          </div>

          <h1 className="text-[32px] font-semibold text-[#343a40] mb-8">
            {settings?.heading || 'All Directories'}
          </h1>

          <div>
            {/* Mobile: 2 columns */}
            <div className="md:hidden grid grid-cols-1 gap-x-8 pl-8 pr-16">
              <div className="space-y-2">
                {visibleSections.filter((_, i) => i % 2 === 0).map((section) => {
                  const isExpanded = expandedSectionId === section.id;
                  const sectionCategories = getSectionCategories(section.id);
                  return (
                    <div key={section.id} className="space-y-2">
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between text-left text-[#1d2129] hover:text-[#001965] transition-colors py-2 pr-6"
                      >
                        <span className="font-semibold">{section.heading || section.name}</span>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-[#1d2129] mr-2" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-[#1d2129] mr-2" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="pl-4 space-y-0">
                          {sectionCategories.map((category, index) => (
                            <div key={category.id} className={index > 0 ? "border-t border-gray-200" : ""}>
                              <button
                                onClick={() => handleCategoryClick(category)}
                                className="w-full flex items-center justify-between text-left text-[#1d2129] hover:text-[#001965] transition-colors py-2"
                              >
                                <span>{category.name}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2">
                {visibleSections.filter((_, i) => i % 2 === 1).map((section) => {
                  const isExpanded = expandedSectionId === section.id;
                  const sectionCategories = getSectionCategories(section.id);
                  return (
                    <div key={section.id} className="space-y-2">
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between text-left text-[#1d2129] hover:text-[#001965] transition-colors py-2 pr-6"
                      >
                        <span className="font-semibold">{section.heading || section.name}</span>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-[#1d2129] mr-2" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-[#1d2129] mr-2" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="pl-4 space-y-0">
                          {sectionCategories.map((category, index) => (
                            <div key={category.id} className={index > 0 ? "border-t border-gray-200" : ""}>
                              <button
                                onClick={() => handleCategoryClick(category)}
                                className="w-full flex items-center justify-between text-left text-[#1d2129] hover:text-[#001965] transition-colors py-2"
                              >
                                <span>{category.name}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Tablet: 2 columns */}
            <div className="hidden md:grid lg:hidden grid-cols-2 gap-x-8">
              <div className="space-y-2">
                {visibleSections.filter((_, i) => i % 2 === 0).map((section) => {
                  const isExpanded = expandedSectionId === section.id;
                  const sectionCategories = getSectionCategories(section.id);
                  return (
                    <div key={section.id} className="space-y-2">
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between text-left text-[#1d2129] hover:text-[#001965] transition-colors py-2 pr-6"
                      >
                        <span className="font-semibold">{section.heading || section.name}</span>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-[#1d2129] mr-2" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-[#1d2129] mr-2" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="pl-4 space-y-0">
                          {sectionCategories.map((category, index) => (
                            <div key={category.id} className={index > 0 ? "border-t border-gray-200" : ""}>
                              <button
                                onClick={() => handleCategoryClick(category)}
                                className="w-full flex items-center justify-between text-left text-[#1d2129] hover:text-[#001965] transition-colors py-2"
                              >
                                <span>{category.name}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2">
                {visibleSections.filter((_, i) => i % 2 === 1).map((section) => {
                  const isExpanded = expandedSectionId === section.id;
                  const sectionCategories = getSectionCategories(section.id);
                  return (
                    <div key={section.id} className="space-y-2">
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between text-left text-[#1d2129] hover:text-[#001965] transition-colors py-2 pr-6"
                      >
                        <span className="font-semibold">{section.heading || section.name}</span>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-[#1d2129] mr-2" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-[#1d2129] mr-2" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="pl-4 space-y-0">
                          {sectionCategories.map((category, index) => (
                            <div key={category.id} className={index > 0 ? "border-t border-gray-200" : ""}>
                              <button
                                onClick={() => handleCategoryClick(category)}
                                className="w-full flex items-center justify-between text-left text-[#1d2129] hover:text-[#001965] transition-colors py-2"
                              >
                                <span>{category.name}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Desktop: 3 columns */}
            <div className="hidden lg:grid grid-cols-3 gap-x-8">
              <div className="space-y-2">
                {visibleSections.filter((_, i) => i % 3 === 0).map((section) => {
                  const isExpanded = expandedSectionId === section.id;
                  const sectionCategories = getSectionCategories(section.id);
                  return (
                    <div key={section.id} className="space-y-2">
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between text-left text-[#1d2129] hover:text-[#001965] transition-colors py-2 pr-6"
                      >
                        <span className="font-semibold">{section.heading || section.name}</span>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-[#1d2129] mr-2" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-[#1d2129] mr-2" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="pl-4 space-y-0">
                          {sectionCategories.map((category, index) => (
                            <div key={category.id} className={index > 0 ? "border-t border-gray-200" : ""}>
                              <button
                                onClick={() => handleCategoryClick(category)}
                                className="w-full flex items-center justify-between text-left text-[#1d2129] hover:text-[#001965] transition-colors py-2"
                              >
                                <span>{category.name}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2">
                {visibleSections.filter((_, i) => i % 3 === 1).map((section) => {
                  const isExpanded = expandedSectionId === section.id;
                  const sectionCategories = getSectionCategories(section.id);
                  return (
                    <div key={section.id} className="space-y-2">
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between text-left text-[#1d2129] hover:text-[#001965] transition-colors py-2 pr-6"
                      >
                        <span className="font-semibold">{section.heading || section.name}</span>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-[#1d2129] mr-2" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-[#1d2129] mr-2" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="pl-4 space-y-0">
                          {sectionCategories.map((category, index) => (
                            <div key={category.id} className={index > 0 ? "border-t border-gray-200" : ""}>
                              <button
                                onClick={() => handleCategoryClick(category)}
                                className="w-full flex items-center justify-between text-left text-[#1d2129] hover:text-[#001965] transition-colors py-2"
                              >
                                <span>{category.name}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="space-y-2">
                {visibleSections.filter((_, i) => i % 3 === 2).map((section) => {
                  const isExpanded = expandedSectionId === section.id;
                  const sectionCategories = getSectionCategories(section.id);
                  return (
                    <div key={section.id} className="space-y-2">
                      <button
                        type="button"
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between text-left text-[#1d2129] hover:text-[#001965] transition-colors py-2 pr-6"
                      >
                        <span className="font-semibold">{section.heading || section.name}</span>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-[#1d2129] mr-2" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-[#1d2129] mr-2" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="pl-4 space-y-0">
                          {sectionCategories.map((category, index) => (
                            <div key={category.id} className={index > 0 ? "border-t border-gray-200" : ""}>
                              <button
                                onClick={() => handleCategoryClick(category)}
                                className="w-full flex items-center justify-between text-left text-[#1d2129] hover:text-[#001965] transition-colors py-2"
                              >
                                <span>{category.name}</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
