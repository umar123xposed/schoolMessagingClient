'use client';

import { Conversation, Label } from '@/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { useChatStore } from '@/stores/useChatStore';
import { useUserMap } from '@/hooks/useUserMap';
import { useLabelsMap } from '@/hooks/useLabelsMap';
import { resolveConversationDetails } from '@/lib/utils/conversation';
import { Avatar } from '@/components/common/Avatar';
import { formatWhatsAppChatDate } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';
import { ImageIcon, Mic, FileText, Video, Ban, Tag } from 'lucide-react';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  const { user } = useAuthStore();
  const { typingUsers } = useChatStore();
  const userMap = useUserMap();
  const { labelsMap } = useLabelsMap();

  const details = resolveConversationDetails(conversation, user, userMap);
  const { title, isGroup, avatarName } = details;

  // Resolve labels to full objects
  const resolvedLabels: Label[] = (conversation.labels || [])
    .map((l) => {
      if (typeof l === 'object' && l && l.name) return l as Label;
      if (typeof l === 'string' && labelsMap[l]) return labelsMap[l];
      return null;
    })
    .filter((l): l is Label => l !== null);

  // Check typing state
  const typingList = typingUsers[conversation.id] || [];
  const now = Date.now();
  const isTyping = typingList.some((item) => now - item.timestamp < 4000);

  // Render preview snippet of the last message
  const renderLastMessageSnippet = () => {
    if (isTyping) {
      return <span className="text-[#00a884] font-medium">typing...</span>;
    }

    const lastMsg = conversation.lastMessage;
    if (!lastMsg) {
      return <span>No messages yet</span>;
    }

    if (lastMsg.isDeleted) {
      return (
        <span className="flex items-center gap-1 italic text-[#8696a0]">
          <Ban className="w-3 h-3" />
          <span>Message deleted</span>
        </span>
      );
    }

    switch (lastMsg.contentType) {
      case 'image':
        return (
          <span className="flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5 text-[#8696a0]" />
            <span>Photo</span>
          </span>
        );
      case 'voice_note':
      case 'audio':
        return (
          <span className="flex items-center gap-1">
            <Mic className="w-3.5 h-3.5 text-[#53bdeb]" />
            <span>Voice message</span>
          </span>
        );
      case 'video':
        return (
          <span className="flex items-center gap-1">
            <Video className="w-3.5 h-3.5 text-[#8696a0]" />
            <span>Video</span>
          </span>
        );
      case 'pdf':
      case 'file':
        return (
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-[#8696a0]" />
            <span>{lastMsg.attachment?.fileName || 'Document'}</span>
          </span>
        );
      default:
        return <span>{lastMsg.text || 'Message'}</span>;
    }
  };

  const isAgentOrAdmin = user?.role === 'agent' || user?.role === 'super_admin';

  return (
    <div
      onClick={onClick}
      className={cn(
        'group flex items-start gap-3 px-3.5 py-3 cursor-pointer select-none transition-colors border-b border-[#222e35]/60 hover:bg-[#202c33]',
        isActive ? 'bg-[#2a3942]' : 'bg-[#111b21]'
      )}
    >
      <Avatar name={avatarName} isGroup={isGroup} size="md" className="mt-0.5" />

      <div className="flex-1 min-w-0">
        {/* Row 1: Title + Timestamp */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-[#e9edef] truncate">{title}</h3>
          <span
            className={cn(
              'text-[11px] whitespace-nowrap',
              isTyping ? 'text-[#00a884] font-semibold' : 'text-[#8696a0]'
            )}
          >
            {formatWhatsAppChatDate(conversation.lastMessageAt || conversation.createdAt)}
          </span>
        </div>

        {/* Row 2 (WhatsApp Business): Labels Badges directly underneath the contact name (Staff only) */}
        {isAgentOrAdmin && resolvedLabels.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-1 mb-1">
            {resolvedLabels.map((lbl) => (
              <span
                key={lbl.id}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-medium tracking-wide shadow-xs"
                style={{
                  backgroundColor: `${lbl.color}20`,
                  color: lbl.color,
                  border: `1px solid ${lbl.color}40`,
                }}
              >
                <Tag className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="truncate max-w-[120px]">{lbl.name}</span>
              </span>
            ))}
          </div>
        )}

        {/* Row 3: Message preview */}
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <div className="text-xs text-[#8696a0] truncate flex-1 flex items-center gap-1">
            {renderLastMessageSnippet()}
          </div>
        </div>
      </div>
    </div>
  );
}
