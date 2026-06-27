import { useQuery } from '@tanstack/react-query';
import { auditApi } from '@/lib/api/audit';

export function useAuditLog(params?: {
  action?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['audit', params],
    queryFn: () => auditApi.list(params),
  });
}
