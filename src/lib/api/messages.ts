import { apiClient } from './client';
import { Message, SendMessagePayload, PaginatedResult } from '@/types';

export interface GetMessagesQuery {
  sortBy?: string;
  limit?: number;
  page?: number;
}

export interface BroadcastMessagePayload extends SendMessagePayload {
  targetConversationIds?: string[];
  toAll?: boolean;
}

export const messagesApi = {
  getMessages: async (conversationId: string, params?: GetMessagesQuery): Promise<PaginatedResult<Message>> => {
    const { data } = await apiClient.get<PaginatedResult<Message>>(`/conversations/${conversationId}/messages`, {
      params,
    });
    return data;
  },

  sendMessage: async (conversationId: string, payload: SendMessagePayload): Promise<Message> => {
    const { data } = await apiClient.post<Message>(`/conversations/${conversationId}/messages`, payload);
    return data;
  },

  sendMultipleMessages: async (conversationId: string, payloads: SendMessagePayload[]): Promise<Message[]> => {
    const { data } = await apiClient.post<Message[]>(`/conversations/${conversationId}/messages`, payloads);
    return data;
  },

  broadcastMessage: async (payload: BroadcastMessagePayload): Promise<{ count: number; broadcastGroupId: string }> => {
    const { data } = await apiClient.post<{ count: number; broadcastGroupId: string }>('/messages/broadcast', payload);
    return data;
  },

  pinMessage: async (messageId: string, isPinned: boolean): Promise<Message> => {
    const { data } = await apiClient.patch<Message>(`/messages/${messageId}/pin`, { isPinned });
    return data;
  },

  deleteMessage: async (messageId: string): Promise<Message> => {
    const { data } = await apiClient.delete<Message>(`/messages/${messageId}`);
    return data;
  },
};
