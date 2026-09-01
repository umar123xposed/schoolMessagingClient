'use client';

import React from 'react';
import { Attachment } from '@/types';
import { formatFileSize } from '@/lib/utils/formatters';
import { FileText, Download } from 'lucide-react';

interface PdfBubbleProps {
  attachment: Attachment;
  text?: string;
  isOutgoing?: boolean;
}

export function PdfBubble({ attachment, text }: PdfBubbleProps) {
  return (
    <div className="space-y-1.5 min-w-[220px] max-w-[280px]">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-[#111b21]/40 border border-[#2a3942]/50">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-rose-500/20 text-rose-400 flex-shrink-0">
          <FileText className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#e9edef] truncate">{attachment.fileName}</p>
          <p className="text-[11px] text-[#8696a0]">{formatFileSize(attachment.size)} • PDF</p>
        </div>
        <a
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          download={attachment.fileName}
          className="p-2 rounded-full hover:bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] transition-colors"
        >
          <Download className="w-4 h-4" />
        </a>
      </div>
      {text && <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap break-words">{text}</p>}
    </div>
  );
}
