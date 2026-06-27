import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { favoritesApi } from '@/lib/api/favorites';

export function useFavorites(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['favorites', params],
    queryFn: () => favoritesApi.list(params),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entityId, entityType }: { entityId: string; entityType: string }) =>
      favoritesApi.toggle(entityId, entityType),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });
}

export function useRemoveFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => favoritesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });
}

export function useCheckFavorite(entityId: string, entityType: string) {
  return useQuery({
    queryKey: ['favorites', 'check', entityId, entityType],
    queryFn: () => favoritesApi.check(entityId, entityType),
    enabled: !!entityId && !!entityType,
  });
}
