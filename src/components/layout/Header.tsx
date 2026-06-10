import { Link } from 'react-router-dom';
import { Menu, X, ChevronDown, ChevronRight, LogOut } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMSG91Auth } from '@/contexts/MSG91AuthContext';

interface Subcategory {
  id: string;
  name: string;
  link: string | null;
  custom_link?: string | null;
  custom_link_type?: 'link' | 'iframe' | 'embed_code' | null;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  icon_url: string | null;
  bg_color: string;
  subcategories: Subcategory[];
}

interface HeaderSettings {
  leave_review_text: string;
  leave_review_link: string;
  leave_review_visible: boolean;
  for_providers_text: string;
  for_providers_link: string;
  for_providers_visible: boolean;
  sign_in_text: string;
  sign_in_visible: boolean;
  join_text: string;
  join_link: string;
  join_visible: boolean;
  submit_button_text: string;
  submit_button_link: string;
  submit_button_visible: boolean;
}

const detectLinkType = (content: string): 'link' | 'iframe' | 'embed_code' => {
  if (!content) return 'link';
  const trimmed = content.trim();
  if (trimmed.startsWith('<iframe') || (trimmed.includes('<iframe') && trimmed.includes('</iframe>'))) return 'iframe';
  if (trimmed.startsWith('<div') || trimmed.includes('<script')) return 'embed_code';
  return 'link';
};

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [headerSettings, setHeaderSettings] = useState<HeaderSettings>({
    leave_review_text: 'Leave a Review',
    leave_review_link: '#',
    leave_review_visible: true,
    for_providers_text: 'For Providers',
    for_providers_link: '#',
    for_providers_visible: true,
    sign_in_text: 'Sign In',
    sign_in_visible: true,
    join_text: 'Join',
    join_link: '#',
    join_visible: true,
    submit_button_text: 'Submit',
    submit_button_link: '#',
    submit_button_visible: true,
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const { isLoggedIn, logout, checkAuthAndNavigate } = useMSG91Auth();

  useEffect(() => {
    const loadHeaderSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('header_settings' as any)
          .select('*')
          .limit(1)
          .single();
        
        if (error) {
          console.warn('Error fetching header settings, using defaults:', error.message);
          return;
        }
        
        if (data) {
          setHeaderSettings(data);
        }
      } catch (err) {
        console.error('Failed to load header settings:', err);
      }
    };

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
        .order('name');

      if (!cats) {
        setCategories([]);
        return;
      }

      // 3. Fetch subcategories
      const { data: subs } = await supabase
        .from('subcategories')
        .select('*')
        .order('name');

      const merged = cats
        .filter((cat: any) => cat.is_visible !== false)
        .map((category) => ({
          ...category,
          subcategories: (subs || []).filter((sub) => sub.category_id === category.id),
        }));

      setCategories(merged);
    };

    loadHeaderSettings();
    loadCategories();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('header_categories_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'page_sections' }, () => loadCategories())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => loadCategories())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, () => loadCategories())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'header_settings' as any }, () => loadHeaderSettings())
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
    checkAuthAndNavigate(`/category/${categoryId}`);
    setMegaMenuOpen(false);
  };

  const handleSubcategoryClick = (categoryId: string, sub: Subcategory) => {
    const targetPath = `/category/${categoryId}/subcategory/${sub.id}`;
    checkAuthAndNavigate(targetPath);
    
    setMegaMenuOpen(false);
    setMobileOpen(false);
  };



  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      {/* Top Header Bar */}
      <div className="bg-[#17313B] text-white py-2 px-4 md:px-8 lg:px-10 hidden md:block">
        <div className="container mx-auto flex justify-end items-center gap-4 md:gap-8">
          {headerSettings.leave_review_visible && (
            <a 
              href={headerSettings.leave_review_link} 
              className="top-header-link"
            >
              {headerSettings.leave_review_text}
            </a>
          )}
          {headerSettings.for_providers_visible && (
            <a 
              href={headerSettings.for_providers_link} 
              className="top-header-link"
            >
              {headerSettings.for_providers_text}
            </a>
          )}
          {headerSettings.sign_in_visible && (
            <button 
              className="top-header-link"
              onClick={() => {/* Sign in logic later */}}
            >
              {headerSettings.sign_in_text}
            </button>
          )}
          {headerSettings.join_visible && (
            <a 
              href={headerSettings.join_link} 
              className="top-header-link border border-white rounded-full px-5 py-1.5 hover:bg-white hover:text-[#0b212e]"
            >
              {headerSettings.join_text}
            </a>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 lg:px-10 relative">
        <div className="flex items-center h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">

            {/* ICON */}
            

            {/* TEXT */}
            <span className="text-2xl md:text-3xl font-bold text-[black]">Biz<span className="text-[#1d4ed8]">Req</span></span>

          </Link>

          {/* NAVIGATION */}
          <nav className="hidden md:flex items-center gap-8 ml-auto">
            <Link to="/" className="header-nav-link">
              Home
            </Link>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                className="header-nav-link flex items-center gap-1"
              >
              Categories
                <ChevronDown className={`w-4 h-4 transition-transform ${megaMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {headerSettings.submit_button_visible && (
              <a 
                href={headerSettings.submit_button_link}
                className="submit-header-button"
              >
                {headerSettings.submit_button_text}
              </a>
            )}
          </nav>

          {/* Mega Menu */}
          {megaMenuOpen && (
            <div 
              className="absolute top-full left-0 right-0 w-full bg-white border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-50 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Heading */}
              <div className="flex border-b border-gray-100 bg-white px-6">
                
              </div>

              {/* Content */}
              <div className="px-6 py-6 bg-white overflow-y-auto max-h-[calc(100vh-120px)] custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1 pr-2">
                  {categories.map((category) => (
                    <div key={category.id} className="border-r border-gray-100 last:border-0 px-2">
                      <button
                        onClick={() => handleCategoryClick(category.id)}
                        className="mega-menu-link group"
                      >
                        <span>{category.name}</span>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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
        <div className="md:hidden border-t border-border bg-card px-4 py-6 space-y-6 max-h-[90vh] overflow-y-auto">
          <div className="space-y-4">
            {/* 1. Home */}
            <Link to="/" className="block text-lg font-semibold px-4 py-2 hover:bg-muted rounded-lg" onClick={() => setMobileOpen(false)}>
              Home
            </Link>

            {/* 2. Categories (Collapsible) */}
            <div className="space-y-2">
              <button 
                onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                className="w-full flex items-center justify-between px-4 py-2 hover:bg-muted rounded-lg transition-colors"
              >
                <span className="text-lg font-semibold">Categories</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${mobileCategoriesOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {mobileCategoriesOpen && (
                <div className="pl-4 space-y-1 border-l-2 border-border ml-6 mt-1">
                  {categories.map(cat => (
                    <div key={cat.id}>
                      <button
                        onClick={() => {
                          handleCategoryClick(cat.id);
                          setMobileOpen(false);
                        }}
                        className="text-base font-medium text-muted-foreground hover:text-primary hover:bg-muted block w-full text-left py-2.5 px-4 rounded-lg transition-all"
                      >
                        {cat.name}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Leave a Review & For Providers */}
            {headerSettings && (
              <div className="flex flex-col gap-4 pt-2">
                {headerSettings.leave_review_visible && (
                  <a 
                    href={headerSettings.leave_review_link} 
                    className="text-lg font-semibold text-[#0b212e] px-4 py-2 hover:bg-muted rounded-lg" 
                    onClick={() => setMobileOpen(false)}
                  >
                    {headerSettings.leave_review_text}
                  </a>
                )}
                {headerSettings.for_providers_visible && (
                  <a 
                    href={headerSettings.for_providers_link} 
                    className="text-lg font-semibold text-[#0b212e] px-4 py-2 hover:bg-muted rounded-lg" 
                    onClick={() => setMobileOpen(false)}
                  >
                    {headerSettings.for_providers_text}
                  </a>
                )}
                
                {/* 4. Join & Sign In Buttons */}
                <div className="flex flex-col gap-4 mt-6 px-2">
                  {headerSettings.join_visible && (
                    <a 
                      href={headerSettings.join_link} 
                      className="w-full bg-[#e31b1b] text-white text-center py-3.5 rounded-lg font-bold text-lg shadow-sm active:scale-[0.98] transition-all"
                      onClick={() => setMobileOpen(false)}
                    >
                      {headerSettings.join_text}
                    </a>
                  )}
                  {headerSettings.sign_in_visible && (
                    <button 
                      className="w-full border-2 border-[#17313B] text-[#17313B] py-3 rounded-lg font-bold text-lg active:scale-[0.98] transition-all"
                      onClick={() => {
                        /* Sign in logic */
                        setMobileOpen(false);
                      }}
                    >
                      {headerSettings.sign_in_text}
                    </button>
                  )}

                  {/* 5. Submit Button (Mobile) - Moved below Sign In */}
                  {headerSettings.submit_button_visible && (
                    <a 
                      href={headerSettings.submit_button_link}
                      className="block w-full text-center py-3 rounded-lg font-bold text-lg border-2 border-[#17313B] text-[#17313B] active:scale-[0.98] transition-all"
                      onClick={() => setMobileOpen(false)}
                    >
                      {headerSettings.submit_button_text}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Offers (if needed at bottom) */}
            
          </div>
        </div>
      )}
    </header>
  );
}
