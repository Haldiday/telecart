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

type SearchResultType = 'category' | 'subcategory' | 'brand';

interface SearchResult {
  id: string;
  type: SearchResultType;
  name: string;
  categoryId?: string;
  subcategoryName?: string;
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
  searchContainerRef: React.MutableRefObject<HTMLDivElement | null>;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showHeaderSearch, setShowHeaderSearch] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  // Scroll detection for header search
  useEffect(() => {
    const handleScroll = () => {
      const scrollThreshold = 100;
      setShowHeaderSearch(window.scrollY > scrollThreshold);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Search logic (EXACTLY as original Header)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSearchError(null);
      setIsSearching(false);
      setSelectedIndex(-1);
      return;
    }

    const searchTerm = query.trim();
    const timeout = setTimeout(async () => {
      if (!mountedRef.current) return;

      setIsSearching(true);
      setSearchError(null);
      setSelectedIndex(-1);

      const [
        { data: categories, error: categoriesError },
        { data: subcategories, error: subcategoriesError },
        { data: brandMatches, error: brandMatchesError },
      ] = await Promise.all([
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
        (supabase as any)
          .from('subcategory_brands')
          .select('id, name, link, subcategory_id, subcategories(name)')
          .ilike('name', `%${searchTerm}%`)
          .order('sort_order'),
      ]);

      if (!mountedRef.current) return;

      if (categoriesError || subcategoriesError || brandMatchesError) {
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
          const key = `${result.type}:${result.id}`;
          if (!seenResults.has(key)) {
            seenResults.add(key);
            processedResults.push(result);
          }
        };

        (subcategories || []).forEach((subcategory) => {
          const brands = subcategory.subcategory_brands || [];
          if (brands.length > 0) {
            brands.forEach((brand: any) => {
              addUniqueResult({
                id: brand.id,
                type: 'brand' as const,
                name: brand.name,
                subcategoryName: subcategory.name,
                link: brand.link,
              });
            });
          } else {
            // Always add the subcategory itself regardless of custom_link
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

        brandResults.forEach((result) => {
          addUniqueResult(result);
        });

        setResults([...categoryResults, ...processedResults]);
      }

      setIsSearching(false);
    }, 250);

    return () => {
      clearTimeout(timeout);
    };
  }, [query]);

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
