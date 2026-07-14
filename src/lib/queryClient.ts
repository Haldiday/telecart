import { QueryClient } from '@tanstack/react-query';

export const defaultQueryOptions = {
  staleTime: 30 * 60 * 1000, // 30 minutes
  gcTime: 60 * 60 * 1000, // 1 hour
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchOnMount: false,
  retry: 1,
} as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: defaultQueryOptions,
  },
});
