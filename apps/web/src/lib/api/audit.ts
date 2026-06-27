import apiClient from './client';

export const auditApi = {
  list: (params?: {
    action?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }) => apiClient.get('/audit', { params }).then((r) => r.data),
};
