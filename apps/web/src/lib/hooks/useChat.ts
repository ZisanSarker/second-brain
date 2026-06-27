import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/lib/api/chat';

export function useConversations(searchQuery?: string) {
  return useQuery({
    queryKey: ['chat', 'conversations', searchQuery],
    queryFn: () => chatApi.listConversations(searchQuery),
  });
}

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: ['chat', 'conversation', id],
    queryFn: () => chatApi.getConversation(id!),
    enabled: !!id,
  });
}

export function useConversationMessages(conversationId: string | undefined, limit?: number) {
  return useQuery({
    queryKey: ['chat', 'messages', conversationId, limit],
    queryFn: () => chatApi.getMessages(conversationId!, limit),
    enabled: !!conversationId,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data?: { title?: string; systemPromptId?: string }) =>
      chatApi.createConversation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });
}

export function useUpdateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { title?: string; pin?: boolean; archive?: boolean };
    }) => chatApi.updateConversation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversation'] });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => chatApi.deleteConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });
}

export function useDuplicateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => chatApi.duplicateConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });
}

export function useChatSuggestions() {
  return useQuery({
    queryKey: ['chat', 'suggestions'],
    queryFn: () => chatApi.getSuggestions(),
  });
}

export function useChatModels() {
  return useQuery({
    queryKey: ['chat', 'models'],
    queryFn: () => chatApi.getModels(),
  });
}
