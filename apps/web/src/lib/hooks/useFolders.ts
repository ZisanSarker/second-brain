import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { foldersApi } from '@/lib/api/folders';

export function useFolders(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['folders', params],
    queryFn: () => foldersApi.list(params),
  });
}

export function useFolder(id: string) {
  return useQuery({
    queryKey: ['folders', id],
    queryFn: () => foldersApi.get(id),
    enabled: !!id,
  });
}

export function useFolderTree() {
  return useQuery({
    queryKey: ['folders', 'tree'],
    queryFn: () => foldersApi.getTree(),
  });
}

export function useCreateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof foldersApi.create>[0]) => foldersApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['folders'] }),
  });
}

export function useUpdateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof foldersApi.update>[1] }) =>
      foldersApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['folders'] }),
  });
}

export function useDeleteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => foldersApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['folders'] }),
  });
}
