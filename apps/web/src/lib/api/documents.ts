import apiClient from './client';
import type {
  Document,
  DocumentVersion,
  UploadPresignedUrl,
  PaginatedResponse,
} from '@second-brain/types';

export const documentsApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<PaginatedResponse<Document>>('/documents', { params }).then((r) => r.data),

  get: (id: string) => apiClient.get<Document>(`/documents/${id}`).then((r) => r.data),

  create: (data: Partial<Document> & { title: string; storageKey: string }) =>
    apiClient.post<Document>('/documents', data).then((r) => r.data),

  update: (id: string, data: Partial<Document>) =>
    apiClient.patch<Document>(`/documents/${id}`, data).then((r) => r.data),

  delete: (id: string) => apiClient.delete(`/documents/${id}`).then((r) => r.data),

  restore: (id: string) => apiClient.post<Document>(`/documents/${id}/restore`).then((r) => r.data),

  permanentDelete: (id: string) =>
    apiClient.delete(`/documents/${id}/permanent`).then((r) => r.data),

  addVersion: (
    id: string,
    data: { storageKey: string; fileName: string; fileSize: number; mimeType: string },
  ) => apiClient.post<DocumentVersion>(`/documents/${id}/versions`, data).then((r) => r.data),

  getVersions: (id: string) =>
    apiClient.get<DocumentVersion[]>(`/documents/${id}/versions`).then((r) => r.data),

  getVersion: (documentId: string, versionId: string) =>
    apiClient
      .get<DocumentVersion>(`/documents/${documentId}/versions/${versionId}`)
      .then((r) => r.data),

  restoreVersion: (documentId: string, versionId: string) =>
    apiClient
      .post<Document>(`/documents/${documentId}/versions/${versionId}/restore`)
      .then((r) => r.data),

  assignTags: (id: string, tagIds: string[]) =>
    apiClient.post<Document>(`/documents/${id}/tags`, { tagIds }).then((r) => r.data),

  removeTag: (documentId: string, tagId: string) =>
    apiClient.delete(`/documents/${documentId}/tags/${tagId}`).then((r) => r.data),

  getPresignedUploadUrl: (data: { fileName: string; fileType: string; fileSize: number }) =>
    apiClient.post<UploadPresignedUrl>('/documents/presigned-upload', data).then((r) => r.data),

  getDownloadUrl: (id: string) =>
    apiClient.get<{ url: string }>(`/documents/${id}/download`).then((r) => r.data),

  getProcessingStatus: (id: string) =>
    apiClient
      .get<{
        document: Record<string, unknown>;
        recentJobs: unknown[];
      }>(`/documents/${id}/processing`)
      .then((r) => r.data),

  retryProcessing: (id: string) => apiClient.post(`/documents/${id}/retry`).then((r) => r.data),
};
