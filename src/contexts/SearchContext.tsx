import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

type SearchResultType = 'category' | 'subcategory' | 'brand';

interface SearchResult {
  id: string;
  type: SearchResultType;
  name: string;
  categoryId?: string;
  subcategoryName?: string;
  brandName?: string; // For subcategory results that show a brand
  link?: string | null;
  custom_link?: string | null;
  custom_link_type?: 'link' | 'iframe' | 'embed_code' | null;
}

interface SearchContextType {
  query: string;
  setQuery: (q: string) => void;
  results: SearchResult[];
  isSearching: boolean;
  searchError: string | null;
  isSearchActive: boolean;
  setIsSearchActive: (v: boolean) => void;
  selectedIndex: number;
  setSelectedIndex: (v: number) => void;
  handleResultClick: (result: SearchResult) => void;
  handleSearchButton: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  showHeaderSearch: boolean;
  showMobileStickySearch: boolean;
  searchContainerRef: React.MutableRefObject<HTMLDivElement | null>;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [showHeaderSearch, setShowHeaderSearch] = useState(false);
    const [showMobileStickySearch, setShowMobileStickySearch] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const mountedRef = useRef(true);
    const lastRequestRef = useRef<number>(0);
    const requestIdCounterRef = useRef<number>(0);
    const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Scroll detection for header search
  useEffect(() => {
    const handleScroll = () => {
      const scrollThreshold = 100;
      const scrolled = window.scrollY > scrollThreshold;
      
      // Desktop: show header search when scrolled
      // Mobile: never show header search, but show sticky search when scrolled
      if (isMobile) {
        setShowHeaderSearch(false);
        setShowMobileStickySearch(scrolled);
      } else {
        setShowHeaderSearch(scrolled);
        setShowMobileStickySearch(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Call once to set initial state
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  // Search logic with proper request tracking and cleanup
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearchError(null);
      setIsSearching(false);
      setSelectedIndex(-1);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    const searchTerm = query.trim();
    requestIdCounterRef.current += 1;
    const requestId = requestIdCounterRef.current;
    lastRequestRef.current = requestId;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      if (!mountedRef.current || lastRequestRef.current !== requestId) {
        return;
      }

      setIsSearching(true);
      setSearchError(null);
      setSelectedIndex(-1);

      try {
        const [
          { data: categories, error: categoriesError },
          { data: subcategories, error: subcategoriesError },
          { data: brandMatches, error: brandMatchesError },
        ] = await Promise.all([
          supabase
            .from('categories')
            .select('id, name')
            .ilike('name', `%${searchTerm}%`)
            .order('sort_order')
            .limit(20),
          (supabase as any)
            .from('subcategories')
            .select('id, category_id, name, custom_link, custom_link_type, subcategory_brands(*)')
            .ilike('name', `%${searchTerm}%`)
            .order('sort_order')
            .limit(20),
          (supabase as any)
            .from('subcategory_brands')
            .select('id, name, link, subcategory_id, subcategories(name)')
            .ilike('name', `%${searchTerm}%`)
            .order('sort_order')
            .limit(20),
        ]);

        if (!mountedRef.current || lastRequestRef.current !== requestId) {
          return;
        }

        console.log('[SearchContext] searchTerm:', searchTerm);
        console.log('[SearchContext] categories:', categories, 'error:', categoriesError);
        console.log('[SearchContext] subcategories:', subcategories, 'error:', subcategoriesError);
        console.log('[SearchContext] brandMatches:', brandMatches, 'error:', brandMatchesError);
        
        if (categoriesError || subcategoriesError || brandMatchesError) {
          console.error('[SearchContext] errors:', { categoriesError, subcategoriesError, brandMatchesError });
          setSearchError('Unable to search right now.');
          setResults([]);
        } else {
          const categoryResults: SearchResult[] = (categories || []).map((category) => ({
            id: category.id,
            type: 'category' as const,
            name: category.name,
          }));

          const processedResults: SearchResult[] = [];
          const seenResults = new Set<string>();

          const addUniqueResult = (result: SearchResult) => {
            // For subcategory results with a brand, include the brand name in the key to avoid deduping
            let key: string;
            if (result.type === 'subcategory' && result.brandName) {
              key = `${result.type}:${result.id}:${result.brandName}`;
            } else {
              key = `${result.type}:${result.id}`;
            }
            if (!seenResults.has(key)) {
              seenResults.add(key);
              processedResults.push(result);
            }
          };

          (subcategories || []).forEach((subcategory) => {
            const brands = subcategory.subcategory_brands || [];
            if (brands.length > 0) {
              // For subcategories with brands: create one subcategory result per brand
              brands.forEach((brand: any) => {
                addUniqueResult({
                  id: subcategory.id, // Use subcategory's id so clicking navigates to subcategory page
                  type: 'subcategory' as const,
                  name: `${subcategory.name} (${brand.name})`,
                  categoryId: subcategory.category_id,
                  custom_link: subcategory.custom_link,
                  custom_link_type: subcategory.custom_link_type,
                  brandName: brand.name,
                });
              });
            } else {
              // For subcategories with no brands: just add the subcategory
              addUniqueResult({
                id: subcategory.id,
                type: 'subcategory' as const,
                name: subcategory.name,
                categoryId: subcategory.category_id,
                custom_link: subcategory.custom_link,
                custom_link_type: subcategory.custom_link_type,
              });
            }
          });

          const brandResults: SearchResult[] = (brandMatches || []).map((brand: any) => ({
            id: brand.id,
            type: 'brand' as const,
            name: brand.name,
            subcategoryName: brand.subcategories?.name || '',
            link: brand.link,
          }));

          categoryResults.forEach((result) => {
            addUniqueResult(result);
          });
          
          brandResults.forEach((result) => {
            addUniqueResult(result);
          });

          const finalResults = [...processedResults];
          console.log('[SearchContext] finalResults:', finalResults);
          setResults(finalResults);
        }
      } catch (error) {
        if (!mountedRef.current || lastRequestRef.current !== requestId) return;
        setSearchError('Unable to search right now.');
        setResults([]);
      } finally {
        if (mountedRef.current && lastRequestRef.current === requestId) {
          setIsSearching(false);
        }
      }
    }, 150);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [query]);

  // Cleanup effect for mountedRef
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleResultClick = useCallback(
    (result: SearchResult) => {
      setIsSearchActive(false);
      setQuery('');

      if (result.type === 'category') {
        navigate(`/category/${result.id}`);
      } else if (result.type === 'subcategory') {
        if (result.custom_link) {
          try {
            const url = new URL(result.custom_link);
            window.open(url.toString(), '_blank');
          } catch {
            // If custom_link is invalid, navigate to category page
            if (result.categoryId) {
              navigate(`/category/${result.categoryId}`);
            }
          }
        } else if (result.categoryId) {
          navigate(`/category/${result.categoryId}`);
        }
      } else if (result.type === 'brand') {
        if (result.link) {
          try {
            const url = new URL(result.link);
            window.open(url.toString(), '_blank');
          } catch {
            // Do nothing
          }
        }
      }
    },
    [navigate]
  );

  const handleSearchButton = useCallback(() => {
    if (results.length > 0) {
      handleResultClick(results[0]);
    }
  }, [results, handleResultClick]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const itemCount = query.trim() ? results.length : 0;
      if (itemCount === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < itemCount - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        handleResultClick(results[selectedIndex]);
      }
    },
    [query, results, selectedIndex, handleResultClick]
  );

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchActive(false);
        setSelectedIndex(-1);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchActive(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  return (
    <SearchContext.Provider
      value={{
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
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
