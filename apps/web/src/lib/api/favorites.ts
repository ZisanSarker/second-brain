import apiClient from './client';
import type { Favorite } from '@second-brain/types';

export const favoritesApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<Favorite[]>('/favorites', { params }).then((r) => r.data),

  toggle: (entityId: string, entityType: string) =>
    apiClient.post<Favorite>('/favorites/toggle', { entityId, entityType }).then((r) => r.data),

  remove: (id: string) => apiClient.delete(`/favorites/${id}`).then((r) => r.data),

  check: (entityId: string, entityType: string) =>
    apiClient
      .get<{ isFavorited: boolean; favoriteId?: string }>(`/favorites/check`, {
        params: { entityId, entityType },
      })
      .then((r) => r.data),
};
