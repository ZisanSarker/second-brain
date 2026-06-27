import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '@/lib/api/documents';

export function useDocuments(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: () => documentsApi.list(params),
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ['documents', id],
    queryFn: () => documentsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof documentsApi.create>[0]) => documentsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof documentsApi.update>[1] }) =>
      documentsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useRestoreDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsApi.restore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      qc.invalidateQueries({ queryKey: ['trash'] });
    },
  });
}

export function usePermanentDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsApi.permanentDelete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] });
      qc.invalidateQueries({ queryKey: ['trash'] });
    },
  });
}

export function useVersions(documentId: string) {
  return useQuery({
    queryKey: ['documents', documentId, 'versions'],
    queryFn: () => documentsApi.getVersions(documentId),
    enabled: !!documentId,
  });
}

export function useVersion(documentId: string, versionId: string) {
  return useQuery({
    queryKey: ['documents', documentId, 'versions', versionId],
    queryFn: () => documentsApi.getVersion(documentId, versionId),
    enabled: !!documentId && !!versionId,
  });
}

export function useAddVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof documentsApi.addVersion>[1];
    }) => documentsApi.addVersion(id, data),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ['documents', variables.id, 'versions'] }),
  });
}

export function useRestoreVersion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, versionId }: { documentId: string; versionId: string }) =>
      documentsApi.restoreVersion(documentId, versionId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useAssignTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tagIds }: { id: string; tagIds: string[] }) =>
      documentsApi.assignTags(id, tagIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function useRemoveTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, tagId }: { documentId: string; tagId: string }) =>
      documentsApi.removeTag(documentId, tagId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents'] }),
  });
}

export function usePresignedUploadUrl() {
  return useMutation({
    mutationFn: (data: Parameters<typeof documentsApi.getPresignedUploadUrl>[0]) =>
      documentsApi.getPresignedUploadUrl(data),
  });
}

export function useDownloadUrl() {
  return useMutation({
    mutationFn: (id: string) => documentsApi.getDownloadUrl(id),
  });
}
