import apiClient from './client';

export const searchApi = {
  search: (query: string, params?: Record<string, unknown>) =>
    apiClient.get('/search', { params: { q: query, ...params } }).then((r) => r.data),

  suggestions: (prefix: string) =>
    apiClient.get('/search/suggestions', { params: { q: prefix } }).then((r) => r.data),

  history: () => apiClient.get('/search/history').then((r) => r.data),

  saveHistory: (data: { query: string; filters?: Record<string, unknown>; resultCount?: number }) =>
    apiClient.post('/search/history', data).then((r) => r.data),

  deleteHistory: (id: string) => apiClient.delete(`/search/history/${id}`).then((r) => r.data),

  relatedDocuments: (documentId: string, limit?: number) =>
    apiClient.get(`/documents/${documentId}/related`, { params: { limit } }).then((r) => r.data),
};
