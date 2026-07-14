import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

export interface PageSectionMeta {
  heading: string;
  showHeading: boolean;
  backgroundColor: string | null;
}

export function usePageSectionMeta(sectionId: string, defaultHeading: string) {
  return useQuery({
    queryKey: queryKeys.pageSectionMeta(sectionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_sections')
        .select('heading, name, show_heading, background_color')
        .eq('id', sectionId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!sectionId,
    select: (data): PageSectionMeta => ({
      heading: data.heading || data.name || defaultHeading,
      showHeading: data.show_heading !== false,
      backgroundColor: data.background_color,
    }),
    placeholderData: (previousData) => previousData,
  });
}
