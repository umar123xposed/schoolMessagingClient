'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/useAuthStore';
import { useChatStore } from '@/stores/useChatStore';
import { socketManager } from '@/lib/socket/socketManager';
import { soundEffects } from '@/lib/utils/sound';
import { useUnreadStore } from '@/stores/useUnreadStore';
import { conversationsApi } from '@/lib/api/conversations';
import { Message, Conversation } from '@/types';

export function useSocket() {
  const queryClient = useQueryClient();
  const { tokens, user, isAuthenticated } = useAuthStore();
  const {
    activeConversationId,
    setTypingUser,
    setPresence,
  } = useChatStore();
  const [isSocketReady, setIsSocketReady] = useState(false);

  useEffect(() => {
    if (isAuthenticated && tokens?.access?.token) {
      socketManager.connect(tokens.access.token);
    } else {
      socketManager.disconnect();
      setIsSocketReady(false);
    }
  }, [isAuthenticated, tokens?.access?.token]);

  useEffect(() => {
    const unsubReady = socketManager.on('socket:ready', (ready) => {
      setIsSocketReady(!!ready);
    });

    const unsubNewMessage = socketManager.on('message:new', (payload) => {
      const incomingList: Message[] = Array.isArray(payload)
        ? payload.flat(2).filter((m): m is Message => !!m && typeof m === 'object' && !!m.id)
        : (payload && typeof payload === 'object' && 'id' in payload ? [payload as Message] : []);

      incomingList.forEach((message) => {
        const conversationId = message.conversationId;
        if (!conversationId) return;

        // Play audio notification and update unread count if not sent by current user
        const senderId = typeof message.senderId === 'string' ? message.senderId : message.senderId?.id;
        if (senderId !== user?.id) {
          soundEffects.playReceived();
          if (conversationId === activeConversationId) {
            useUnreadStore.getState().markAsRead(conversationId);
            if (user?.role === 'agent' || user?.role === 'super_admin') {
              conversationsApi.markConversationAsRead(conversationId).catch(() => {});
            }
          } else {
            useUnreadStore.getState().incrementUnread(conversationId);
          }
        } else {
          // Staff reply automatically clears unread count
          useUnreadStore.getState().markAsRead(conversationId);
        }

        // Update messages cache for this conversation
        queryClient.setQueryData(['messages', conversationId], (oldData: unknown) => {
          if (!oldData) return { results: [message], page: 1, limit: 100, totalPages: 1, totalResults: 1 };
          const data = oldData as { results: Message[]; page: number; limit: number; totalPages: number; totalResults: number };
          const existingResults = (data.results || []).flat(2).filter((m): m is Message => !!m && typeof m === 'object' && !!m.id);

          // Prevent duplicate appending
          if (existingResults.some((m) => m.id === message.id)) {
            return {
              ...data,
              results: existingResults,
            };
          }
          return {
            ...data,
            results: [...existingResults, message],
            totalResults: (data.totalResults || existingResults.length) + 1,
          };
        });

        // Update conversations cache (re-order by lastMessageAt and update unreadCount)
        queryClient.setQueryData(['conversations'], (oldData: unknown) => {
          if (!oldData) return oldData;
          const data = oldData as { results: Conversation[]; page: number; limit: number; totalPages: number; totalResults: number };

          const existingIndex = data.results.findIndex((c) => c.id === conversationId);
          const updatedList = [...data.results];

          if (existingIndex > -1) {
            const currentUnread = updatedList[existingIndex].unreadCount || 0;
            const newUnread = (senderId === user?.id || conversationId === activeConversationId)
              ? 0
              : currentUnread + 1;

            const updatedConv: Conversation = {
              ...updatedList[existingIndex],
              lastMessageAt: message.createdAt,
              lastMessage: message,
              unreadCount: newUnread,
            };
            updatedList.splice(existingIndex, 1);
            updatedList.unshift(updatedConv);
          } else {
            // If conversation wasn't in cache, invalidate to refetch
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
          }

          return {
            ...data,
            results: updatedList,
          };
        });
      });
    });

    const unsubPinned = socketManager.on('message:pinned', (pinnedMsg) => {
      const message = pinnedMsg as Message;
      queryClient.setQueryData(['messages', message.conversationId], (oldData: unknown) => {
        if (!oldData) return oldData;
        const data = oldData as { results: Message[] };
        return {
          ...data,
          results: data.results.map((m) => (m.id === message.id ? message : m)),
        };
      });
    });

    const unsubDeleted = socketManager.on('message:deleted', (deletedMsg) => {
      const message = deletedMsg as Message;
      queryClient.setQueryData(['messages', message.conversationId], (oldData: unknown) => {
        if (!oldData) return oldData;
        const data = oldData as { results: Message[] };
        return {
          ...data,
          results: data.results.map((m) => (m.id === message.id ? message : m)),
        };
      });
    });

    const unsubNewConv = socketManager.on('conversation:new', (newConv) => {
      const conv = newConv as Conversation;
      queryClient.setQueryData(['conversations'], (oldData: unknown) => {
        if (!oldData) return { results: [conv], page: 1, limit: 50, totalPages: 1, totalResults: 1 };
        const data = oldData as { results: Conversation[] };
        if (data.results.some((c) => c.id === conv.id)) return data;
        return {
          ...data,
          results: [conv, ...data.results],
        };
      });
    });

    const unsubGroupCreated = socketManager.on('conversation:group:created', (newGroup) => {
      const conv = newGroup as Conversation;
      queryClient.setQueryData(['conversations'], (oldData: unknown) => {
        if (!oldData) return { results: [conv], page: 1, limit: 50, totalPages: 1, totalResults: 1 };
        const data = oldData as { results: Conversation[] };
        return {
          ...data,
          results: [conv, ...data.results],
        };
      });
    });

    const unsubGroupUpdated = socketManager.on('conversation:group:updated', (updatedGroup) => {
      const conv = updatedGroup as Conversation;
      queryClient.setQueryData(['conversations'], (oldData: unknown) => {
        if (!oldData) return oldData;
        const data = oldData as { results: Conversation[] };
        return {
          ...data,
          results: data.results.map((c) => (c.id === conv.id ? conv : c)),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['conversation', conv.id] });
    });

    const unsubGroupDeleted = socketManager.on('conversation:group:deleted', (payload) => {
      const { id } = payload as { id: string };
      queryClient.setQueryData(['conversations'], (oldData: unknown) => {
        if (!oldData) return oldData;
        const data = oldData as { results: Conversation[] };
        return {
          ...data,
          results: data.results.filter((c) => c.id !== id),
        };
      });
      if (activeConversationId === id) {
        useChatStore.getState().setActiveConversation(null);
      }
    });

    const unsubPresence = socketManager.on('presence:update', (payload) => {
      const { userId, isOnline, lastSeenAt } = payload as { userId: string; isOnline: boolean; lastSeenAt?: string };
      setPresence(userId, isOnline, lastSeenAt);
    });

    const unsubTypingStart = socketManager.on('typing:start', (payload) => {
      const { conversationId, userId } = payload as { conversationId: string; userId: string };
      if (userId !== user?.id) {
        setTypingUser(conversationId, userId, true);
      }
    });

    const unsubTypingStop = socketManager.on('typing:stop', (payload) => {
      const { conversationId, userId } = payload as { conversationId: string; userId: string };
      if (userId !== user?.id) {
        setTypingUser(conversationId, userId, false);
      }
    });

    return () => {
      unsubReady();
      unsubNewMessage();
      unsubPinned();
      unsubDeleted();
      unsubNewConv();
      unsubGroupCreated();
      unsubGroupUpdated();
      unsubGroupDeleted();
      unsubPresence();
      unsubTypingStart();
      unsubTypingStop();
    };
  }, [queryClient, user?.id, user?.role, activeConversationId, setTypingUser, setPresence]);

  return { isSocketReady };
}
