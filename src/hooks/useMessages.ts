'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi, BroadcastMessagePayload } from '@/lib/api/messages';
import { SendMessagePayload, Message, Conversation } from '@/types';
import { soundEffects } from '@/lib/utils/sound';
import { useAuthStore } from '@/stores/useAuthStore';

export function useMessages(conversationId?: string | null) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

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
    onMutate: async (payload: SendMessagePayload) => {
      if (!conversationId) return;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });

      const previousMessages = queryClient.getQueryData(['messages', conversationId]);

      // Create an optimistic message with single tick ("sending")
      const tempId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const optimisticMessage: Message = {
        id: tempId,
        tempId,
        conversationId,
        senderId: user?.id || 'me',
        contentType: payload.contentType,
        text: payload.text,
        attachment: payload.attachment,
        isPinned: false,
        isDeleted: false,
        isBroadcast: false,
        status: 'sending',
        createdAt: new Date().toISOString(),
      };

      // Instantly inject into messages query cache
      queryClient.setQueryData(['messages', conversationId], (oldData: unknown) => {
        const data = (oldData || { results: [], page: 1, limit: 100, totalPages: 1, totalResults: 0 }) as {
          results: Message[];
          page: number;
          limit: number;
          totalPages: number;
          totalResults: number;
        };
        const existingResults = (data.results || []).flat(2).filter((m): m is Message => !!m && typeof m === 'object' && !!m.id);
        return {
          ...data,
          results: [...existingResults, optimisticMessage],
          totalResults: (data.totalResults || existingResults.length) + 1,
        };
      });

      // Update conversations cache with preview
      queryClient.setQueryData(['conversations'], (oldData: unknown) => {
        if (!oldData) return oldData;
        const data = oldData as { results: Conversation[] };
        const existingIndex = (data.results || []).findIndex((c) => c.id === conversationId);
        if (existingIndex > -1) {
          const updatedList = [...data.results];
          const updatedConv: Conversation = {
            ...updatedList[existingIndex],
            lastMessageAt: optimisticMessage.createdAt,
            lastMessage: optimisticMessage,
          };
          updatedList.splice(existingIndex, 1);
          updatedList.unshift(updatedConv);
          return { ...data, results: updatedList };
        }
        return oldData;
      });

      return { previousMessages, tempId };
    },
    onSuccess: (response, _variables, context) => {
      soundEffects.playSent();
      const rawServerMsg = Array.isArray(response) ? response[0] : response;
      if (!rawServerMsg || !rawServerMsg.id) return;

      const confirmedMsg: Message = {
        ...(rawServerMsg as Message),
        status: 'delivered',
      };

      // Swap the optimistic message with the server confirmed message
      queryClient.setQueryData(['messages', conversationId], (oldData: unknown) => {
        if (!oldData) return { results: [confirmedMsg], page: 1, limit: 100, totalPages: 1, totalResults: 1 };
        const data = oldData as { results: Message[]; page: number; limit: number; totalPages: number; totalResults: number };
        const existing = (data.results || []).flat(2).filter((m): m is Message => !!m && typeof m === 'object' && !!m.id);

        const updated = existing.map((m) => {
          if (context?.tempId && m.id === context.tempId) {
            return confirmedMsg;
          }
          return m;
        });

        // If not already in array, push it
        if (!updated.some((m) => m.id === confirmedMsg.id)) {
          updated.push(confirmedMsg);
        }

        return {
          ...data,
          results: updated,
        };
      });

      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (_err, _variables, context) => {
      if (context?.tempId) {
        queryClient.setQueryData(['messages', conversationId], (oldData: unknown) => {
          if (!oldData) return oldData;
          const data = oldData as { results: Message[] };
          return {
            ...data,
            results: (data.results || []).map((m) =>
              m.id === context.tempId ? { ...m, status: 'error' as const } : m
            ),
          };
        });
      }
    },
  });

  const sendMultipleMessagesMutation = useMutation({
    mutationFn: (payloads: SendMessagePayload[]) => {
      if (!conversationId) throw new Error('No active conversation');
      return messagesApi.sendMultipleMessages(conversationId, payloads);
    },
    onMutate: async (payloads: SendMessagePayload[]) => {
      if (!conversationId) return;
      await queryClient.cancelQueries({ queryKey: ['messages', conversationId] });

      const tempMsgs: Message[] = payloads.map((payload, i) => ({
        id: `optimistic-${Date.now()}-${i}`,
        tempId: `optimistic-${Date.now()}-${i}`,
        conversationId,
        senderId: user?.id || 'me',
        contentType: payload.contentType,
        text: payload.text,
        attachment: payload.attachment,
        isPinned: false,
        isDeleted: false,
        isBroadcast: false,
        status: 'sending',
        createdAt: new Date().toISOString(),
      }));

      queryClient.setQueryData(['messages', conversationId], (oldData: unknown) => {
        const data = (oldData || { results: [], page: 1, limit: 100, totalPages: 1, totalResults: 0 }) as {
          results: Message[];
          page: number;
          limit: number;
          totalPages: number;
          totalResults: number;
        };
        const existingResults = (data.results || []).flat(2).filter((m): m is Message => !!m && typeof m === 'object' && !!m.id);
        return {
          ...data,
          results: [...existingResults, ...tempMsgs],
          totalResults: (data.totalResults || existingResults.length) + tempMsgs.length,
        };
      });

      return { tempIds: tempMsgs.map((m) => m.id) };
    },
    onSuccess: (response, _variables, context) => {
      soundEffects.playSent();
      const serverMsgs: Message[] = (Array.isArray(response) ? response : [response])
        .flat(2)
        .filter((m): m is Message => !!m && typeof m === 'object' && !!m.id)
        .map((m) => ({ ...m, status: 'delivered' as const }));

      if (serverMsgs.length === 0) return;

      queryClient.setQueryData(['messages', conversationId], (oldData: unknown) => {
        if (!oldData) return { results: serverMsgs, page: 1, limit: 100, totalPages: 1, totalResults: serverMsgs.length };
        const data = oldData as { results: Message[]; page: number; limit: number; totalPages: number; totalResults: number };
        const existingResults = (data.results || []).flat(2).filter((m): m is Message => !!m && typeof m === 'object' && !!m.id);

        // Remove temp optimistic IDs
        const tempIdSet = new Set(context?.tempIds || []);
        const filtered = existingResults.filter((m) => !tempIdSet.has(m.id));

        return {
          ...data,
          results: [...filtered, ...serverMsgs],
          totalResults: filtered.length + serverMsgs.length,
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
