'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { labelsApi } from '@/lib/api/labels';
import { useAuthStore } from '@/stores/useAuthStore';
import { useChatStore } from '@/stores/useChatStore';
import { useUnreadStore } from '@/stores/useUnreadStore';
import { useConversations } from '@/hooks/useConversations';
import { cn } from '@/lib/utils/cn';

export function FilterChips() {
  const { user } = useAuthStore();
  const isAgentOrAdmin = user?.role === 'agent' || user?.role === 'super_admin';
  const { activeTab, setActiveTab, selectedLabelFilter, setSelectedLabelFilter } = useChatStore();
  const { conversations } = useConversations();
  const unreadCounts = useUnreadStore((s) => s.unreadCounts);

  const totalUnreadChats = conversations.filter((c) => {
    const count = unreadCounts[c.id] ?? (c.unreadCount || 0);
    return count > 0;
  }).length;

  const { data: labelsResult } = useQuery({
    queryKey: ['labels'],
    queryFn: () => labelsApi.getLabels(),
    enabled: isAgentOrAdmin,
    staleTime: 1000 * 60 * 5,
  });

  if (!isAgentOrAdmin) {
    return null;
  }

  const labels = labelsResult?.results || [];

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 overflow-x-auto custom-scrollbar bg-[#111b21] border-b border-[#222e35] select-none text-xs">
      <button
        type="button"
        onClick={() => {
          setActiveTab('all');
          setSelectedLabelFilter(null);
        }}
        className={cn(
          'px-3 py-1 rounded-full font-medium transition-all whitespace-nowrap',
          activeTab === 'all' && selectedLabelFilter === null
            ? 'bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/40 font-semibold'
            : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] border border-[#2a3942]'
        )}
      >
        All
      </button>

      <button
        type="button"
        onClick={() => {
          setActiveTab('unread');
          setSelectedLabelFilter(null);
        }}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-all whitespace-nowrap',
          activeTab === 'unread'
            ? 'bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/40 font-semibold'
            : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] border border-[#2a3942]'
        )}
      >
        <span>Unread</span>
        {totalUnreadChats > 0 && (
          <span className="min-w-[16px] h-[16px] px-1 rounded-full bg-[#00a884] text-[#111b21] text-[10px] font-bold flex items-center justify-center">
            {totalUnreadChats > 99 ? '99+' : totalUnreadChats}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => {
          setActiveTab('groups');
          setSelectedLabelFilter(null);
        }}
        className={cn(
          'px-3 py-1 rounded-full font-medium transition-all whitespace-nowrap',
          activeTab === 'groups'
            ? 'bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/40 font-semibold'
            : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] border border-[#2a3942]'
        )}
      >
        Groups
      </button>

      {/* Label Filter Chips */}
      {labels.map((lbl) => {
        const isSelected = selectedLabelFilter === lbl.id;
        return (
          <button
            key={lbl.id}
            type="button"
            onClick={() => {
              if (isSelected) {
                setSelectedLabelFilter(null);
              } else {
                setSelectedLabelFilter(lbl.id);
                setActiveTab('all');
              }
            }}
            style={
              isSelected
                ? {
                    backgroundColor: `${lbl.color}25`,
                    borderColor: `${lbl.color}80`,
                    color: lbl.color,
                  }
                : undefined
            }
            className={cn(
              'flex items-center gap-1 px-3 py-1 rounded-full font-medium transition-all whitespace-nowrap border',
              isSelected
                ? 'font-semibold'
                : 'bg-[#202c33] text-[#8696a0] border-[#2a3942] hover:text-[#e9edef]'
            )}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: lbl.color }}
            />
            <span>{lbl.name}</span>
          </button>
        );
      })}
    </div>
  );
}
