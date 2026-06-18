import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Brand {
  id: string;
  name: string;
  link: string | null;
}

type SearchResult =
  | { id: string; type: 'category'; name: string }
  | { 
      id: string; 
      type: 'subcategory'; 
      name: string; 
      categoryId: string; 
      custom_link?: string | null; 
      custom_link_type?: 'link' | 'iframe' | 'embed_code' | null;
    }
  | {
      id: string;
      type: 'brand';
      name: string;
      subcategoryName: string;
      link: string | null;
    };

export default function HeroSection() {
  const navigate = useNavigate();
  const [mainTextPart1, setMainTextPart1] = useState('');
  const [mainTextPart2, setMainTextPart2] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    let mounted = true;
    
    supabase
      .from('hero_settings')
      .select('*')
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data && mounted) {
          const heroData = data as any;
          const mainText = heroData.main_text || '';
          let part1 = '';
          let part2 = '';
          if (mainText.includes('|||')) {
            const split = mainText.split('|||');
            part1 = split[0] || '';
            part2 = split[1] || '';
          } else {
            part1 = mainText;
          }
          setMainTextPart1(part1);
          setMainTextPart2(part2);
          setWords(heroData.animated_words);
        }
      });
    
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (words.length <= 1) return;

    // Stay visible for 2.5 seconds
    const stayTimeout = setTimeout(() => {
      setIsTransitioning(true);
      // After transitioning, switch to next word
      const transitionTimeout = setTimeout(() => {
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
        setIsTransitioning(false);
      }, 500);
      return () => clearTimeout(transitionTimeout);
    }, 2500);

    return () => clearTimeout(stayTimeout);
  }, [currentWordIndex, words]);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
      setSelectedIndex(-1);
      return;
    }

    let mounted = true;
    const searchTerm = query.trim();
    const timeout = window.setTimeout(async () => {
      if (!mounted) return;

      setIsSearching(true);
      setSearchError(null);
      setSelectedIndex(-1);

      const [{ data: categories, error: categoriesError }, { data: subcategories, error: subcategoriesError }] = await Promise.all([
        supabase
          .from('categories')
          .select('id, name')
          .ilike('name', `%${searchTerm}%`)
          .order('sort_order'),
        (supabase as any)
          .from('subcategories')
          .select('id, category_id, name, custom_link, custom_link_type, subcategory_brands(*)')
          .ilike('name', `%${searchTerm}%`)
          .order('sort_order'),
      ]);

      if (!mounted) return;

      if (categoriesError || subcategoriesError) {
        setSearchError('Unable to search right now.');
        setSearchResults([]);
      } else {
        const categoryResults: SearchResult[] = (categories || []).map((category) => ({
        id: category.id,
        type: 'category' as const,
        name: category.name,
      }));

      const processedResults: SearchResult[] = [];
      
      (subcategories || []).forEach((subcategory) => {
        const brands = subcategory.subcategory_brands || [];
        if (brands.length > 0) {
          // Has brands - add brands instead of subcategory
          brands.forEach((brand: any) => {
            processedResults.push({
              id: brand.id,
              type: 'brand' as const,
              name: brand.name,
              subcategoryName: subcategory.name,
              link: brand.link,
            });
          });
        } else if (subcategory.custom_link) {
          // No brands but has custom link - add subcategory
          processedResults.push({
            id: subcategory.id,
            type: 'subcategory' as const,
            name: subcategory.name,
            categoryId: subcategory.category_id,
            custom_link: subcategory.custom_link,
            custom_link_type: subcategory.custom_link_type,
          });
        }
        // Else: no brands and no custom link - don't add anything
      });

      setSearchResults([...categoryResults, ...processedResults].slice(0, 10));
      }

      setIsSearching(false);
    }, 250);

    return () => {
      mounted = false;
      window.clearTimeout(timeout);
    };
  }, [query]);

  function handleResultClick(result: SearchResult) {
    if (result.type === 'category') {
      navigate(`/category/${result.id}`);
      return;
    }

    if (result.type === 'subcategory') {
      if (result.custom_link) {
        try {
          const url = new URL(result.custom_link);
          window.open(url.toString(), '_blank');
        } catch {
          // Do nothing if URL is invalid and no brands
        }
      } else {
        // No custom link, check if we have brands
        // For search, we already handled brands earlier, so if we're here it's a subcategory with no brands - do nothing
      }
      return;
    }

    if (result.type === 'brand') {
      if (result.link) {
        try {
          const url = new URL(result.link);
          window.open(url.toString(), '_blank');
        } catch {
          // Invalid URL, do nothing
        }
      }
      return;
    }
  }

  function handleSearchButton() {
    if (searchResults.length > 0) {
      handleResultClick(searchResults[0]);
    }
  }

  const suggestedSearches = [
    
  ];

  const getItemsCount = () => {
    if (query.trim()) {
      return searchResults.length;
    }
    return suggestedSearches.length;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const itemCount = getItemsCount();
    if (itemCount === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < itemCount - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      if (query.trim()) {
        handleResultClick(searchResults[selectedIndex]);
      } else {
        setQuery(suggestedSearches[selectedIndex]);
      }
    }
  };

  return (
    <section
      id="hero"
      className="relative py-20 md:py-28 overflow-hidden"
    >
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover opacity-50 -z-10"
      >
        <source src="/videos/header-video.mp4" type="video/mp4" />
      </video>
      <div className="container mx-auto px-4 md:px-8 lg:px-12 text-center">

        {/* HEADING */}
        <h1
          className="mb-4 text-[#1c1c1c] text-[30px] sm:text-[34px] md:text-[44px] leading-[1.3]"
          style={{
            fontFamily: 'Trustpilot Display, Inter, sans-serif',
            fontWeight: 800,
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            hyphens: 'auto',
          }}
        >
          {mainTextPart1}
          {mainTextPart1 && mainTextPart2 && ' '}
          <span style={{ color: '#1d4ed8' }}>{mainTextPart2}</span>
        </h1>


        {/* ANIMATED TEXT */}
        <div
          className="min-h-[50px] flex items-center justify-center relative"
          style={{
            fontFamily: 'Trustpilot Display, Arial, sans-serif',
            fontSize: '24px',
            fontWeight: 60,
            lineHeight: '1.4',
          }}
        >
          {words.length > 1 ? (
            <>
              {/* Current Word - Slides Out Down */}
              <div 
                key={`current-${currentWordIndex}`}
                className="absolute text-[#121511] transition-all duration-500 ease-in-out text-center"
                style={{
                  transform: isTransitioning ? 'translateY(150%)' : 'translateY(0)',
                  opacity: isTransitioning ? 0 : 1,
                  width: '100%',
                  wordWrap: 'break-word',
                }}
              >
                {words[currentWordIndex]}
              </div>
              {/* Next Word - Slides In From Top */}
              <div 
                key={`next-${currentWordIndex}`}
                className="absolute text-[#121511] transition-all duration-500 ease-in-out text-center"
                style={{
                  transform: isTransitioning ? 'translateY(0)' : 'translateY(-150%)',
                  opacity: isTransitioning ? 1 : 0,
                  width: '100%',
                  wordWrap: 'break-word',
                }}
              >
                {words[(currentWordIndex + 1) % words.length]}
              </div>
            </>
          ) : (
            <div className="text-[#121511] text-center w-full" style={{ wordWrap: 'break-word' }}>
              {words[0]}
            </div>
          )}
        </div>

        {/* SEARCH */}
        <div className="mt-10 flex justify-center">
          <div
            className={`w-full max-w-lg md:max-w-2xl rounded-[32px] border bg-white transition-all duration-300 ${
              isSearchActive
                ? 'border-[#6b7cff]'
                : 'border-[#dcd6d1]'
            }`}
            style={{
             boxShadow: isSearchActive
  ? '0 10px 24px rgba(45,89,255,0.18)'
  : '0 2px 6px rgba(28,28,28,0.12), 0 1px 3px rgba(28,28,28,0.08)',


            }}
            onMouseEnter={() => setIsSearchActive(true)}
            onMouseLeave={() => setIsSearchActive(false)}
          >

            {/* INPUT */}
            <div className="relative flex items-center">
              <input
                type="search"
                placeholder="Search company or category"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setIsSearchActive(true)}
                onBlur={() => setTimeout(() => setIsSearchActive(false), 100)}
                onKeyDown={handleKeyDown}
                className="w-full h-[64px] rounded-[32px] bg-transparent pl-6 pr-20 text-[14px] outline-none"
                style={{
                  fontFamily: 'Trustpilot Sans, Poppins, sans-serif',
                  fontWeight: 450,
                }}
              />

              {/* BUTTON */}
              <button
                type="button"
                onClick={handleSearchButton}
                className="absolute right-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#3c57bc] text-white shadow-[0_8px_16px_rgba(47,93,255,0.18)] hover:bg-[#244ce5]"
              >
                <svg
                  width="20"
                  height="20"
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

            {/* DROPDOWN INSIDE */}
            <div
              className={`transition-all duration-300 overflow-hidden ${
                isSearchActive ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="border-t border-[#e5e0d8]" />

              <div className="px-5 py-4">
             {/*    <p className="mb-3 text-sm font-semibold text-[#1c1c1c]">
                  {query.trim() ? 'Search results' : 'Suggested searches'}
                </p> */}
                <div className="space-y-2">
                  {query.trim() ? (
                    isSearching ? (
                      <div className="rounded-lg bg-[#f5f5f5] px-3 py-2 text-sm text-[#61646b]">
                        Searching...
                      </div>
                    ) : searchError ? (
                      <div className="rounded-lg bg-[#fee2e2] px-3 py-2 text-sm text-[#b91c1c]">
                        {searchError}
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="rounded-lg bg-[#f5f5f5] px-3 py-2 text-sm text-[#61646b]">
                        No results found. Try another keyword.
                      </div>
                    ) : (
                      searchResults.map((result, index) => (
                        <button
                          key={`${result.type}-${result.id}`}
                          type="button"
                          onMouseDown={() => setIsSearchActive(true)}
                          onClick={() => handleResultClick(result)}
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
                                <span className="ml-2 text-xs text-[#8a8f9a]">
                                  ({result.subcategoryName})
                                </span>
                              </>
                            ) : (
                              <>{result.name}</>
                            )}
                          </span>
                        </button>
                      ))
                    )
                  ) : (
                    suggestedSearches.map((item, index) => (
                      <button
                        key={item}
                        type="button"
                        onMouseDown={() => setIsSearchActive(true)}
                        onClick={() => setQuery(item)}
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

                        {item}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
