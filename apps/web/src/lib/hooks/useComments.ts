import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentsApi } from '@/lib/api/comments';

export function useComments(entityType: string, entityId: string) {
  return useQuery({
    queryKey: ['comments', entityType, entityId],
    queryFn: () => commentsApi.list(entityType, entityId),
    enabled: !!entityType && !!entityId,
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      documentId?: string;
      collectionId?: string;
      generatedContentId?: string;
      content: string;
      parentId?: string;
    }) => commentsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments'] }),
  });
}

export function useUpdateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      commentsApi.update(id, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments'] }),
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => commentsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments'] }),
  });
}

export function useResolveComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => commentsApi.resolve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments'] }),
  });
}

export function useAddReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, type }: { id: string; type: string }) => commentsApi.addReaction(id, type),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments'] }),
  });
}

export function useRemoveReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, type }: { id: string; type: string }) =>
      commentsApi.removeReaction(id, type),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments'] }),
  });
}
