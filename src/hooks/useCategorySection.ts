import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fetchCategorySection } from '@/lib/categoryQueries';
import { queryKeys } from '@/lib/queryKeys';

export function useCategorySection(sectionId: string) {
  return useQuery({
    queryKey: queryKeys.categorySection.bySectionId(sectionId),
    queryFn: () => fetchCategorySection(sectionId),
    enabled: !!sectionId,
    placeholderData: (previousData) => previousData,
  });
}
