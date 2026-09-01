'use client';

import React from 'react';
import { Trash2, Send, Pause, Play, Mic } from 'lucide-react';
import { formatDuration } from '@/lib/utils/formatters';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { cn } from '@/lib/utils/cn';

interface VoiceRecorderProps {
  onSendVoiceNote: (blob: Blob) => void;
  onCancel: () => void;
  recorder: ReturnType<typeof useVoiceRecorder>;
}

export function VoiceRecorder({ onSendVoiceNote, onCancel, recorder }: VoiceRecorderProps) {
  const {
    isPaused,
    recordingDuration,
    audioLevels,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
  } = recorder;

  const handleSend = async () => {
    const blob = await stopRecording();
    if (blob) {
      onSendVoiceNote(blob);
    }
  };

  const handleCancel = () => {
    cancelRecording();
    onCancel();
  };

  return (
    <div className="flex w-full items-center justify-between gap-3 px-3 py-1.5 animate-slide-up">
      {/* Delete / Cancel Button */}
      <button
        type="button"
        onClick={handleCancel}
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-rose-400 hover:bg-rose-500/10 transition-colors"
        title="Discard voice note"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      {/* Recording Duration & Pulsing Red Dot */}
      <div className="flex items-center gap-2">
        <span className={cn('h-2.5 w-2.5 rounded-full bg-rose-500', !isPaused && 'animate-pulse')} />
        <span className="font-mono text-sm font-semibold text-[#e9edef]">
          {formatDuration(recordingDuration)}
        </span>
      </div>

      {/* Real-time Waveform Bars */}
      <div className="flex flex-1 items-center justify-center gap-[3px] px-4 h-8 overflow-hidden">
        {audioLevels.length > 0 ? (
          audioLevels.map((lvl, idx) => (
            <div
              key={idx}
              style={{ height: `${Math.max(15, lvl)}%` }}
              className="w-[3px] rounded-full bg-[#00a884] transition-all duration-75"
            />
          ))
        ) : (
          <div className="flex items-center gap-1 text-xs text-[#8696a0]">
            <Mic className="w-3.5 h-3.5 animate-bounce text-[#00a884]" />
            <span>Listening...</span>
          </div>
        )}
      </div>

      {/* Pause / Resume Button */}
      <button
        type="button"
        onClick={isPaused ? resumeRecording : pauseRecording}
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] transition-colors"
      >
        {isPaused ? <Play className="w-5 h-5 ml-0.5" /> : <Pause className="w-5 h-5" />}
      </button>

      {/* Send Voice Note Button */}
      <button
        type="button"
        onClick={handleSend}
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white hover:bg-[#008f72] shadow-sm transition-transform active:scale-95"
        title="Send voice note"
      >
        <Send className="w-4 h-4 fill-current ml-0.5" />
      </button>
    </div>
  );
}
