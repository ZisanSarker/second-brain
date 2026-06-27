import apiClient from './client';
import type { RecentDocument } from '@second-brain/types';

export const recentApi = {
  list: (params?: Record<string, unknown>) =>
    apiClient.get<RecentDocument[]>('/recent/documents', { params }).then((r) => r.data),
};
