import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sharingApi } from '@/lib/api/sharing';

export function usePermissions(entityType: string, entityId: string) {
  return useQuery({
    queryKey: ['permissions', entityType, entityId],
    queryFn: () => sharingApi.listPermissions(entityType, entityId),
    enabled: !!entityType && !!entityId,
  });
}

export function useCreatePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { entityType: string; entityId: string; userId: string; role: string }) =>
      sharingApi.createPermission(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['permissions'] }),
  });
}

export function useUpdatePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      sharingApi.updatePermission(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['permissions'] }),
  });
}

export function useDeletePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sharingApi.deletePermission(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['permissions'] }),
  });
}

export function useCreateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      documentId?: string;
      collectionId?: string;
      generatedContentId?: string;
      permission?: string;
    }) => sharingApi.createLink(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['share-links'] }),
  });
}

export function useShareLinks(entityType: string, entityId: string) {
  return useQuery({
    queryKey: ['share-links', entityType, entityId],
    queryFn: () => sharingApi.listLinks(entityType, entityId),
    enabled: !!entityType && !!entityId,
  });
}

export function useDeleteLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sharingApi.deleteLink(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['share-links'] }),
  });
}
