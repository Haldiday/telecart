import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSearch } from '@/contexts/SearchContext';
import type { SearchResult } from '@/contexts/SearchContext';

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

const HEADER_ICON_FILES = {
  menu: 'menu.png',
  close: 'close.png',
  chevron: 'chevron.png',
  user: 'user.png',
} as const;

const HEADER_SETTINGS_CACHE_KEY = 'header-settings-cache';

const getPublicVideoIconPath = (fileName?: string) =>
  fileName ? `/videos/${fileName}` : '';

const PublicIcon = ({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) return null;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
};

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
  const stickyInputRef = useRef<HTMLInputElement>(null);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const {
    query,
    setQuery,
    results,
    isSearching,
    searchError,
    isSearchActive,
    setIsSearchActive,
    selectedIndex,
    setSelectedIndex,
    handleResultClick,
    handleSearchButton,
    handleKeyDown,
    showHeaderSearch,
    showMobileStickySearch,
    searchContainerRef,
    blurTimeoutRef,
  } = useSearch();
  
  // Override handleResultClick for Header to keep input focused!
  const handleHeaderResultClick = (result: SearchResult) => {
    handleResultClick(result);
    // Keep focus on the appropriate input!
    setTimeout(() => {
      if (showMobileStickySearch) {
        stickyInputRef.current?.focus();
      } else if (showHeaderSearch) {
        desktopInputRef.current?.focus();
      }
    }, 0);
  };
  
  // When sticky search becomes visible, focus the input if it was previously focused!
  useEffect(() => {
    if (showMobileStickySearch && isMobile) {
      setTimeout(() => {
        stickyInputRef.current?.focus();
      }, 0);
    }
  }, [showMobileStickySearch, isMobile]);

  const scrollToSectionElement = (sectionElement: HTMLElement | null) => {
    if (!sectionElement) return;

    console.log('[Header] Scrolling to section:', sectionElement.id);
    const headingElement = sectionElement.querySelector('h2') as HTMLElement | null;
    const targetElement = headingElement || sectionElement;
    
    let headerOffset: number;
    if (isMobile) {
      const headerElement = headerRef.current;
      headerOffset = headerElement ? headerElement.getBoundingClientRect().height : 88;
    } else {
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

    const channel = supabase
      .channel('header_sections_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'page_sections' }, () => loadSections())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'header_settings' as any }, () => loadHeaderSettings())
      .subscribe();

    const handleClickOutside = (event: MouseEvent) => {
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
  }, [mobileOpen]);

  // Cleanup blur timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <header 
        ref={headerRef} 
        className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-sm"
      >
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
              aria-label={headerSettings.sign_in_text}
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

      <div className="container mx-auto px-4 md:px-8 lg:px-10 relative overflow-visible">
        <div className="flex items-center h-16">
          <Link to="/" className="flex items-center">
            <span className="text-2xl md:text-3xl font-bold text-[Black]">Biz<span className="text-[#1d4ed8]">Req</span></span>
          </Link>

          <div className="hidden md:flex flex-1 items-center justify-center px-3 lg:px-4">
            {showHeaderSearch && (
              <div className="relative w-full max-w-sm xl:max-w-lg" ref={searchContainerRef}>
                <div
                  className={`w-full rounded-[32px] border bg-white transition-all duration-300 ${
                    isSearchActive ? 'border-[#6b7cff]' : 'border-[#dcd6d1]'
                  }`}
                >
                  <div className="relative flex items-center">
                    <input
                      ref={desktopInputRef}
                      type="search"
                      placeholder="Search brand or category"
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        // If user is typing, make sure isSearchActive is true!
                        if (!isSearchActive && event.target.value.trim()) {
                          setIsSearchActive(true);
                        }
                      }}
                      onFocus={() => {
                        if (blurTimeoutRef.current) {
                          clearTimeout(blurTimeoutRef.current);
                          blurTimeoutRef.current = null;
                        }
                        setIsSearchActive(true);
                      }}
                      onBlur={() => {
                        blurTimeoutRef.current = setTimeout(() => setIsSearchActive(false), 100);
                      }}
                      onKeyDown={handleKeyDown}
                      className="w-full h-[42px] rounded-[32px] bg-transparent pl-5 pr-14 text-[14px] outline-none"
                      style={{
                        fontFamily: 'Trustpilot Sans, Poppins, sans-serif',
                        fontWeight: 450,
                      }}
                    />

                    <button
                      type="button"
                      onClick={handleSearchButton}
                      className="absolute right-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#3c57bc] text-white hover:bg-[#244ce5]"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="11" cy="11" r="7" />
                        <line x1="16.65" y1="16.65" x2="21" y2="21" />
                      </svg>
                    </button>
                  </div>

                  <div
                    className={`absolute left-0 right-0 top-full z-[60] mt-1 overflow-hidden rounded-none border-0 bg-transparent shadow-none transition-all duration-300 ${
                      isSearchActive && query.trim() ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="max-h-[360px] overflow-y-auto px-3 py-3 bg-white border border-gray-200 rounded-b-[32px] shadow-lg">
                      <div className="space-y-1.5">
                        {query.trim() ? (
                          isSearching ? (
                            <div className="rounded-lg bg-[#f5f5f5] px-3 py-2 text-sm text-[#61646b]">
                              Searching...
                            </div>
                          ) : searchError ? (
                            <div className="rounded-lg bg-[#fee2e2] px-3 py-2 text-sm text-[#b91c1c]">
                              {searchError}
                            </div>
                          ) : results.length === 0 ? (
                            <div className="rounded-lg bg-[#f5f5f5] px-3 py-2 text-sm text-[#61646b]">
                              No results found. Try another keyword.
                            </div>
                          ) : (
                            results.map((result, index) => (
                              <button
                                key={`${result.type}-${result.id}${result.brandName ? `-${result.brandName}` : ''}`}
                                type="button"
                                onMouseDown={() => {
                                  if (blurTimeoutRef.current) {
                                    clearTimeout(blurTimeoutRef.current);
                                    blurTimeoutRef.current = null;
                                  }
                                  setIsSearchActive(true);
                                }}
                                onClick={() => handleHeaderResultClick(result)}
                                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-left text-sm ${
                                  selectedIndex === index ? 'bg-[#e8e8e8] text-[#1c1c1c]' : 'text-[#61646b] hover:bg-[#f5f5f5]'
                                }`}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <circle cx="11" cy="11" r="7" />
                                  <line x1="16.65" y1="16.65" x2="21" y2="21" />
                                </svg>

                                <span className="flex-1">
                                  {result.type === 'brand' ? (
                                    <>
                                      {result.name}
                                      {result.subcategoryName && (
                                        <span className="ml-2 text-xs text-[#8a8f9a]">
                                          ({result.subcategoryName})
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <>{result.name}</>
                                  )}
                                </span>
                              </button>
                            ))
                          )
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <nav className="hidden md:flex items-center gap-12 ml-auto pr-6 lg:pr-10">
            <Link to="/" className="header-nav-link">
              Home
            </Link>

            <div className="static" ref={menuRef}>
              <button
                onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                className="header-nav-link flex items-center gap-1"
              >
              Categories
                <PublicIcon
                  src={getPublicVideoIconPath(HEADER_ICON_FILES.chevron)}
                  alt=""
                  className={`w-4 h-4 transition-transform ${megaMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {megaMenuOpen && (
                <div 
                  className="absolute top-full right-4 md:right-8 lg:right-10 w-full max-w-[1200px] bg-white border border-gray-200 shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-[300] overflow-hidden"
                >
                  <div className="px-8 py-6 bg-white overflow-y-auto max-h-[calc(100vh-120px)] custom-scrollbar">
                      <div className="grid grid-cols-5 gap-1">
                        {sections.map((section) => (
                          <div key={section.id} className="border-r border-gray-100 last:border-0 pr-2">
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

          <button
            type="button"
            className="md:hidden ml-auto relative z-[70] inline-flex h-11 w-11 items-center justify-center rounded-md border border-border/60 bg-background/95 text-foreground shadow-sm transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setMobileOpen(!mobileOpen)}
            onMouseDown={(e) => e.stopPropagation()}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {mobileOpen && (
          <div ref={mobileMenuRef} className="md:hidden border-t border-border bg-card px-4 py-6 space-y-6 max-h-[90vh] overflow-y-auto relative z-[60]">
            <div className="space-y-4">
              <Link to="/" className="block text-lg font-semibold px-4 py-2 hover:bg-muted rounded-lg" onClick={() => setMobileOpen(false)}>
                Home
              </Link>

              <div className="space-y-2">
                <button 
                  onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                  className="w-full flex items-center justify-between px-4 py-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <span className="text-lg font-semibold">Categories</span>
                  <PublicIcon
                    src={getPublicVideoIconPath(HEADER_ICON_FILES.chevron)}
                    alt=""
                    className={`w-5 h-5 transition-transform ${mobileCategoriesOpen ? 'rotate-180' : ''}`}
                  />
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
                  
                  <div className="flex flex-col gap-4 mt-6 px-2">
                    {headerSettings.join_visible && (
                      <a 
                        href={headerSettings.join_link} 
                        className="w-full bg-[#1d4ed8] text-white text-center py-3.5 rounded-lg font-bold text-lg shadow-sm active:scale-[0.98] transition-all"
                        onClick={() => setMobileOpen(false)}
                      >
                        {headerSettings.join_text}
                      </a>
                    )}
                    {headerSettings.sign_in_visible && (
                      <button 
                        className="w-full border-2 border-[#17313B] text-[#17313B] py-3 rounded-lg font-bold text-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        onClick={() => {
                          setMobileOpen(false);
                        }}
                      >
                        <PublicIcon
                          src={getPublicVideoIconPath(HEADER_ICON_FILES.user)}
                          alt=""
                          className="w-5 h-5"
                        />
                        {headerSettings.sign_in_text}
                      </button>
                    )}

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

    {/* Mobile sticky search bar */}
    {showMobileStickySearch && (
      <div className="md:hidden fixed left-0 right-0 top-16 z-40 bg-card border-b border-border px-4 py-3">
        <div className="relative" ref={searchContainerRef}>
          <input
            ref={stickyInputRef}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              // If user is typing, make sure isSearchActive is true!
              if (!isSearchActive && event.target.value.trim()) {
                setIsSearchActive(true);
              }
            }}
            onFocus={() => {
              if (blurTimeoutRef.current) {
                clearTimeout(blurTimeoutRef.current);
                blurTimeoutRef.current = null;
              }
              setIsSearchActive(true);
            }}
            onBlur={() => {
              blurTimeoutRef.current = setTimeout(() => setIsSearchActive(false), 120);
            }}
            placeholder="Search brand or category"
            className="w-full rounded-full border border-[#dcd6d1] bg-white px-5 pr-14 py-3 text-sm outline-none focus:border-[#6b7cff]"
          />
          <button
            type="button"
            onClick={handleSearchButton}
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#3c57bc] text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <line x1="16.65" y1="16.65" x2="21" y2="21" />
            </svg>
          </button>
          {isSearchActive && query.trim() && (
            <div className="absolute left-0 right-0 top-full z-[200] mt-2 max-h-80 overflow-y-auto rounded-b-[16px] rounded-t-none border border-[#dcd6d1] bg-white shadow-lg">
              {isSearching ? (
                <div className="px-5 py-2 text-sm text-[#61646b]">Searching...</div>
              ) : searchError ? (
                <div className="px-5 py-2 text-sm text-[#b91c1c]">{searchError}</div>
              ) : results.length === 0 ? (
                <div className="px-5 py-2 text-sm text-[#61646b]">No results found.</div>
              ) : (
                results.map((result) => (
                <button
                  key={`${result.type}-${result.id}${result.brandName ? `-${result.brandName}` : ''}`}
                  type="button"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    if (blurTimeoutRef.current) {
                      clearTimeout(blurTimeoutRef.current);
                      blurTimeoutRef.current = null;
                    }
                    setIsSearchActive(true);
                  }}
                  onClick={() => handleHeaderResultClick(result)}
                  className="flex w-full items-center gap-2 px-5 py-2 text-left text-sm hover:bg-[#f5f5f5]"
                >
                    <span>{result.name}</span>
                    {result.type === 'brand' && result.subcategoryName && (
                      <span className="text-xs text-[#8a8f9a]">({result.subcategoryName})</span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    )}
    </>
  );
}
