import type { QueryClient } from '@tanstack/react-query';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/queryKeys';

let sharedChannel: RealtimeChannel | null = null;
let subscriberCount = 0;

const CONTENT_TABLES = [
  'featured_cards',
  'offers',
  'ads_2col',
  'ads_3col',
] as const;

function invalidateSectionContent(queryClient: QueryClient, table: string) {
  queryClient.invalidateQueries({
    queryKey: ['sectionContent', table],
    exact: false,
  });
}

export function subscribeToRealtimeInvalidation(queryClient: QueryClient): () => void {
  subscriberCount += 1;

  if (!sharedChannel) {
    let channel = supabase.channel('app_realtime_shared');

    channel = channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'categories' },
      () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.categorySection.all });
      },
    );

    channel = channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'subcategories' },
      () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.categorySection.all });
      },
    );

    channel = channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'subcategory_brands' },
      () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.categorySection.all });
      },
    );

    channel = channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'page_sections' },
      () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.pageSections.all });
        queryClient.invalidateQueries({ queryKey: ['pageSectionMeta'] });
      },
    );

    channel = channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'hero_settings' },
      () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.heroSettings.all });
      },
    );

    channel = channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'header_settings' },
      () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.headerSettings.all });
      },
    );

    for (const table of CONTENT_TABLES) {
      channel = channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => invalidateSectionContent(queryClient, table),
      );
    }

    sharedChannel = channel.subscribe();
  }

  return () => {
    subscriberCount -= 1;
    if (subscriberCount <= 0 && sharedChannel) {
      supabase.removeChannel(sharedChannel);
      sharedChannel = null;
      subscriberCount = 0;
    }
  };
}
