
import { useEffect, useState, useRef } from 'react';
import { useSearch } from '@/contexts/SearchContext';
import type { SearchResult } from '@/contexts/SearchContext';

interface HeroSectionProps {
  heroSettings?: {
    main_text?: string;
    animated_words?: string[];
  } | null;
}

export default function HeroSection({ heroSettings }: HeroSectionProps) {
  // Parse the hero settings
  const parseHeroSettings = (settings: HeroSectionProps['heroSettings']) => {
    let part1 = '';
    let part2 = '';
    let words: string[] = [];

    if (settings) {
      const mainText = settings.main_text || '';
      if (mainText.includes('|||')) {
        const split = mainText.split('|||');
        part1 = split[0] || '';
        part2 = split[1] || '';
      } else {
        part1 = mainText;
      }
      words = settings.animated_words || [];
    }

    return { part1, part2, words };
  };

  const initialParsed = parseHeroSettings(heroSettings);
  const [mainTextPart1, setMainTextPart1] = useState(initialParsed.part1);
  const [mainTextPart2, setMainTextPart2] = useState(initialParsed.part2);
  const [words, setWords] = useState<string[]>(initialParsed.words);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false); // Start as false, then animate in
  const inputRef = useRef<HTMLInputElement>(null);
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
    heroSearchContainerRef,
    blurTimeoutRef,
  } = useSearch();
  
  // Update state when heroSettings props change and trigger animation
  useEffect(() => {
    if (heroSettings) {
      const parsed = parseHeroSettings(heroSettings);
      setMainTextPart1(parsed.part1);
      setMainTextPart2(parsed.part2);
      setWords(parsed.words);
      // Start the fade-in animation once we have data
      setIsAnimatingIn(true);
    }
  }, [heroSettings]);
  
  // Override handleResultClick for Hero search to keep input focused!
  const handleHeroResultClick = (result: SearchResult) => {
    handleResultClick(result);
    // Keep focus on the input!
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };
  
  // When sticky search becomes hidden, focus Hero's input!
  useEffect(() => {
    console.log('[HeroSection] showMobileStickySearch changed:', showMobileStickySearch);
    if (!showMobileStickySearch) {
      setTimeout(() => {
        console.log('[HeroSection] Focusing hero input');
        inputRef.current?.focus();
      }, 0);
    }
  }, [showMobileStickySearch]);

  useEffect(() => {
    if (words.length <= 1) return;

    const stayTimeout = setTimeout(() => {
      setIsTransitioning(true);
      const transitionTimeout = setTimeout(() => {
        setCurrentWordIndex((prev) => (prev + 1) % words.length);
        setIsTransitioning(false);
      }, 500);
      return () => clearTimeout(transitionTimeout);
    }, 2500);

    return () => clearTimeout(stayTimeout);
  }, [currentWordIndex, words]);

  return (
    <section
      id="hero"
      className="relative pt-2 pb-4 md:py-32 overflow-visible"
    >

      <div className="container mx-auto px-4 md:px-8 lg:px-12 text-center">

        {(mainTextPart1 || mainTextPart2) && (
          <h1
            className="mb-4 pt-20 md:pt-0 text-[#1c1c1c] text-[30px] sm:text-[34px] md:text-[44px] leading-[1.3]"
            style={{
              fontFamily: 'Trustpilot Display, Inter, sans-serif',
              fontWeight: 800,
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              hyphens: 'none',
              wordBreak: 'normal',
              opacity: isAnimatingIn ? 1 : 0,
              transform: isAnimatingIn ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 600ms ease-out, transform 600ms ease-out',
            }}
          >
            {mainTextPart1}
            {mainTextPart1 && mainTextPart2 && (
              <>
                <span className="hidden sm:inline"> </span>
                <br className="sm:hidden" />
              </>
            )}
            <span style={{ color: '#1d4ed8' }}>{mainTextPart2}</span>
          </h1>
        )}


        {words.length > 0 && (
          <div
            className="min-h-[50px] flex items-center justify-center relative"
            style={{
              fontFamily: 'Trustpilot Display, Arial, sans-serif',
              fontSize: '24px',
              fontWeight: 600,
              lineHeight: '1.4',
              opacity: isAnimatingIn ? 1 : 0,
              transform: isAnimatingIn ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 600ms ease-out 200ms, transform 600ms ease-out 200ms',
            }}
          >
          {words.length > 1 ? (
            <>
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
        )}

        <div className="mx-auto mt-8 max-w-2xl" ref={!showHeaderSearch && !showMobileStickySearch ? heroSearchContainerRef : undefined}>
          {!showHeaderSearch && !showMobileStickySearch && (
            <div className="relative">
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => {
                  console.log('[HeroSection] Input changed');
                  setQuery(event.target.value);
                  // If user is typing, make sure isSearchActive is true!
                  if (!isSearchActive && event.target.value.trim()) {
                    setIsSearchActive(true);
                  }
                }}
                onFocus={() => {
                  console.log('[HeroSection] Input focused');
                  if (blurTimeoutRef.current) {
                    clearTimeout(blurTimeoutRef.current);
                    blurTimeoutRef.current = null;
                  }
                  setIsSearchActive(true);
                }}
                onBlur={() => {
                  console.log('[HeroSection] Input blurred');
                  blurTimeoutRef.current = setTimeout(() => setIsSearchActive(false), 120);
                }}
                onKeyDown={handleKeyDown}
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
                    results.map((result, index) => (
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
                        onClick={() => handleHeroResultClick(result)}
                        className={`flex w-full items-center gap-2 px-5 py-2 text-left text-sm ${
                          selectedIndex === index ? 'bg-[#e8e8e8] text-[#1c1c1c]' : 'hover:bg-[#f5f5f5]'
                        }`}
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
          )}
        </div>
      </div>
    </section>
  );
}
