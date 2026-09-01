'use client';

import React from 'react';
import { Attachment } from '@/types';

interface VideoBubbleProps {
  attachment: Attachment;
  text?: string;
  isOutgoing?: boolean;
}

export function VideoBubble({ attachment, text }: VideoBubbleProps) {
  return (
    <div className="space-y-1 max-w-[320px]">
      <div className="overflow-hidden rounded-lg bg-black">
        <video
          src={attachment.url}
          controls
          playsInline
          className="w-full max-h-[360px] rounded-lg"
        />
      </div>
      {text && <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap break-words">{text}</p>}
    </div>
  );
}
