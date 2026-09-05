'use client';

import React from 'react';
import { Attachment } from '@/types';
import { formatFileSize } from '@/lib/utils/formatters';
import { File, Download } from 'lucide-react';
import { UploadProgressRing } from '@/components/common/UploadProgressRing';

interface FileBubbleProps {
  attachment: Attachment;
  text?: string;
  isOutgoing?: boolean;
  uploadProgress?: number;
  status?: string;
}

export function FileBubble({
  attachment,
  text,
  uploadProgress,
  status,
}: FileBubbleProps) {
  const isUploading =
    (typeof uploadProgress === 'number' && uploadProgress < 100) || status === 'sending';

  return (
    <div className="space-y-1.5 min-w-[220px] max-w-[290px]">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-[#111b21]/40 border border-[#2a3942]/50 shadow-sm">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sky-500/20 text-sky-400 flex-shrink-0">
          <File className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#e9edef] truncate">{attachment.fileName}</p>
          <p className="text-[11px] text-[#8696a0]">
            {formatFileSize(attachment.size)} • File
          </p>
        </div>
        {isUploading ? (
          <div className="flex-shrink-0">
            <UploadProgressRing progress={uploadProgress} size={36} strokeWidth={2.5} />
          </div>
        ) : (
          <a
            href={attachment.url}
            download={attachment.fileName}
            className="p-2 rounded-full hover:bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] transition-colors flex-shrink-0"
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </a>
        )}
      </div>
      {text && (
        <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap break-words">{text}</p>
      )}
    </div>
  );
}
