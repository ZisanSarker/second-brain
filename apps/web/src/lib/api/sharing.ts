import apiClient from './client';

export const sharingApi = {
  createPermission: (data: {
    entityType: string;
    entityId: string;
    userId: string;
    role: string;
  }) => apiClient.post('/share', data).then((r) => r.data),
  listPermissions: (entityType: string, entityId: string) =>
    apiClient.get('/share', { params: { entityType, entityId } }).then((r) => r.data),
  updatePermission: (id: string, role: string) =>
    apiClient.patch(`/share/${id}`, { role }).then((r) => r.data),
  deletePermission: (id: string) => apiClient.delete(`/share/${id}`).then((r) => r.data),
  createLink: (data: {
    documentId?: string;
    collectionId?: string;
    generatedContentId?: string;
    permission?: string;
    expiresAt?: string;
  }) => apiClient.post('/share/link', data).then((r) => r.data),
  getLink: (token: string) => apiClient.get(`/share/link/${token}`).then((r) => r.data),
  listLinks: (entityType: string, entityId: string) =>
    apiClient.get('/share/links', { params: { entityType, entityId } }).then((r) => r.data),
  deleteLink: (id: string) => apiClient.delete(`/share/link/${id}`).then((r) => r.data),
};
