import { apiClient } from './client';
import { Conversation, PaginatedResult } from '@/types';

export interface GetConversationsQuery {
  sortBy?: string;
  limit?: number;
  page?: number;
}

export interface CreateGroupPayload {
  name: string;
  participantIds: string[];
}

export interface UpdateGroupPayload {
  name?: string;
  participantIds?: string[];
}

export const conversationsApi = {
  getConversations: async (params?: GetConversationsQuery): Promise<PaginatedResult<Conversation>> => {
    const { data } = await apiClient.get<PaginatedResult<Conversation>>('/conversations', { params });
    return data;
  },

  getConversationById: async (id: string): Promise<Conversation> => {
    const { data } = await apiClient.get<Conversation>(`/conversations/${id}`);
    return data;
  },

  createGroup: async (payload: CreateGroupPayload): Promise<Conversation> => {
    const { data } = await apiClient.post<Conversation>('/conversations', payload);
    return data;
  },

  updateGroup: async (id: string, payload: UpdateGroupPayload): Promise<Conversation> => {
    const { data } = await apiClient.patch<Conversation>(`/conversations/${id}`, payload);
    return data;
  },

  deleteGroup: async (id: string): Promise<void> => {
    await apiClient.delete(`/conversations/${id}`);
  },

  updateLabels: async (id: string, labelIds: string[]): Promise<Conversation> => {
    const { data } = await apiClient.patch<Conversation>(`/conversations/${id}/labels`, {
      labels: labelIds,
    });
    return data;
  },

  markConversationAsRead: async (id: string): Promise<Conversation> => {
    const { data } = await apiClient.patch<Conversation>(`/conversations/${id}/read`);
    return data;
  },
};
