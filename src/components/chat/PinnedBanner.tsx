'use client';

import React, { useState, useEffect } from 'react';
import { Message } from '@/types';
import { Pin, X, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

interface PinnedBannerProps {
  pinnedMessages: Message[];
  onUnpin?: (messageId: string) => void;
  onScrollToMessage?: (messageId: string) => void;
}

export function PinnedBanner({ pinnedMessages, onUnpin, onScrollToMessage }: PinnedBannerProps) {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';

  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset cycle whenever the conversation changes
  const conversationId = pinnedMessages?.[0]?.conversationId;
  useEffect(() => {
    setCurrentIndex(0);
  }, [conversationId]);

  if (!pinnedMessages || pinnedMessages.length === 0) return null;

  // Newest pinned messages first
  const reversedPinned = [...pinnedMessages].reverse();
  const total = reversedPinned.length;
  const safeIndex = total > 0 ? currentIndex % total : 0;
  const currentPinned = reversedPinned[safeIndex];

  const handleBannerClick = () => {
    if (!currentPinned) return;
    // 1. Scroll directly to the current pinned message
    onScrollToMessage?.(currentPinned.id);
    // 2. Advance to the next pinned message in cycle
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  return (
    <div className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-[#182229]/95 backdrop-blur-md px-4 py-2 border-b border-[#222e35] shadow-sm animate-slide-down">
      <div
        onClick={handleBannerClick}
        className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer group select-none"
        title={total > 1 ? `Click to jump to pinned message (${safeIndex + 1} of ${total}). Click again to cycle to next.` : 'Click to jump to pinned message'}
      >
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex-shrink-0 group-hover:scale-105 transition-transform">
          <Pin className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              Pinned Message
            </span>
            {total > 1 && (
              <span className="text-[10px] bg-[#202c33] text-[#8696a0] px-1.5 py-0.5 rounded-full font-medium">
                {safeIndex + 1} of {total}
              </span>
            )}
          </div>
          <p className="text-xs text-[#e9edef] truncate group-hover:text-amber-300 transition-colors">
            {currentPinned.text || `[${currentPinned.contentType.replace('_', ' ')}]`}
          </p>
        </div>
        {total > 1 && (
          <div className="text-[#8696a0] group-hover:text-amber-400 text-xs flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-all flex-shrink-0">
            <ChevronRight className="w-4 h-4" />
          </div>
        )}
      </div>

      {isSuperAdmin && onUnpin && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUnpin(currentPinned.id);
          }}
          className="p-1 rounded-full text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] transition-colors flex-shrink-0"
          title="Unpin this message"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
