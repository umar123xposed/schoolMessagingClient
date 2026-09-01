'use client';

import React from 'react';
import { useChatStore } from '@/stores/useChatStore';
import { Search, X } from 'lucide-react';

export function ChatSearch() {
  const { searchQuery, setSearchQuery } = useChatStore();

  return (
    <div className="px-3 py-2 bg-[#111b21]">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#202c33] border border-[#2a3942] focus-within:border-[#00a884] focus-within:ring-1 focus-within:ring-[#00a884] transition-all">
        <Search className="w-4 h-4 text-[#8696a0] flex-shrink-0" />
        <input
          type="text"
          placeholder="Search or start new chat"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-xs text-[#e9edef] placeholder-[#8696a0] outline-none"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-[#8696a0] hover:text-[#e9edef] p-0.5 rounded-full"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
