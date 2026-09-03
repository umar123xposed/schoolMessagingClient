'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import { Message, Conversation } from '@/types';
import { MessageBubble } from './MessageBubble';
import { PinnedBanner } from './PinnedBanner';
import { formatMessageDividerDate, safeParseDate, extractDateFromObjectId } from '@/lib/utils/formatters';
import { MessageSquare, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';

interface MessageListProps {
  messages: Message[];
  conversation: Conversation;
  onPinMessage?: (messageId: string, isPinned: boolean) => void;
  onDeleteMessage?: (messageId: string) => void;
  onForwardMessage?: (message: Message) => void;
  searchQuery?: string;
}

interface DayGroup {
  dateKey: string;
  dividerText: string;
  messages: Message[];
}

export function MessageList({
  messages,
  conversation,
  onPinMessage,
  onDeleteMessage,
  onForwardMessage,
  searchQuery = '',
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Extract pinned messages
  const pinnedMessages = (messages || []).flat(2).filter((m) => !!m && m.isPinned && !m.isDeleted);
  const isGroup = conversation.type === 'agent_group';

  // Auto-scroll on initial load and when message count increases
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages?.length]);

  const handleScrollToMessage = (messageId: string) => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-[#00a884]', 'ring-offset-2', 'ring-offset-[#0b141a]');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-[#00a884]', 'ring-offset-2', 'ring-offset-[#0b141a]');
      }, 2000);
    }
  };

  interface RawMessageItem extends Partial<Message> {
    _id?: string;
    timestamp?: string;
    created_at?: string;
    date?: string;
  }

  // Ensure messages are valid objects with IDs and normalized dates, sorted chronologically
  const rawList = (messages || []).flat(2) as unknown as (RawMessageItem | null | undefined)[];
  const validMessages: Message[] = rawList
    .filter((m): m is RawMessageItem => !!m && typeof m === 'object' && (!!m.id || !!m._id))
    .map((m) => {
      const msgId = m.id || m._id || '';
      const rawDate = m.createdAt || m.timestamp || m.created_at || m.updatedAt || m.date;
      const parsedDate = safeParseDate(rawDate, msgId) || extractDateFromObjectId(msgId) || new Date();
      return {
        ...m,
        id: msgId,
        createdAt: parsedDate.toISOString(),
      } as Message;
    });

  const sortedMessages = [...validMessages].sort((a, b) => {
    const timeA = safeParseDate(a.createdAt, a.id)?.getTime() || 0;
    const timeB = safeParseDate(b.createdAt, b.id)?.getTime() || 0;
    return timeA - timeB;
  });

  // Filter messages if search inside chat is active
  const filteredMessages = searchQuery
    ? sortedMessages.filter(
        (m) =>
          m.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.attachment?.fileName?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sortedMessages;

  // Group messages chronologically by calendar day to guarantee clean headers and prevent stacking
  const dayGroups = useMemo(() => {
    const groups: DayGroup[] = [];
    const groupMap = new Map<string, DayGroup>();

    filteredMessages.forEach((msg) => {
      const date = safeParseDate(msg.createdAt, msg.id) || extractDateFromObjectId(msg.id) || new Date();
      const dateKey = format(date, 'yyyy-MM-dd');

      let group = groupMap.get(dateKey);
      if (!group) {
        group = {
          dateKey,
          dividerText: formatMessageDividerDate(date, msg.id),
          messages: [],
        };
        groupMap.set(dateKey, group);
        groups.push(group);
      }
      group.messages.push(msg);
    });

    return groups;
  }, [filteredMessages]);

  return (
    <div className="relative flex-1 flex flex-col min-h-0 bg-[#0b141a]">
      {/* Pinned Messages Top Banner */}
      {pinnedMessages.length > 0 && (
        <PinnedBanner
          pinnedMessages={pinnedMessages}
          onUnpin={(id) => onPinMessage?.(id, false)}
          onScrollToMessage={handleScrollToMessage}
        />
      )}

      {/* WhatsApp Chat Doodle Pattern Background Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5 bg-repeat"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Scrollable Message List */}
      <div
        ref={scrollContainerRef}
        className="relative flex-1 overflow-y-auto px-4 py-3 sm:px-8 space-y-1 custom-scrollbar"
      >
        {/* End-to-end encryption / system notice pill */}
        <div className="flex justify-center my-3 select-none">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#182229]/80 border border-[#222e35] text-[11.5px] text-[#ffd279] text-center max-w-md shadow-sm">
            <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 text-[#ffd279]" />
            <span>Messages in this school support desk are securely recorded for quality assurance.</span>
          </div>
        </div>

        {dayGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-[#8696a0] text-center space-y-2">
            <MessageSquare className="w-8 h-8 opacity-40" />
            <p className="text-sm">
              {searchQuery ? `No messages matching "${searchQuery}"` : 'No messages in this chat yet'}
            </p>
          </div>
        ) : (
          dayGroups.map((group) => (
            <div key={group.dateKey} className="relative">
              {/* Day Divider Pill */}
              <div className="flex justify-center my-3 select-none">
                <span className="px-3 py-1 rounded-lg bg-[#182229] border border-[#222e35] text-[11px] font-semibold text-[#8696a0] shadow-sm uppercase tracking-wider">
                  {group.dividerText}
                </span>
              </div>

              {/* Messages for this Day */}
              <div className="space-y-1">
                {group.messages.map((msg) => (
                  <div id={`msg-${msg.id}`} key={msg.id} className="transition-all rounded-xl">
                    <MessageBubble
                      message={msg}
                      isGroup={isGroup}
                      onPin={onPinMessage}
                      onDelete={onDeleteMessage}
                      onForward={onForwardMessage}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        <div ref={bottomRef} className="h-1" />
      </div>
    </div>
  );
}
