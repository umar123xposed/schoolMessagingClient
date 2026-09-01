'use client';

import React from 'react';
import { Attachment } from '@/types';
import { AudioPlayer } from '@/components/common/AudioPlayer';

interface AudioBubbleProps {
  attachment: Attachment;
  isVoiceNote?: boolean;
  isOutgoing?: boolean;
  text?: string;
}

export function AudioBubble({ attachment, isVoiceNote = false, isOutgoing = false, text }: AudioBubbleProps) {
  return (
    <div className="space-y-1">
      <AudioPlayer
        src={attachment.url}
        initialDuration={attachment.duration}
        isVoiceNote={isVoiceNote}
        isOutgoing={isOutgoing}
      />
      {text && <p className="text-[14.2px] leading-[19px] whitespace-pre-wrap break-words">{text}</p>}
    </div>
  );
}
