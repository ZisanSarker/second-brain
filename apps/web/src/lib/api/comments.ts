import apiClient from './client';

export const commentsApi = {
  create: (data: {
    documentId?: string;
    collectionId?: string;
    generatedContentId?: string;
    content: string;
    parentId?: string;
  }) => apiClient.post('/comments', data).then((r) => r.data),
  list: (entityType: string, entityId: string) =>
    apiClient.get('/comments', { params: { entityType, entityId } }).then((r) => r.data),
  update: (id: string, content: string) =>
    apiClient.patch(`/comments/${id}`, { content }).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/comments/${id}`).then((r) => r.data),
  resolve: (id: string) => apiClient.post(`/comments/${id}/resolve`).then((r) => r.data),
  addReaction: (id: string, type: string) =>
    apiClient.post(`/comments/${id}/reactions`, { type }).then((r) => r.data),
  removeReaction: (id: string, type: string) =>
    apiClient.delete(`/comments/${id}/reactions/${type}`).then((r) => r.data),
};
