import apiClient from './client';
import type { Document } from '@second-brain/types';

export const trashApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<Document[]>('/trash', { params }).then((r) => r.data),

  restoreDocument: (id: string) =>
    apiClient.post<Document>(`/trash/${id}/restore`).then((r) => r.data),

  permanentDeleteDocument: (id: string) => apiClient.delete(`/trash/${id}`).then((r) => r.data),

  emptyTrash: () => apiClient.delete('/trash').then((r) => r.data),
};
