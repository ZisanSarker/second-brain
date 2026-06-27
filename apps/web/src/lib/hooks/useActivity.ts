import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { activityApi } from '@/lib/api/activity';

export function useActivity(params?: {
  type?: string;
  entityType?: string;
  entityId?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['activity', params],
    queryFn: () => activityApi.list(params),
  });
}

export function useWorkspaceSummary() {
  return useQuery({
    queryKey: ['activity', 'workspace-summary'],
    queryFn: () => activityApi.workspaceSummary(),
  });
}
