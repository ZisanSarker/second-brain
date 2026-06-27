import apiClient from './client';
import type { AuthResponse, User } from '@second-brain/types';

export const authApi = {
  register: (data: { email: string; password: string; name?: string }) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    apiClient
      .post<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
        refreshToken,
      })
      .then((r) => r.data),

  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }).then((r) => r.data),

  logoutAll: () => apiClient.post('/auth/logout-all').then((r) => r.data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.post('/auth/change-password', data).then((r) => r.data),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }).then((r) => r.data),

  getProfile: () => apiClient.get<User>('/users/me').then((r) => r.data),

  updateProfile: (data: { name?: string; username?: string; bio?: string; avatarUrl?: string }) =>
    apiClient.patch<User>('/users/me', data).then((r) => r.data),

  getSettings: () => apiClient.get('/users/me/settings').then((r) => r.data),

  updateSettings: (data: Record<string, unknown>) =>
    apiClient.patch('/users/me/settings', data).then((r) => r.data),
};
