'use client';

import React from 'react';
import { Conversation } from '@/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { useChatStore } from '@/stores/useChatStore';
import { useUserMap } from '@/hooks/useUserMap';
import { useLabelsMap } from '@/hooks/useLabelsMap';
import { resolveConversationDetails } from '@/lib/utils/conversation';
import { Avatar } from '@/components/common/Avatar';
import { Dropdown, DropdownItem } from '@/components/common/Dropdown';
import { Search, MoreVertical, ArrowLeft, Info, X, Tag } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface ChatHeaderProps {
  conversation: Conversation;
  onBackToSidebar?: () => void;
}

export function ChatHeader({ conversation, onBackToSidebar }: ChatHeaderProps) {
  const { user } = useAuthStore();
  const userMap = useUserMap();
  const { labelsMap } = useLabelsMap();
  const {
    isInfoDrawerOpen,
    toggleInfoDrawer,
    isSearchInChatOpen,
    setIsSearchInChatOpen,
    searchInChatQuery,
    setSearchInChatQuery,
    typingUsers,
  } = useChatStore();

  const details = resolveConversationDetails(conversation, user, userMap);
  const { title, isGroup, avatarName } = details;

  const isSuperAdmin = user?.role === 'super_admin';
  const isAgentOrAdmin = user?.role === 'agent' || isSuperAdmin;

  // Resolve labels to full objects
  const resolvedLabels = (conversation.labels || [])
    .map((l) => {
      if (typeof l === 'object' && l && l.name) return l;
      if (typeof l === 'string' && labelsMap[l]) return labelsMap[l];
      return null;
    })
    .filter((l): l is typeof labelsMap[string] => l !== null);

  // Check if someone is currently typing in this conversation
  const typingList = typingUsers[conversation.id] || [];
  const now = Date.now();
  const isTyping = typingList.some((item) => now - item.timestamp < 4000);

  const subtitle = isTyping ? 'typing...' : details.subtitle;

  const menuItems: DropdownItem[] = [
    {
      id: 'info',
      label: isGroup ? 'Group Info' : 'Student Info',
      icon: <Info className="w-4 h-4" />,
      onClick: toggleInfoDrawer,
    },
    {
      id: 'search',
      label: isSearchInChatOpen ? 'Close search' : 'Search in chat',
      icon: <Search className="w-4 h-4" />,
      onClick: () => setIsSearchInChatOpen(!isSearchInChatOpen),
    },
  ];

  return (
    <div className="relative bg-[#202c33] border-b border-[#222e35] z-30">
      <div className="flex items-center justify-between px-4 py-2.5">
        {/* Left Side: Back button on mobile + Avatar + Title Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Mobile Back Button */}
          {onBackToSidebar && (
            <button
              type="button"
              onClick={onBackToSidebar}
              className="lg:hidden p-1.5 -ml-1 rounded-full text-[#aebac1] hover:text-[#e9edef] hover:bg-[#111b21] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div
            onClick={toggleInfoDrawer}
            className="flex items-center gap-3 cursor-pointer select-none group min-w-0 flex-1"
          >
            <Avatar
              name={avatarName}
              isGroup={isGroup}
              size="md"
              className="group-hover:opacity-90 transition-opacity"
            />

            <div className="min-w-0 flex-1 text-left">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[#e9edef] truncate group-hover:text-emerald-400 transition-colors">
                  {title}
                </h2>
                {isAgentOrAdmin &&
                  resolvedLabels.map((lbl) => (
                    <span
                      key={lbl.id}
                      className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium tracking-wide"
                      style={{
                        backgroundColor: `${lbl.color}25`,
                        color: lbl.color,
                        border: `1px solid ${lbl.color}40`,
                      }}
                    >
                      <Tag className="w-2.5 h-2.5" />
                      <span>{lbl.name}</span>
                    </span>
                  ))}
              </div>
              <p
                className={cn(
                  'text-xs truncate transition-colors',
                  isTyping ? 'text-[#00a884] font-medium' : 'text-[#8696a0]'
                )}
              >
                {subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Actions (Search, Info Drawer, Menu) */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsSearchInChatOpen(!isSearchInChatOpen)}
            className={cn(
              'p-2 rounded-full transition-colors',
              isSearchInChatOpen
                ? 'text-[#00a884] bg-[#111b21]'
                : 'text-[#aebac1] hover:text-[#e9edef] hover:bg-[#111b21]'
            )}
            title="Search messages in chat"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={toggleInfoDrawer}
            className={cn(
              'p-2 rounded-full transition-colors',
              isInfoDrawerOpen
                ? 'text-[#00a884] bg-[#111b21]'
                : 'text-[#aebac1] hover:text-[#e9edef] hover:bg-[#111b21]'
            )}
            title="View details"
          >
            <Info className="w-5 h-5" />
          </button>

          <Dropdown
            trigger={
              <button
                type="button"
                className="p-2 text-[#aebac1] hover:text-[#e9edef] hover:bg-[#111b21] rounded-full transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            }
            items={menuItems}
            align="right"
          />
        </div>
      </div>

      {/* In-Chat Search Bar Dropdown */}
      {isSearchInChatOpen && (
        <div className="flex items-center gap-2 px-4 py-2 bg-[#111b21] border-t border-[#222e35] animate-slide-down">
          <Search className="w-4 h-4 text-[#8696a0] flex-shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search within this conversation..."
            value={searchInChatQuery}
            onChange={(e) => setSearchInChatQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs text-[#e9edef] placeholder-[#8696a0] outline-none"
          />
          {searchInChatQuery && (
            <button
              type="button"
              onClick={() => setSearchInChatQuery('')}
              className="text-[#8696a0] hover:text-[#e9edef] p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
