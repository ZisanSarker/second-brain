import apiClient from './client';

export const activityApi = {
  list: (params?: {
    type?: string;
    entityType?: string;
    entityId?: string;
    limit?: number;
    offset?: number;
  }) => apiClient.get('/activity', { params }).then((r) => r.data),
  workspaceSummary: () => apiClient.get('/activity/workspace-summary').then((r) => r.data),
};
