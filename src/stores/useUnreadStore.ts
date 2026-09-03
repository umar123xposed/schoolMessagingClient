import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Conversation } from '@/types';

interface UnreadState {
  lastReadMap: Record<string, string>; // conversationId -> ISO timestamp
  unreadCounts: Record<string, number>; // conversationId -> count

  markAsRead: (conversationId: string) => void;
  incrementUnread: (conversationId: string) => void;
  syncWithConversations: (
    conversations: Conversation[],
    currentUserId?: string,
    activeConversationId?: string | null
  ) => void;
}

export const useUnreadStore = create<UnreadState>()(
  persist(
    (set, get) => ({
      lastReadMap: {},
      unreadCounts: {},

      markAsRead: (conversationId: string) => {
        set((state) => ({
          lastReadMap: {
            ...state.lastReadMap,
            [conversationId]: new Date().toISOString(),
          },
          unreadCounts: {
            ...state.unreadCounts,
            [conversationId]: 0,
          },
        }));
      },

      incrementUnread: (conversationId: string) => {
        set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [conversationId]: (state.unreadCounts[conversationId] || 0) + 1,
          },
        }));
      },

      syncWithConversations: (
        conversations: Conversation[],
        currentUserId?: string,
        activeConversationId?: string | null
      ) => {
        const { unreadCounts } = get();
        const updatedCounts: Record<string, number> = { ...unreadCounts };
        let hasChanges = false;

        conversations.forEach((c) => {
          if (!c.id) return;
          if (c.id === activeConversationId) {
            if (updatedCounts[c.id] !== 0) {
              updatedCounts[c.id] = 0;
              hasChanges = true;
            }
            return;
          }

          // Use server-computed unreadCount directly
          if (typeof c.unreadCount === 'number') {
            if (updatedCounts[c.id] !== c.unreadCount) {
              updatedCounts[c.id] = c.unreadCount;
              hasChanges = true;
            }
          }
        });

        if (hasChanges) {
          set({ unreadCounts: updatedCounts });
        }
      },
    }),
    {
      name: 'school_support_unread_state',
    }
  )
);
