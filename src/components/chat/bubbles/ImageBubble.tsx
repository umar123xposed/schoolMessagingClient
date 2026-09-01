'use client';

import React, { useState } from 'react';
import { Attachment } from '@/types';
import { useUIStore } from '@/stores/useUIStore';
import { Eye, Download } from 'lucide-react';

interface ImageBubbleProps {
  attachment: Attachment;
  text?: string;
  isOutgoing?: boolean;
}

export function ImageBubble({ attachment, text }: ImageBubbleProps) {
  const { openMediaPreview } = useUIStore();
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="space-y-1 max-w-[300px]">
      <div
        onClick={() => openMediaPreview(attachment)}
        className="relative overflow-hidden rounded-lg cursor-pointer group bg-[#182229] min-h-[160px] flex items-center justify-center"
      >
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#202c33] animate-pulse">
            <Eye className="w-6 h-6 text-[#8696a0]" />
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachment.url}
          alt={attachment.fileName || 'Photo'}
          onLoad={() => setImageLoaded(true)}
          className="w-full max-h-[360px] object-cover transition-transform duration-200 group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <div className="p-2 rounded-full bg-black/60 text-white">
            <Eye className="w-5 h-5" />
          </div>
          <a
            href={attachment.url}
            download={attachment.fileName}
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80"
          >
            <Download className="w-5 h-5" />
          </a>
        </div>
      </div>
      {text && <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap break-words pt-1">{text}</p>}
    </div>
  );
}
