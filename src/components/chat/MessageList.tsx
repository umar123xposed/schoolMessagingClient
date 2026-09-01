'use client';

import React, { useEffect, useRef } from 'react';
import { Message, Conversation } from '@/types';
import { MessageBubble } from './MessageBubble';
import { PinnedBanner } from './PinnedBanner';
import { formatMessageDividerDate, safeParseDate, extractDateFromObjectId } from '@/lib/utils/formatters';
import { MessageSquare, ShieldAlert } from 'lucide-react';
import { isSameDay } from 'date-fns';

interface MessageListProps {
  messages: Message[];
  conversation: Conversation;
  onPinMessage?: (messageId: string, isPinned: boolean) => void;
  onDeleteMessage?: (messageId: string) => void;
  searchQuery?: string;
}

export function MessageList({
  messages,
  conversation,
  onPinMessage,
  onDeleteMessage,
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
      el.classList.add('ring-2', 'ring-[#00a884]');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-[#00a884]');
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
      const parsedDate = safeParseDate(rawDate) || extractDateFromObjectId(msgId) || new Date();
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

        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-[#8696a0] text-center space-y-2">
            <MessageSquare className="w-8 h-8 opacity-40" />
            <p className="text-sm">
              {searchQuery ? `No messages matching "${searchQuery}"` : 'No messages in this chat yet'}
            </p>
          </div>
        ) : (
          filteredMessages.map((msg, index) => {
            const currentDate = safeParseDate(msg.createdAt, msg.id) || new Date();
            const prevDate =
              index > 0
                ? safeParseDate(filteredMessages[index - 1].createdAt, filteredMessages[index - 1].id) || new Date()
                : null;
            const isNewDay = index === 0 || (!!prevDate && !isSameDay(currentDate, prevDate));
            const dividerText = isNewDay ? formatMessageDividerDate(currentDate, msg.id) : '';

            return (
              <React.Fragment key={msg.id || `msg-${index}`}>
                {/* Date Header Pill */}
                {isNewDay && dividerText && (
                  <div className="flex justify-center my-3 select-none sticky top-2 z-10">
                    <span className="px-3 py-1 rounded-lg bg-[#182229] border border-[#222e35] text-[11px] font-semibold text-[#8696a0] shadow-sm uppercase tracking-wider">
                      {dividerText}
                    </span>
                  </div>
                )}

                <div id={`msg-${msg.id}`} className="transition-all rounded-xl">
                  <MessageBubble
                    message={msg}
                    isGroup={isGroup}
                    onPin={onPinMessage}
                    onDelete={onDeleteMessage}
                  />
                </div>
              </React.Fragment>
            );
          })
        )}

        <div ref={bottomRef} className="h-1" />
      </div>
    </div>
  );
}
