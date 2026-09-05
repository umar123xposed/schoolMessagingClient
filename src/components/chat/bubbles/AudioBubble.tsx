'use client';

import React from 'react';
import { Attachment } from '@/types';
import { AudioPlayer } from '@/components/common/AudioPlayer';
import { UploadProgressRing } from '@/components/common/UploadProgressRing';

interface AudioBubbleProps {
  attachment: Attachment;
  isVoiceNote?: boolean;
  isOutgoing?: boolean;
  text?: string;
  uploadProgress?: number;
  status?: string;
}

export function AudioBubble({
  attachment,
  isVoiceNote = false,
  isOutgoing = false,
  text,
  uploadProgress,
  status,
}: AudioBubbleProps) {
  const isUploading =
    (typeof uploadProgress === 'number' && uploadProgress < 100) || status === 'sending';

  return (
    <div className="space-y-1">
      {isUploading ? (
        <div className="flex items-center gap-3 p-2 bg-black/20 rounded-lg min-w-[160px]">
          <UploadProgressRing progress={uploadProgress} size={36} strokeWidth={2.5} />
          <span className="text-xs font-medium text-[#e9edef]">
            {isVoiceNote ? 'Voice note' : 'Audio file'}
          </span>
        </div>
      ) : (
        <AudioPlayer
          src={attachment.url}
          initialDuration={attachment.duration}
          isVoiceNote={isVoiceNote}
          isOutgoing={isOutgoing}
        />
      )}
      {text && <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap break-words">{text}</p>}
    </div>
  );
}
