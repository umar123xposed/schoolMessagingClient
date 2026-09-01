'use client';

import React from 'react';
import { Ban } from 'lucide-react';

export function DeletedBubble() {
  return (
    <div className="flex items-center gap-1.5 py-0.5 text-[13px] italic text-[#8696a0] select-none">
      <Ban className="w-3.5 h-3.5 text-[#8696a0]" />
      <span>This message was deleted</span>
    </div>
  );
}
