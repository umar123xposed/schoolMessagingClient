'use client';

import React from 'react';
import { Attachment } from '@/types';
import { useUIStore } from '@/stores/useUIStore';
import { Play, Maximize2 } from 'lucide-react';
import { UploadProgressRing } from '@/components/common/UploadProgressRing';
import { formatDuration } from '@/lib/utils/formatters';

interface VideoBubbleProps {
  attachment: Attachment;
  text?: string;
  isOutgoing?: boolean;
  uploadProgress?: number;
  status?: string;
}

export function VideoBubble({
  attachment,
  text,
  uploadProgress,
  status,
}: VideoBubbleProps) {
  const { openMediaPreview } = useUIStore();
  const isUploading =
    (typeof uploadProgress === 'number' && uploadProgress < 100) || status === 'sending';

  return (
    <div className="space-y-1 max-w-[320px]">
      <div
        onClick={() => {
          if (!isUploading) {
            openMediaPreview(attachment);
          }
        }}
        className="relative overflow-hidden rounded-lg cursor-pointer group bg-black min-h-[180px] flex items-center justify-center select-none shadow-md"
      >
        <video
          src={attachment.url}
          playsInline
          muted
          preload="metadata"
          className="w-full max-h-[360px] object-cover rounded-lg pointer-events-none"
        />

        {/* Uploading Circular Progress Overlay */}
        {isUploading ? (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-10">
            <UploadProgressRing progress={uploadProgress} size={54} strokeWidth={3.5} />
          </div>
        ) : (
          /* Play & Hover Overlay */
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/45 transition-colors flex items-center justify-center">
            {/* Center Play Button */}
            <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>

            {/* Corner Expand Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openMediaPreview(attachment);
              }}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
              title="Expand video"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Duration Badge */}
            {attachment.duration && attachment.duration > 0 && (
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[11px] font-medium text-white select-none">
                {formatDuration(attachment.duration)}
              </span>
            )}
          </div>
        )}
      </div>
      {text && (
        <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap break-words pt-1">
          {text}
        </p>
      )}
    </div>
  );
}
