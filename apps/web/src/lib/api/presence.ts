import apiClient from './client';

export const presenceApi = {
  heartbeat: (status: string, currentDocumentId?: string) =>
    apiClient.post('/presence/heartbeat', { status, currentDocumentId }).then((r) => r.data),
  getActiveUsers: () => apiClient.get('/presence/workspace').then((r) => r.data),
  markOffline: () => apiClient.post('/presence/offline').then((r) => r.data),
};
