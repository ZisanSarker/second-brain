import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trashApi } from '@/lib/api/trash';

export function useTrash(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['trash', params],
    queryFn: () => trashApi.list(params),
  });
}

export function useRestoreTrashDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => trashApi.restoreDocument(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trash'] });
      qc.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}

export function usePermanentDeleteTrashDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => trashApi.permanentDeleteDocument(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trash'] }),
  });
}

export function useEmptyTrash() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => trashApi.emptyTrash(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trash'] });
      qc.invalidateQueries({ queryKey: ['documents'] });
    },
  });
}
