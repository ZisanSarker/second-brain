import apiClient from './client';

export const notificationsApi = {
  list: (params?: { unreadOnly?: boolean; type?: string; limit?: number; offset?: number }) =>
    apiClient.get('/notifications', { params }).then((r) => r.data),
  unreadCount: () => apiClient.get('/notifications/unread-count').then((r) => r.data),
  markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => apiClient.patch('/notifications/read-all').then((r) => r.data),
  getSettings: () => apiClient.get('/notifications/settings').then((r) => r.data),
  updateSetting: (type: string, data: { enabled?: boolean; email?: boolean; inApp?: boolean }) =>
    apiClient.patch(`/notifications/settings/${type}`, data).then((r) => r.data),
};
