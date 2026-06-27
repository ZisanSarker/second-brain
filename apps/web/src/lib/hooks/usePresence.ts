import { useQuery, useMutation } from '@tanstack/react-query';
import { presenceApi } from '@/lib/api/presence';

export function useActiveUsers() {
  return useQuery({
    queryKey: ['presence', 'active'],
    queryFn: () => presenceApi.getActiveUsers(),
    refetchInterval: 30000,
  });
}

export function useHeartbeat() {
  return useMutation({
    mutationFn: ({ status, currentDocumentId }: { status: string; currentDocumentId?: string }) =>
      presenceApi.heartbeat(status, currentDocumentId),
  });
}
