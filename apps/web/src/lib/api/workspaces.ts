import apiClient from './client';
import type { Workspace, WorkspaceMember, Invitation } from '@second-brain/types';

export const workspacesApi = {
  list: () => apiClient.get<Workspace[]>('/workspaces').then((r) => r.data),

  get: (id: string) => apiClient.get<Workspace>(`/workspaces/${id}`).then((r) => r.data),

  create: (data: { name: string; slug?: string }) =>
    apiClient.post<Workspace>('/workspaces', data).then((r) => r.data),

  update: (id: string, data: { name?: string; slug?: string }) =>
    apiClient.patch<Workspace>(`/workspaces/${id}`, data).then((r) => r.data),

  delete: (id: string) => apiClient.delete(`/workspaces/${id}`).then((r) => r.data),

  getMembers: (workspaceId: string) =>
    apiClient.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`).then((r) => r.data),

  getMyMembership: (workspaceId: string) =>
    apiClient.get(`/workspaces/${workspaceId}/members/me`).then((r) => r.data),

  updateMemberRole: (workspaceId: string, memberId: string, role: string) =>
    apiClient.patch(`/workspaces/${workspaceId}/members/${memberId}/role`, {
      role,
    }),

  removeMember: (workspaceId: string, memberId: string) =>
    apiClient.delete(`/workspaces/${workspaceId}/members/${memberId}`),

  getInvitations: (workspaceId: string) =>
    apiClient.get<Invitation[]>(`/workspaces/${workspaceId}/invitations`).then((r) => r.data),

  createInvitation: (workspaceId: string, data: { email: string; role?: string }) =>
    apiClient.post(`/workspaces/${workspaceId}/invitations`, data).then((r) => r.data),

  revokeInvitation: (workspaceId: string, invitationId: string) =>
    apiClient.delete(`/workspaces/${workspaceId}/invitations/${invitationId}`),

  getInvitation: (token: string) => apiClient.get(`/invitations/${token}`).then((r) => r.data),

  acceptInvitation: (token: string) =>
    apiClient.post(`/invitations/${token}/accept`).then((r) => r.data),

  rejectInvitation: (token: string) =>
    apiClient.post(`/invitations/${token}/reject`).then((r) => r.data),

  getSettings: (workspaceId: string) =>
    apiClient.get(`/workspaces/${workspaceId}/settings`).then((r) => r.data),

  updateSettings: (workspaceId: string, data: Record<string, unknown>) =>
    apiClient.patch(`/workspaces/${workspaceId}/settings`, data).then((r) => r.data),
};
