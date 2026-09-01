'use client';

import React from 'react';
import { Message } from '@/types';
import { Pin, X } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

interface PinnedBannerProps {
  pinnedMessages: Message[];
  onUnpin?: (messageId: string) => void;
  onScrollToMessage?: (messageId: string) => void;
}

export function PinnedBanner({ pinnedMessages, onUnpin, onScrollToMessage }: PinnedBannerProps) {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';

  if (!pinnedMessages || pinnedMessages.length === 0) return null;

  const latestPinned = pinnedMessages[pinnedMessages.length - 1];

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-[#182229]/95 backdrop-blur-md px-4 py-2 border-b border-[#222e35] shadow-sm animate-slide-down">
      <div
        onClick={() => onScrollToMessage?.(latestPinned.id)}
        className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer group"
      >
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex-shrink-0">
          <Pin className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              Pinned Message
            </span>
            {pinnedMessages.length > 1 && (
              <span className="text-[10px] bg-[#202c33] text-[#8696a0] px-1.5 py-0.2 rounded-full">
                +{pinnedMessages.length - 1} more
              </span>
            )}
          </div>
          <p className="text-xs text-[#e9edef] truncate group-hover:text-emerald-400 transition-colors">
            {latestPinned.text || `[${latestPinned.contentType.replace('_', ' ')}]`}
          </p>
        </div>
      </div>

      {isSuperAdmin && onUnpin && (
        <button
          type="button"
          onClick={() => onUnpin(latestPinned.id)}
          className="p-1 rounded-full text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] transition-colors"
          title="Unpin message"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
