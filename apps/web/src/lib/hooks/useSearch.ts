import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchApi } from '@/lib/api/search';

export function useSearch(query: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['search', query, params],
    queryFn: () => searchApi.search(query, params),
    enabled: query.length > 0,
  });
}

export function useSearchSuggestions(prefix: string) {
  return useQuery({
    queryKey: ['search', 'suggestions', prefix],
    queryFn: () => searchApi.suggestions(prefix),
    enabled: prefix.length >= 1,
  });
}

export function useSearchHistory() {
  return useQuery({
    queryKey: ['search', 'history'],
    queryFn: () => searchApi.history(),
  });
}

export function useSaveSearchHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      query: string;
      filters?: Record<string, unknown>;
      resultCount?: number;
    }) => searchApi.saveHistory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search', 'history'] });
    },
  });
}

export function useDeleteSearchHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => searchApi.deleteHistory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search', 'history'] });
    },
  });
}

export function useRelatedDocuments(documentId: string, limit?: number) {
  return useQuery({
    queryKey: ['documents', documentId, 'related', limit],
    queryFn: () => searchApi.relatedDocuments(documentId, limit),
    enabled: !!documentId,
  });
}
