
import { useEffect, useState } from 'react';
import { useSearch } from '@/contexts/SearchContext';

export default function HeroSection() {
  const [mainTextPart1, setMainTextPart1] = useState('');
  const [mainTextPart2, setMainTextPart2] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const {
    query,
    setQuery,
    results,
    isSearching,
    searchError,
    isSearchActive,
    setIsSearchActive,
    handleResultClick,
    handleSearchButton,
    showHeaderSearch,
    searchContainerRef,
  } = useSearch();

  useEffect(() => {
    let mounted = true;
    
    import('@/integrations/supabase/client').then(({ supabase }) => {
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
    });
    
    return () => {
      mounted = false;
    };
  }, []);

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
      className="relative py-20 md:py-32 overflow-visible"
    >
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute left-0 right-0 w-full object-cover opacity-50 -z-10"
        style={{
          top: '50px',
          height: 'calc(100% + 28px)',
        }}
      >
        <source src="/videos/header-video.mp4" type="video/mp4" />
      </video>
      <div className="container mx-auto px-4 md:px-8 lg:px-12 text-center">

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


        <div
          className="min-h-[50px] flex items-center justify-center relative"
          style={{
            fontFamily: 'Trustpilot Display, Arial, sans-serif',
            fontSize: '24px',
            fontWeight: 600,
            lineHeight: '1.4',
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

        <div className="mx-auto mt-8 max-w-2xl" ref={!showHeaderSearch ? searchContainerRef : undefined}>
          {!showHeaderSearch && (
            <div className="relative z-[100]">
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setIsSearchActive(true)}
                onBlur={() => setTimeout(() => setIsSearchActive(false), 120)}
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
                        key={`${result.type}-${result.id}`}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleResultClick(result)}
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
          )}
        </div>

      </div>
    </section>
  );
}
