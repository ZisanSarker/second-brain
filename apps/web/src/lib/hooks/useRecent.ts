import { useQuery } from '@tanstack/react-query';
import { recentApi } from '@/lib/api/recent';

export function useRecentDocuments(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['recent', params],
    queryFn: () => recentApi.list(params),
  });
}
