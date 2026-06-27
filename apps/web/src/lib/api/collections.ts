import apiClient from './client';
import type { Collection } from '@second-brain/types';

export const collectionsApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<Collection[]>('/collections', { params }).then((r) => r.data),

  get: (id: string) => apiClient.get<Collection>(`/collections/${id}`).then((r) => r.data),

  create: (data: { name: string; description?: string }) =>
    apiClient.post<Collection>('/collections', data).then((r) => r.data),

  update: (id: string, data: { name?: string; description?: string }) =>
    apiClient.patch<Collection>(`/collections/${id}`, data).then((r) => r.data),

  delete: (id: string) => apiClient.delete(`/collections/${id}`).then((r) => r.data),

  archive: (id: string) =>
    apiClient.post<Collection>(`/collections/${id}/archive`).then((r) => r.data),

  restore: (id: string) =>
    apiClient.post<Collection>(`/collections/${id}/restore`).then((r) => r.data),
};
