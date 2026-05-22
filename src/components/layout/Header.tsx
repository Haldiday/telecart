import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Subcategory {
  id: string;
  name: string;
  link: string | null;
  custom_link?: string | null;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  icon_url: string | null;
  bg_color: string;
  subcategories: Subcategory[];
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'categories' | 'service'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCategories = async () => {
      // 1. Fetch visible sections of type 'categories'
      const { data: sections } = await supabase
        .from('page_sections')
        .select('id')
        .eq('section_type', 'categories')
        .eq('is_visible', true);

      if (!sections || sections.length === 0) {
        setCategories([]);
        return;
      }

      const sectionIds = sections.map(s => s.id);

      // 2. Fetch categories for these sections
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .in('section_id', sectionIds)
        .order('sort_order');

      if (!cats) {
        setCategories([]);
        return;
      }

      // 3. Fetch subcategories
      const { data: subs } = await supabase
        .from('subcategories')
        .select('*')
        .order('sort_order');

      const merged = cats.map((category) => ({
        ...category,
        subcategories: (subs || []).filter((sub) => sub.category_id === category.id),
      }));

      setCategories(merged);
    };

    loadCategories();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('header_categories_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'page_sections' }, () => loadCategories())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => loadCategories())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, () => loadCategories())
      .subscribe();

    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMegaMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      channel.unsubscribe();
    };
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/category/${categoryId}`);
    setMegaMenuOpen(false);
  };

  const handleSubcategoryClick = (categoryId: string, sub: Subcategory) => {
    if (sub.custom_link) {
      window.location.href = sub.custom_link;
    } else {
      navigate(`/category/${categoryId}/subcategory/${sub.id}`);
    }
    setMegaMenuOpen(false);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 md:px-8 lg:px-10">
        <div className="flex items-center h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">

            {/* ICON */}
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm md:text-base">
                B
              </span>
            </div>

            {/* TEXT */}
            <span className="text-2xl md:text-3xl font-bold text-[black]">Biz<span className="text-[#1d4ed8]">Req</span></span>

          </Link>

          {/* NAVIGATION */}
          <nav className="hidden md:flex items-center gap-8 ml-auto">
            <Link to="/" className="text-xl font-medium text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                className="flex items-center gap-1 text-xl font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Categories
                <ChevronDown className={`w-4 h-4 transition-transform ${megaMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Mega Menu */}
              {megaMenuOpen && (
                <div className="absolute top-full right-[-150px] mt-0 w-[90vw] max-w-[1100px] bg-white border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-50 overflow-hidden">
                  {/* Tabs */}
                  <div className="flex border-b border-gray-100 bg-white px-6">
                    <button
                      onClick={() => setActiveTab('categories')}
                      className={`px-4 py-3 text-[14px] font-bold transition-colors relative ${
                        activeTab === 'categories' ? 'text-[#1d4ed8]' : 'text-[#4b5563] hover:text-[#1d4ed8]'
                      }`}
                    >
                      Categories
                      {activeTab === 'categories' && (
                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#1d4ed8]" />
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('service')}
                      className={`px-4 py-3 text-[14px] font-bold transition-colors relative ${
                        activeTab === 'service' ? 'text-[#1d4ed8]' : 'text-[#4b5563] hover:text-[#1d4ed8]'
                      }`}
                    >
                      Service Hub
                      {activeTab === 'service' && (
                        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#1d4ed8]" />
                      )}
                    </button>
                  </div>

                  {/* Content */}
                  <div className="px-6 py-5 bg-white">
                    {activeTab === 'categories' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-1 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        {categories.map((category) => (
                          <div key={category.id}>
                            <button
                              onClick={() => handleCategoryClick(category.id)}
                              className="flex items-center gap-1 group text-left w-full transition-all py-1 px-2 rounded hover:bg-primary/5"
                            >
                              <h3 className="text-[#001a41] font-bold text-[14px] group-hover:text-[#1d4ed8] transition-colors leading-tight">
                                {category.name}
                              </h3>
                              <ChevronRight className="w-3 h-3 ml-auto text-gray-300 group-hover:text-[#1d4ed8] transition-colors" />
                            </button>
                          </div>
                        ))}
                        
                        {/* All Categories Button */}
                        <div className="col-span-full flex justify-center mt-6 pt-4 border-t border-gray-50">
                          <Link
                            to="/#categories"
                            onClick={() => setMegaMenuOpen(false)}
                            className="bg-[#001a41] text-white px-6 py-2 rounded text-[14px] font-bold hover:bg-[#001a41]/90 transition-all shadow-md active:scale-95"
                          >
                            All Softwares Categories
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-48 text-muted-foreground text-[14px]">
                        Service Hub content will be available soon.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <a href="#offers" className="text-xl font-medium text-muted-foreground hover:text-foreground transition-colors">
              Offers
            </a>
          </nav>

          {/* Mobile Button */}
          <button
            className="md:hidden ml-auto p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-4 space-y-3 max-h-[80vh] overflow-y-auto">
          <Link to="/" className="block text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>
            Home
          </Link>

          <div className="space-y-2">
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium">Categories</span>
            </div>
            <div className="pl-4 space-y-2 border-l border-border">
              {categories.map(cat => (
                <div key={cat.id} className="py-1">
                  <button
                    onClick={() => {
                      handleCategoryClick(cat.id);
                      setMobileOpen(false);
                    }}
                    className="text-sm font-semibold text-primary block w-full text-left py-2 px-3 rounded-md hover:bg-primary/5 transition-colors"
                  >
                    {cat.name}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <a href="#offers" className="block text-sm font-medium py-2" onClick={() => setMobileOpen(false)}>
            Offers
          </a>
        </div>
      )}
    </header>
  );
}
