import apiClient from './client';

export const teamsApi = {
  create: (data: { name: string; description?: string }) =>
    apiClient.post('/teams', data).then((r) => r.data),
  list: () => apiClient.get('/teams').then((r) => r.data),
  update: (id: string, data: { name?: string; description?: string }) =>
    apiClient.patch(`/teams/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/teams/${id}`).then((r) => r.data),
  addMember: (id: string, userId: string, role?: string) =>
    apiClient.post(`/teams/${id}/members`, { userId, role }).then((r) => r.data),
  removeMember: (id: string, memberId: string) =>
    apiClient.delete(`/teams/${id}/members/${memberId}`).then((r) => r.data),
};
