import { useQuery } from '@tanstack/react-query';
import { searchApi } from '@/lib/api/search';

export function useSearch(query: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['search', query, params],
    queryFn: () => searchApi.search(query, params),
    enabled: query.length > 0,
  });
}

export function useSearchHistory() {
  return useQuery({
    queryKey: ['search', 'history'],
    queryFn: () => searchApi.history(),
  });
}
