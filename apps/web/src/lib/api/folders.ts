import apiClient from './client';
import type { Folder } from '@second-brain/types';

export const foldersApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<Folder[]>('/folders', { params }).then((r) => r.data),

  get: (id: string) => apiClient.get<Folder>(`/folders/${id}`).then((r) => r.data),

  getTree: () => apiClient.get<Folder[]>('/folders/tree').then((r) => r.data),

  create: (data: { name: string; parentId?: string | null }) =>
    apiClient.post<Folder>('/folders', data).then((r) => r.data),

  update: (id: string, data: { name?: string; parentId?: string | null }) =>
    apiClient.patch<Folder>(`/folders/${id}`, data).then((r) => r.data),

  delete: (id: string) => apiClient.delete(`/folders/${id}`).then((r) => r.data),
};
