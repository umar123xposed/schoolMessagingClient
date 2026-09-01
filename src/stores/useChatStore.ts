import { create } from 'zustand';
import { Conversation, Message } from '@/types';

interface ChatState {
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  searchQuery: string;
  selectedLabelFilter: string | null;
  activeTab: 'all' | 'unread' | 'groups';
  isInfoDrawerOpen: boolean;
  isSearchInChatOpen: boolean;
  searchInChatQuery: string;
  replyToMessage: Message | null;
  typingUsers: Record<string, { userId: string; timestamp: number }[]>;
  onlineUsers: Record<string, { isOnline: boolean; lastSeenAt?: string }>;

  setActiveConversation: (conversation: Conversation | null) => void;
  setActiveConversationId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedLabelFilter: (labelId: string | null) => void;
  setActiveTab: (tab: 'all' | 'unread' | 'groups') => void;
  setIsInfoDrawerOpen: (open: boolean) => void;
  toggleInfoDrawer: () => void;
  setIsSearchInChatOpen: (open: boolean) => void;
  setSearchInChatQuery: (query: string) => void;
  setReplyToMessage: (message: Message | null) => void;

  setTypingUser: (conversationId: string, userId: string, isTyping: boolean) => void;
  setPresence: (userId: string, isOnline: boolean, lastSeenAt?: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeConversationId: null,
  activeConversation: null,
  searchQuery: '',
  selectedLabelFilter: null,
  activeTab: 'all',
  isInfoDrawerOpen: false,
  isSearchInChatOpen: false,
  searchInChatQuery: '',
  replyToMessage: null,
  typingUsers: {},
  onlineUsers: {},

  setActiveConversation: (conversation) => {
    set({
      activeConversation: conversation,
      activeConversationId: conversation?.id || null,
      replyToMessage: null,
      isSearchInChatOpen: false,
      searchInChatQuery: '',
    });
  },

  setActiveConversationId: (id) => {
    set({
      activeConversationId: id,
      replyToMessage: null,
      isSearchInChatOpen: false,
      searchInChatQuery: '',
    });
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedLabelFilter: (selectedLabelFilter) => set({ selectedLabelFilter }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setIsInfoDrawerOpen: (isInfoDrawerOpen) => set({ isInfoDrawerOpen }),
  toggleInfoDrawer: () => set((state) => ({ isInfoDrawerOpen: !state.isInfoDrawerOpen })),
  setIsSearchInChatOpen: (isSearchInChatOpen) => set({ isSearchInChatOpen }),
  setSearchInChatQuery: (searchInChatQuery) => set({ searchInChatQuery }),
  setReplyToMessage: (replyToMessage) => set({ replyToMessage }),

  setTypingUser: (conversationId, userId, isTyping) => {
    set((state) => {
      const currentList = state.typingUsers[conversationId] || [];
      if (isTyping) {
        // filter out existing entry for this user and append fresh
        const filtered = currentList.filter((item) => item.userId !== userId);
        return {
          typingUsers: {
            ...state.typingUsers,
            [conversationId]: [...filtered, { userId, timestamp: Date.now() }],
          },
        };
      } else {
        return {
          typingUsers: {
            ...state.typingUsers,
            [conversationId]: currentList.filter((item) => item.userId !== userId),
          },
        };
      }
    });
  },

  setPresence: (userId, isOnline, lastSeenAt) => {
    set((state) => ({
      onlineUsers: {
        ...state.onlineUsers,
        [userId]: { isOnline, lastSeenAt },
      },
    }));
  },
}));
