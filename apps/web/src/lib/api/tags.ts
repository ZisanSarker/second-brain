import apiClient from './client';
import type { Tag } from '@second-brain/types';

export const tagsApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<Tag[]>('/tags', { params }).then((r) => r.data),

  create: (data: { name: string; color: string }) =>
    apiClient.post<Tag>('/tags', data).then((r) => r.data),

  update: (id: string, data: { name?: string; color?: string }) =>
    apiClient.patch<Tag>(`/tags/${id}`, data).then((r) => r.data),

  delete: (id: string) => apiClient.delete(`/tags/${id}`).then((r) => r.data),
};
