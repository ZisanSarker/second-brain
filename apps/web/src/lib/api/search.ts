import apiClient from './client';

export const searchApi = {
  search: (query: string, params?: Record<string, unknown>) =>
    apiClient.get('/search', { params: { q: query, ...params } }).then((r) => r.data),

  history: () => apiClient.get('/search/history').then((r) => r.data),
};
