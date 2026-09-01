'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic } from 'lucide-react';
import { formatDuration } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';

interface AudioPlayerProps {
  src: string;
  initialDuration?: number;
  isVoiceNote?: boolean;
  isOutgoing?: boolean;
  className?: string;
}

export function AudioPlayer({
  src,
  initialDuration = 0,
  isVoiceNote = false,
  isOutgoing = false,
  className,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(
    initialDuration && isFinite(initialDuration) && initialDuration > 0 ? initialDuration : 0
  );
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);

  // Static waveform mock heights for nice visual representation
  const waveformHeights = [
    30, 45, 25, 70, 85, 40, 60, 95, 80, 50, 65, 30, 45, 90, 75, 40, 60, 80, 55, 35, 70, 85, 45, 60,
    95, 75, 50, 65, 30, 45, 80, 60, 40, 55, 30,
  ];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      } else if (audio.duration === Infinity) {
        // Chrome WebM Infinity bug workaround: seek forward to trigger duration calculation
        audio.currentTime = 1e6;
        audio.ontimeupdate = () => {
          audio.ontimeupdate = null;
          if (audio.duration && isFinite(audio.duration)) {
            setDuration(audio.duration);
          } else if (audio.currentTime && isFinite(audio.currentTime) && audio.currentTime < 1e6) {
            setDuration(audio.currentTime);
          }
          audio.currentTime = 0;
          setCurrentTime(0);
        };
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      } else if (audio.currentTime > duration) {
        setDuration(audio.currentTime);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src, duration]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const togglePlaybackRate = () => {
    if (!audioRef.current) return;
    const rates = [1, 1.5, 2];
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIndex];
    setPlaybackRate(newRate);
    audioRef.current.playbackRate = newRate;
  };

  const effectiveDuration =
    duration > 0 && isFinite(duration)
      ? duration
      : initialDuration > 0 && isFinite(initialDuration)
      ? initialDuration
      : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressBarRef.current || effectiveDuration === 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newFraction = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = newFraction * effectiveDuration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const progressFraction = effectiveDuration > 0 ? Math.min(1, currentTime / effectiveDuration) : 0;

  return (
    <div className={cn('flex items-center gap-3 py-1 min-w-[240px] max-w-[320px] select-none', className)}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={cn(
          'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-transform active:scale-95 shadow-sm',
          isOutgoing ? 'bg-[#00a884] text-white hover:bg-[#008f72]' : 'bg-[#00a884] text-white hover:bg-[#008f72]'
        )}
      >
        {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
      </button>

      {/* Waveform & Scrubber */}
      <div className="flex flex-1 flex-col justify-center gap-1.5">
        <div
          ref={progressBarRef}
          onClick={handleSeek}
          className="relative flex h-7 cursor-pointer items-center gap-[2.5px] py-1"
        >
          {waveformHeights.map((height, i) => {
            const barFraction = i / waveformHeights.length;
            const isPlayed = barFraction <= progressFraction;
            return (
              <div
                key={i}
                style={{ height: `${height}%` }}
                className={cn(
                  'w-[3px] rounded-full transition-colors',
                  isPlayed
                    ? isOutgoing
                      ? 'bg-[#53bdeb]'
                      : 'bg-[#00a884]'
                    : isOutgoing
                    ? 'bg-[#2a5951]'
                    : 'bg-[#3b4a54]'
                )}
              />
            );
          })}
        </div>

        {/* Time and Speed Indicator */}
        <div className="flex items-center justify-between text-[11px] font-medium text-[#8696a0]">
          <span>{isPlaying || currentTime > 0 ? formatDuration(currentTime) : formatDuration(effectiveDuration)}</span>
          <div className="flex items-center gap-2">
            {isVoiceNote && <Mic className="h-3 w-3 text-[#53bdeb]" />}
            <button
              type="button"
              onClick={togglePlaybackRate}
              className="rounded bg-[#202c33] px-1.5 py-0.5 text-[10px] font-bold text-[#d1d7db] hover:bg-[#2a3942]"
            >
              {playbackRate}x
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
