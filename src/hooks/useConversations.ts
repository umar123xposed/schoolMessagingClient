'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationsApi, CreateGroupPayload, UpdateGroupPayload } from '@/lib/api/conversations';
import { useAuthStore } from '@/stores/useAuthStore';
import { Conversation } from '@/types';

export function useConversations() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  const conversationsQuery = useQuery({
    queryKey: ['conversations'],
    queryFn: () => conversationsApi.getConversations({ limit: 100, sortBy: 'lastMessageAt:desc' }),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const createGroupMutation = useMutation({
    mutationFn: (payload: CreateGroupPayload) => conversationsApi.createGroup(payload),
    onSuccess: (newGroup) => {
      queryClient.setQueryData(['conversations'], (oldData: unknown) => {
        if (!oldData) return { results: [newGroup] };
        const data = oldData as { results: Conversation[] };
        return {
          ...data,
          results: [newGroup, ...data.results],
        };
      });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateGroupPayload }) =>
      conversationsApi.updateGroup(id, payload),
    onSuccess: (updatedGroup) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.setQueryData(['conversation', updatedGroup.id], updatedGroup);
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (id: string) => conversationsApi.deleteGroup(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(['conversations'], (oldData: unknown) => {
        if (!oldData) return oldData;
        const data = oldData as { results: Conversation[] };
        return {
          ...data,
          results: data.results.filter((c) => c.id !== id),
        };
      });
    },
  });

  const updateLabelsMutation = useMutation({
    mutationFn: ({ id, labelIds }: { id: string; labelIds: string[] }) =>
      conversationsApi.updateLabels(id, labelIds),
    onSuccess: (updatedConv) => {
      queryClient.setQueryData(['conversations'], (oldData: unknown) => {
        if (!oldData) return oldData;
        const data = oldData as { results: Conversation[] };
        return {
          ...data,
          results: data.results.map((c) => (c.id === updatedConv.id ? updatedConv : c)),
        };
      });
      queryClient.setQueryData(['conversation', updatedConv.id], updatedConv);
    },
  });

  return {
    conversations: conversationsQuery.data?.results || [],
    isLoading: conversationsQuery.isLoading,
    isError: conversationsQuery.isError,
    refetch: conversationsQuery.refetch,
    createGroup: createGroupMutation.mutateAsync,
    isCreatingGroup: createGroupMutation.isPending,
    updateGroup: updateGroupMutation.mutateAsync,
    isUpdatingGroup: updateGroupMutation.isPending,
    deleteGroup: deleteGroupMutation.mutateAsync,
    isDeletingGroup: deleteGroupMutation.isPending,
    updateLabels: updateLabelsMutation.mutateAsync,
  };
}
