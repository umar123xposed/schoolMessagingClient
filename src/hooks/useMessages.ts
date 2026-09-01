'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi, BroadcastMessagePayload } from '@/lib/api/messages';
import { SendMessagePayload, Message } from '@/types';
import { soundEffects } from '@/lib/utils/sound';

export function useMessages(conversationId?: string | null) {
  const queryClient = useQueryClient();

  const messagesQuery = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => messagesApi.getMessages(conversationId!, { limit: 100, sortBy: 'createdAt:asc' }),
    enabled: !!conversationId,
    staleTime: 1000 * 60 * 2,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (payload: SendMessagePayload) => {
      if (!conversationId) throw new Error('No active conversation');
      return messagesApi.sendMessage(conversationId, payload);
    },
    onSuccess: (response) => {
      soundEffects.playSent();
      const newMsgs: Message[] = Array.isArray(response)
        ? response.flat(2).filter((m): m is Message => !!m && typeof m === 'object' && !!m.id)
        : (response && typeof response === 'object' && 'id' in response ? [response as Message] : []);

      if (newMsgs.length === 0) return;

      queryClient.setQueryData(['messages', conversationId], (oldData: unknown) => {
        if (!oldData) return { results: newMsgs, page: 1, limit: 100, totalPages: 1, totalResults: newMsgs.length };
        const data = oldData as { results: Message[]; page: number; limit: number; totalPages: number; totalResults: number };
        const existingResults = (data.results || []).flat(2).filter((m): m is Message => !!m && typeof m === 'object' && !!m.id);
        const existingIds = new Set(existingResults.map((m) => m.id));
        const toAdd = newMsgs.filter((m) => !existingIds.has(m.id));

        return {
          ...data,
          results: [...existingResults, ...toAdd],
          totalResults: (data.totalResults || existingResults.length) + toAdd.length,
        };
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const sendMultipleMessagesMutation = useMutation({
    mutationFn: (payloads: SendMessagePayload[]) => {
      if (!conversationId) throw new Error('No active conversation');
      return messagesApi.sendMultipleMessages(conversationId, payloads);
    },
    onSuccess: (response) => {
      soundEffects.playSent();
      const newMsgs: Message[] = Array.isArray(response)
        ? response.flat(2).filter((m): m is Message => !!m && typeof m === 'object' && !!m.id)
        : (response && typeof response === 'object' && 'id' in response ? [response as Message] : []);

      if (newMsgs.length === 0) return;

      queryClient.setQueryData(['messages', conversationId], (oldData: unknown) => {
        if (!oldData) return { results: newMsgs, page: 1, limit: 100, totalPages: 1, totalResults: newMsgs.length };
        const data = oldData as { results: Message[]; page: number; limit: number; totalPages: number; totalResults: number };
        const existingResults = (data.results || []).flat(2).filter((m): m is Message => !!m && typeof m === 'object' && !!m.id);
        const existingIds = new Set(existingResults.map((m) => m.id));
        const toAdd = newMsgs.filter((m) => !existingIds.has(m.id));

        return {
          ...data,
          results: [...existingResults, ...toAdd],
          totalResults: (data.totalResults || existingResults.length) + toAdd.length,
        };
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: (payload: BroadcastMessagePayload) => messagesApi.broadcastMessage(payload),
    onSuccess: () => {
      soundEffects.playSent();
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      if (conversationId) {
        queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      }
    },
  });

  const pinMessageMutation = useMutation({
    mutationFn: ({ messageId, isPinned }: { messageId: string; isPinned: boolean }) =>
      messagesApi.pinMessage(messageId, isPinned),
    onSuccess: (updatedMsg) => {
      queryClient.setQueryData(['messages', conversationId], (oldData: unknown) => {
        if (!oldData) return oldData;
        const data = oldData as { results: Message[] };
        return {
          ...data,
          results: data.results.map((m) => (m.id === updatedMsg.id ? updatedMsg : m)),
        };
      });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => messagesApi.deleteMessage(messageId),
    onSuccess: (deletedMsg) => {
      queryClient.setQueryData(['messages', conversationId], (oldData: unknown) => {
        if (!oldData) return oldData;
        const data = oldData as { results: Message[] };
        return {
          ...data,
          results: data.results.map((m) => (m.id === deletedMsg.id ? deletedMsg : m)),
        };
      });
    },
  });

  return {
    messages: messagesQuery.data?.results || [],
    isLoading: messagesQuery.isLoading,
    isError: messagesQuery.isError,
    refetch: messagesQuery.refetch,
    sendMessage: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
    sendMultipleMessages: sendMultipleMessagesMutation.mutateAsync,
    isSendingMultiple: sendMultipleMessagesMutation.isPending,
    broadcastMessage: broadcastMutation.mutateAsync,
    isBroadcasting: broadcastMutation.isPending,
    pinMessage: (messageId: string, isPinned: boolean) =>
      pinMessageMutation.mutateAsync({ messageId, isPinned }),
    isPinning: pinMessageMutation.isPending,
    deleteMessage: (messageId: string) => deleteMessageMutation.mutateAsync(messageId),
    isDeleting: deleteMessageMutation.isPending,
  };
}
