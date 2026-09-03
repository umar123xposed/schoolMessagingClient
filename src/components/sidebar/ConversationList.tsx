'use client';

import { Conversation } from '@/types';
import { useChatStore } from '@/stores/useChatStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUnreadStore } from '@/stores/useUnreadStore';
import { useUserMap } from '@/hooks/useUserMap';
import { resolveConversationDetails } from '@/lib/utils/conversation';
import { ConversationItem } from './ConversationItem';
import { MessageSquare } from 'lucide-react';

interface ConversationListProps {
  conversations: Conversation[];
  isLoading: boolean;
  onSelectConversation: (conversation: Conversation) => void;
}

export function ConversationList({
  conversations,
  isLoading,
  onSelectConversation,
}: ConversationListProps) {
  const { user } = useAuthStore();
  const userMap = useUserMap();
  const unreadCounts = useUnreadStore((s) => s.unreadCounts);
  const {
    activeConversationId,
    searchQuery,
    selectedLabelFilter,
    activeTab,
  } = useChatStore();

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    // Tab filter
    if (activeTab === 'groups' && c.type !== 'agent_group') {
      return false;
    }

    if (activeTab === 'unread') {
      const count = unreadCounts[c.id] ?? (c.unreadCount || 0);
      if (count <= 0) return false;
    }

    // Label filter
    if (selectedLabelFilter) {
      const hasLabel = (c.labels || []).some((l) =>
        typeof l === 'string' ? l === selectedLabelFilter : l.id === selectedLabelFilter
      );
      if (!hasLabel) return false;
    }

    // Search query filter
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const details = resolveConversationDetails(c, user, userMap);
      const title = details.title.toLowerCase();
      const phone = (details.phoneNumber || '').toLowerCase();
      const batch = (details.batchLabel || '').toLowerCase();
      const notes = (details.student?.notes || '').toLowerCase();

      return (
        title.includes(q) ||
        phone.includes(q) ||
        batch.includes(q) ||
        notes.includes(q)
      );
    }

    return true;
  });

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
            <div className="w-11 h-11 rounded-full bg-[#202c33]" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-[#202c33] rounded w-1/3" />
              <div className="h-3 bg-[#202c33] rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (filteredConversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-[#8696a0]">
        <MessageSquare className="w-10 h-10 opacity-30 mb-2" />
        <p className="text-sm font-medium">No chats found</p>
        <p className="text-xs text-[#8696a0]/70 mt-1 max-w-xs">
          {searchQuery ? `No conversation matching "${searchQuery}"` : 'All conversations will appear here'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {filteredConversations.map((conv) => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          isActive={conv.id === activeConversationId}
          onClick={() => onSelectConversation(conv)}
        />
      ))}
    </div>
  );
}
