'use client';

import React, { useState } from 'react';
import { Message } from '@/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { useUserMap } from '@/hooks/useUserMap';
import { formatWhatsAppTime } from '@/lib/utils/formatters';
import { getSenderColorClass } from '@/lib/utils/conversation';
import { cn } from '@/lib/utils/cn';
import { CheckCheck, Check, AlertCircle, Forward, Pin, Megaphone, MoreVertical, Trash2, Copy } from 'lucide-react';
import { Dropdown, DropdownItem } from '@/components/common/Dropdown';

import { TextBubble } from './bubbles/TextBubble';
import { ImageBubble } from './bubbles/ImageBubble';
import { AudioBubble } from './bubbles/AudioBubble';
import { VideoBubble } from './bubbles/VideoBubble';
import { PdfBubble } from './bubbles/PdfBubble';
import { FileBubble } from './bubbles/FileBubble';
import { DeletedBubble } from './bubbles/DeletedBubble';

interface MessageBubbleProps {
  message: Message;
  isGroup?: boolean;
  onPin?: (messageId: string, isPinned: boolean) => void;
  onDelete?: (messageId: string) => void;
  onForward?: (message: Message) => void;
}

export function MessageBubble({ message, onPin, onDelete, onForward }: MessageBubbleProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const userMap = useUserMap();

  const senderId = typeof message.senderId === 'string' ? message.senderId : message.senderId?.id;
  const isOutgoing = senderId === user?.id;

  // Resolve sender name (object or from userMap)
  let senderName: string | undefined;
  if (typeof message.senderId === 'object' && message.senderId) {
    senderName = message.senderId.name || message.senderId.phoneNumber;
  } else if (typeof message.senderId === 'string') {
    const matchedUser = userMap[message.senderId];
    if (matchedUser) {
      senderName = matchedUser.name || matchedUser.phoneNumber;
    }
  }

  // If student is receiving from staff/agent and name not found
  if (!isOutgoing && !senderName && user?.role === 'student') {
    senderName = 'School Staff';
  }

  const isSuperAdmin = user?.role === 'super_admin';
  const canDelete = !message.isDeleted && (isOutgoing || isSuperAdmin);
  const canPin = !message.isDeleted && isSuperAdmin;

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      addToast({ type: 'info', message: 'Message copied to clipboard' });
    }
  };

  const menuItems: (DropdownItem | 'divider')[] = [];

  if (message.text && !message.isDeleted) {
    menuItems.push({
      id: 'copy',
      label: 'Copy text',
      icon: <Copy className="w-4 h-4" />,
      onClick: handleCopy,
    });
  }

  const isAgentOrAdmin = user?.role === 'agent' || user?.role === 'super_admin';
  const canForward = !message.isDeleted && isAgentOrAdmin && !!onForward;

  if (canForward) {
    menuItems.push({
      id: 'forward',
      label: 'Forward message',
      icon: <Forward className="w-4 h-4" />,
      onClick: () => onForward(message),
    });
  }

  if (canPin && onPin) {
    menuItems.push({
      id: 'pin',
      label: message.isPinned ? 'Unpin message' : 'Pin message',
      icon: <Pin className="w-4 h-4" />,
      onClick: () => onPin(message.id, !message.isPinned),
    });
  }

  if (canDelete && onDelete) {
    if (menuItems.length > 0) menuItems.push('divider');
    menuItems.push({
      id: 'delete',
      label: 'Delete message',
      icon: <Trash2 className="w-4 h-4" />,
      danger: true,
      onClick: () => onDelete(message.id),
    });
  }

  const renderContent = () => {
    if (message.isDeleted) {
      return <DeletedBubble />;
    }

    switch (message.contentType) {
      case 'text':
        return <TextBubble text={message.text} isOutgoing={isOutgoing} />;
      case 'image':
        return message.attachment ? (
          <ImageBubble
            attachment={message.attachment}
            text={message.text}
            isOutgoing={isOutgoing}
            uploadProgress={message.uploadProgress}
            status={message.status}
          />
        ) : null;
      case 'audio':
        return message.attachment ? (
          <AudioBubble
            attachment={message.attachment}
            isVoiceNote={false}
            isOutgoing={isOutgoing}
            text={message.text}
            uploadProgress={message.uploadProgress}
            status={message.status}
          />
        ) : null;
      case 'voice_note':
        return message.attachment ? (
          <AudioBubble
            attachment={message.attachment}
            isVoiceNote={true}
            isOutgoing={isOutgoing}
            text={message.text}
            uploadProgress={message.uploadProgress}
            status={message.status}
          />
        ) : null;
      case 'video':
        return message.attachment ? (
          <VideoBubble
            attachment={message.attachment}
            text={message.text}
            isOutgoing={isOutgoing}
            uploadProgress={message.uploadProgress}
            status={message.status}
          />
        ) : null;
      case 'pdf':
        return message.attachment ? (
          <PdfBubble
            attachment={message.attachment}
            text={message.text}
            isOutgoing={isOutgoing}
            uploadProgress={message.uploadProgress}
            status={message.status}
          />
        ) : null;
      case 'file':
        return message.attachment ? (
          <FileBubble
            attachment={message.attachment}
            text={message.text}
            isOutgoing={isOutgoing}
            uploadProgress={message.uploadProgress}
            status={message.status}
          />
        ) : null;
      default:
        return <TextBubble text={message.text} isOutgoing={isOutgoing} />;
    }
  };

  return (
    <div
      id={`msg-${message.id}`}
      className={cn('group relative flex flex-col mb-1 select-text transition-all duration-300', {
        'items-end': isOutgoing,
        'items-start': !isOutgoing,
      })}
    >
      <div
        className={cn(
          'relative max-w-[85%] sm:max-w-[75%] md:max-w-[65%] rounded-lg px-3 pt-2 pb-1.5 shadow-sm text-sm break-words',
          {
            // Outgoing Bubble: Dark Pine Green
            'bg-[#005c4b] text-[#e9edef] rounded-tr-none': isOutgoing,
            // Incoming Bubble: Slate Charcoal
            'bg-[#202c33] text-[#e9edef] rounded-tl-none': !isOutgoing,
            // Pinned indicator border glow
            'ring-1 ring-[#00a884]/40': message.isPinned,
          }
        )}
      >
        {/* Pinned Marker / Broadcast Header */}
        {(message.isPinned || message.isBroadcast) && (
          <div className="flex items-center gap-2 mb-1 text-[11px] text-[#8696a0]">
            {message.isPinned && (
              <span className="inline-flex items-center gap-1 text-amber-400">
                <Pin className="w-3 h-3" /> Pinned
              </span>
            )}
            {message.isBroadcast && (
              <span className="inline-flex items-center gap-1 text-sky-400">
                <Megaphone className="w-3 h-3" /> Broadcast
              </span>
            )}
          </div>
        )}

        {/* Sender Name for Incoming Messages (Both Group & Student Support Chats) */}
        {!isOutgoing && senderName && (
          <p className={cn('text-[12px] font-semibold mb-1 leading-tight select-none', getSenderColorClass(senderName))}>
            {senderName}
          </p>
        )}

        {/* Bubble Body Content */}
        <div className="pr-1">{renderContent()}</div>

        {/* Meta Info: Time + Checkmark */}
        <div className="flex items-center justify-end gap-1 mt-1 -mb-0.5 select-none">
          <span className="text-[11px] font-normal text-[#8696a0] tracking-tight">
            {formatWhatsAppTime(message.createdAt, message.id)}
          </span>
          {isOutgoing && (
            <span className="ml-0.5 inline-flex items-center">
              {message.status === 'error' ? (
                <span className="text-red-400" title="Failed to send">
                  <AlertCircle className="w-3.5 h-3.5" />
                </span>
              ) : message.status === 'sending' || message.id.startsWith('optimistic-') ? (
                <span className="text-[#8696a0]" title="Sending...">
                  <Check className="w-3.5 h-3.5" />
                </span>
              ) : (
                <span className="text-[#53bdeb]" title="Delivered">
                  <CheckCheck className="w-3.5 h-3.5" />
                </span>
              )}
            </span>
          )}
        </div>

        {/* Hover Dropdown Trigger for Message Actions */}
        {menuItems.length > 0 && (
          <div
            className={cn(
              'absolute top-1.5 transition-opacity z-20 right-1.5',
              isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}
          >
            <Dropdown
              trigger={
                <button
                  type="button"
                  className="rounded-full p-1 text-[#8696a0] hover:text-[#e9edef] hover:bg-black/40 backdrop-blur-sm transition-colors"
                  aria-label="Message options"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              }
              items={menuItems}
              align={isOutgoing ? 'right' : 'left'}
              onOpenChange={setIsMenuOpen}
            />
          </div>
        )}
      </div>
    </div>
  );
}
