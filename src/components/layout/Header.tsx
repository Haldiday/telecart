import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, ChevronRight, LogOut, User } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

interface PageSection {
  id: string;
  section_type: string;
  name: string;
  sort_order: number;
  is_visible: boolean;
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

const HEADER_SETTINGS_CACHE_KEY = 'header-settings-cache';

const getDefaultHeaderSettings = (): HeaderSettings => ({
  leave_review_text: 'Leave a Review',
  leave_review_link: '#',
  leave_review_visible: false,
  for_providers_text: 'For Providers',
  for_providers_link: '#',
  for_providers_visible: false,
  sign_in_text: 'Sign In',
  sign_in_visible: true,
  join_text: 'Join',
  join_link: '#',
  join_visible: true,
  submit_button_text: 'Submit',
  submit_button_link: '#',
  submit_button_visible: true,
});

const getCachedHeaderSettings = (): HeaderSettings => {
  if (typeof window === 'undefined') return getDefaultHeaderSettings();

  try {
    const cached = window.localStorage.getItem(HEADER_SETTINGS_CACHE_KEY);
    return cached ? JSON.parse(cached) as HeaderSettings : getDefaultHeaderSettings();
  } catch {
    return getDefaultHeaderSettings();
  }
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [sections, setSections] = useState<PageSection[]>([]);
  const [headerSettings, setHeaderSettings] = useState<HeaderSettings>(() => getCachedHeaderSettings());
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const isMobile = useIsMobile();

  const scrollToSectionElement = (sectionElement: HTMLElement | null) => {
    if (!sectionElement) return;

    console.log('[Header] Scrolling to section:', sectionElement.id);
    const headingElement = sectionElement.querySelector('h2') as HTMLElement | null;
    const targetElement = headingElement || sectionElement;
    
    let headerOffset: number;
    if (isMobile) {
      // Mobile-specific offset using actual header height
      const headerElement = headerRef.current;
      headerOffset = headerElement ? headerElement.getBoundingClientRect().height : 88;
    } else {
      // Desktop/tablet offset unchanged
      headerOffset = 88;
    }
    
    const top = targetElement.getBoundingClientRect().top + window.scrollY - headerOffset;

    window.scrollTo({ top, behavior: 'smooth' });
  };

  const scrollToSection = (sectionId: string) => {
    console.log('[Header] scrollToSection called with sectionId:', sectionId);
    setMegaMenuOpen(false);
    setMobileOpen(false);
    setMobileCategoriesOpen(false);

    const targetId = `section-${sectionId}`;
    console.log('[Header] Looking for element with id:', targetId);
    const sectionElement = document.getElementById(targetId);

    if (location.pathname === '/') {
      if (sectionElement) {
        console.log('[Header] Element found on Home page, scrolling immediately');
        if (isMobile) {
          // On mobile: wait for menu to close first
          setTimeout(() => {
            scrollToSectionElement(sectionElement);
          }, 200);
        } else {
          scrollToSectionElement(sectionElement);
        }
      } else {
        console.log('[Header] Element not found yet, navigating with hash:', targetId);
        navigate(`/#${targetId}`);
      }
      return;
    }

    console.log('[Header] Not on Home page, navigating to /#', targetId);
    navigate(`/#${targetId}`);
  };

  const waitForElementAndScroll = (targetId: string, maxAttempts = 20, interval = 100) => {
    console.log('[Header] waitForElementAndScroll called for:', targetId);
    let attempts = 0;

    const checkElement = () => {
      attempts++;
      const element = document.getElementById(targetId);
      
      if (element) {
        console.log('[Header] Element found after', attempts, 'attempts:', targetId);
        if (isMobile) {
          setTimeout(() => {
            scrollToSectionElement(element);
          }, 200);
        } else {
          scrollToSectionElement(element);
        }
        return;
      }

      if (attempts < maxAttempts) {
        console.log('[Header] Element not found, retrying (attempt', attempts, '/', maxAttempts, ')');
        setTimeout(checkElement, interval);
      } else {
        console.warn('[Header] Element not found after max attempts:', targetId);
      }
    };

    checkElement();
  };

  useEffect(() => {
    if (!location.hash.startsWith('#section-')) return;

    const sectionId = location.hash.replace('#section-', '');
    const targetId = `section-${sectionId}`;
    console.log('[Header] Hash detected, targetId:', targetId);
    waitForElementAndScroll(targetId);
  }, [location.pathname, location.hash]);

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
          const headerData = data as any;
          const nextSettings: HeaderSettings = {
            ...getDefaultHeaderSettings(),
            ...headerData,
            leave_review_visible: Boolean(headerData.leave_review_visible ?? false),
            for_providers_visible: Boolean(headerData.for_providers_visible ?? false),
          } as HeaderSettings;

          setHeaderSettings(nextSettings);
          window.localStorage.setItem(HEADER_SETTINGS_CACHE_KEY, JSON.stringify(nextSettings));
        }
      } catch (err) {
        console.error('Failed to load header settings:', err);
      }
    };

    const loadSections = async () => {
      // Fetch all visible categories type page sections
      const { data: sectionsData } = await supabase
        .from('page_sections')
        .select('id, section_type, name, sort_order, is_visible')
        .eq('section_type', 'categories')
        .order('sort_order');

      if (!sectionsData) {
        setSections([]);
        return;
      }

      setSections(sectionsData.filter(section => section.is_visible !== false));
    };

    loadHeaderSettings();
    loadSections();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('header_sections_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'page_sections' }, () => loadSections())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'header_settings' as any }, () => loadHeaderSettings())
      .subscribe();

    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      // Ignore right-clicks (contextmenu)
      if (event.button === 2) return;

      console.log('[Header] Clicked:', event.target);
      console.log('[Header] Inside mega menu:', menuRef.current?.contains(event.target as Node));
      console.log('[Header] Inside mobile menu:', mobileMenuRef.current?.contains(event.target as Node));

      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        console.log('[Header] Clicked outside, closing mega menu');
        setMegaMenuOpen(false);
      }

      if (mobileOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        console.log('[Header] Clicked outside, closing mobile menu');
        setMobileOpen(false);
        setMobileCategoriesOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      channel.unsubscribe();
    };
  }, []);





  return (
    <header ref={headerRef} className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
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
              className="top-header-link flex items-center gap-1"
              onClick={() => {/* Sign in logic later */}}
            >
              <User className="w-4 h-4" />
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
            <span className="text-2xl md:text-3xl font-bold text-[Black]">Biz<span className="text-[#1d4ed8]">Req</span></span>

          </Link>

          {/* NAVIGATION */}
          <nav className="hidden md:flex items-center gap-8 ml-auto">
            <Link to="/" className="header-nav-link">
              Home
            </Link>

            <div className="static" ref={menuRef}>
              <button
                onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                className="header-nav-link flex items-center gap-1"
              >
              Categories
                <ChevronDown className={`w-4 h-4 transition-transform ${megaMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Mega Menu */}
              {megaMenuOpen && (
                <div 
                  className="absolute top-full right-4 md:right-8 lg:right-10 w-full max-w-[1200px] bg-white border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-50 overflow-hidden"
                >
                  {/* Content */}
                  <div className="px-8 py-6 bg-white overflow-y-auto max-h-[calc(100vh-120px)] custom-scrollbar">
                      <div className="grid grid-cols-4 gap-6">
                        {sections.map((section) => (
                          <div key={section.id} className="border-r border-gray-100 last:border-0 pr-6">
                            <button
                              onClick={(e) => {
                                console.log('[Header] Category button clicked:', section.name);
                                scrollToSection(section.id);
                              }}
                              className="mega-menu-link group block w-full text-left py-2 hover:text-primary transition-colors cursor-pointer relative z-10"
                            >
                              <span className="text-base font-medium">{section.name}</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                </div>
              )}
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

          {/* Mobile Button */}
          <button
            className="md:hidden ml-auto p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div ref={mobileMenuRef} className="md:hidden border-t border-border bg-card px-4 py-6 space-y-6 max-h-[90vh] overflow-y-auto">
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
                    {sections.map(section => (
                      <div key={section.id}>
                        <button
                          onClick={() => scrollToSection(section.id)}
                          className="text-base font-medium text-muted-foreground hover:text-primary hover:bg-muted block w-full text-left py-2.5 px-4 rounded-lg transition-all"
                        >
                          {section.name}
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
                        className="w-full border-2 border-[#17313B] text-[#17313B] py-3 rounded-lg font-bold text-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        onClick={() => {
                          /* Sign in logic */
                          setMobileOpen(false);
                        }}
                      >
                        <User className="w-5 h-5" />
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
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
