import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Subcategory {
  id: string;
  name: string;
  link: string | null;
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
  const [activeTab, setActiveTab] = useState<'software' | 'service'>('software');
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

      if (!sections || sections.length === 0) return;

      const sectionIds = sections.map(s => s.id);

      // 2. Fetch categories for these sections
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .in('section_id', sectionIds)
        .order('sort_order');

      if (!cats) return;

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

    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMegaMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/category/${categoryId}`);
    setMegaMenuOpen(false);
  };

  const handleSubcategoryClick = (categoryId: string, subcategoryId: string) => {
    navigate(`/category/${categoryId}/subcategory/${subcategoryId}`);
    setMegaMenuOpen(false);
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
                <div className="absolute top-full right-0 mt-2 w-[90vw] max-w-[1200px] bg-white border border-border shadow-2xl rounded-xl overflow-hidden z-50">
                  {/* Tabs */}
                  <div className="flex border-b border-border">
                    <button
                      onClick={() => setActiveTab('software')}
                      className={`px-8 py-4 text-lg font-semibold transition-colors relative ${
                        activeTab === 'software' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Software Hub
                      {activeTab === 'software' && (
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-primary" />
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTab('service')}
                      className={`px-8 py-4 text-lg font-semibold transition-colors relative ${
                        activeTab === 'service' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Service Hub
                      {activeTab === 'service' && (
                        <div className="absolute bottom-0 left-0 w-full h-1 bg-primary" />
                      )}
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-8 bg-[#f9f8f5]">
                    {activeTab === 'software' ? (
                      <div className="grid grid-cols-4 gap-y-10 gap-x-8 max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
                        {categories.map((category) => (
                          <div key={category.id} className="space-y-4">
                            <button
                              onClick={() => handleCategoryClick(category.id)}
                              className="flex items-center gap-2 group text-left"
                            >
                              <h3 className="text-[#001a41] font-bold text-[16px] group-hover:text-primary transition-colors">
                                {category.name}
                              </h3>
                              <ChevronRight className="w-4 h-4 text-[#001a41] group-hover:text-primary transition-colors" />
                            </button>
                            <ul className="space-y-2">
                              {category.subcategories.slice(0, 6).map((sub) => (
                                <li key={sub.id}>
                                  <button
                                    onClick={() => handleSubcategoryClick(category.id, sub.id)}
                                    className="text-[#4b5563] hover:text-primary text-[14px] text-left transition-colors font-medium"
                                  >
                                    {sub.name}
                                  </button>
                                </li>
                              ))}
                              {category.subcategories.length > 6 && (
                                <li>
                                  <button
                                    onClick={() => handleCategoryClick(category.id)}
                                    className="text-primary font-semibold text-[13px] hover:underline"
                                  >
                                    + {category.subcategories.length - 6} more
                                  </button>
                                </li>
                              )}
                            </ul>
                          </div>
                        ))}
                        <div className="flex items-start justify-center pt-4">
                           <Link
                            to="/#categories"
                            onClick={() => setMegaMenuOpen(false)}
                            className="bg-[#001a41] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#001a41]/90 transition-all shadow-lg hover:shadow-xl active:scale-95"
                          >
                            All Softwares Categories
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-48 text-muted-foreground font-medium">
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
                <div key={cat.id} className="space-y-1">
                  <button
                    onClick={() => {
                      handleCategoryClick(cat.id);
                      setMobileOpen(false);
                    }}
                    className="text-sm font-semibold text-primary block py-1"
                  >
                    {cat.name}
                  </button>
                  <div className="pl-2 space-y-1">
                    {cat.subcategories.slice(0, 3).map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          handleSubcategoryClick(cat.id, sub.id);
                          setMobileOpen(false);
                        }}
                        className="text-xs text-muted-foreground block py-1"
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
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
