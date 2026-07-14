import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

export interface PageSection {
  id: string;
  section_type: string;
  name: string;
  sort_order: number;
  is_visible: boolean;
  background_color?: string | null;
}

export function usePageSections() {
  return useQuery({
    queryKey: queryKeys.pageSections.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_sections')
        .select('id, section_type, name, sort_order, is_visible, background_color')
        .order('sort_order');

      if (error) throw error;
      return (data ?? []) as PageSection[];
    },
    placeholderData: (previousData) => previousData,
  });
}
