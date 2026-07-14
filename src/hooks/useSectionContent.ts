import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

export function useSectionContent<T = Record<string, unknown>>(
  table: string,
  sectionId: string,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.sectionContent.bySectionId(table, sectionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table as 'featured_cards')
        .select('*')
        .eq('section_id', sectionId)
        .order('sort_order');

      if (error) throw error;
      return (data ?? []) as T[];
    },
    enabled: !!sectionId && enabled,
    placeholderData: (previousData) => previousData,
  });
}
