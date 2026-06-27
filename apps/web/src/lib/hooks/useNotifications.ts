import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api/notifications';

export function useNotifications(params?: {
  unreadOnly?: boolean;
  type?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationsApi.list(params),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: 30000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: ['notifications', 'settings'],
    queryFn: () => notificationsApi.getSettings(),
  });
}

export function useUpdateNotificationSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      type,
      data,
    }: {
      type: string;
      data: { enabled?: boolean; email?: boolean; inApp?: boolean };
    }) => notificationsApi.updateSetting(type, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', 'settings'] }),
  });
}
