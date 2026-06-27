import apiClient from './client';

export const importsApi = {
  website: (data: { url: string; collectionId?: string; folderId?: string }) =>
    apiClient
      .post<{ message: string; jobId: string }>('/imports/website', data)
      .then((r) => r.data),

  github: (data: {
    repository: string;
    branch?: string;
    accessToken?: string;
    collectionId?: string;
    folderId?: string;
  }) =>
    apiClient.post<{ message: string; jobId: string }>('/imports/github', data).then((r) => r.data),

  youtube: (data: {
    videoId: string;
    languages?: string[];
    collectionId?: string;
    folderId?: string;
  }) =>
    apiClient
      .post<{ message: string; jobId: string }>('/imports/youtube', data)
      .then((r) => r.data),
};
