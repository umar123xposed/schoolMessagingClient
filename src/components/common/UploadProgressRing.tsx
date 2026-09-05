'use client';

import React from 'react';

interface UploadProgressRingProps {
  progress?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showPercentage?: boolean;
}

export function UploadProgressRing({
  progress = 0,
  size = 48,
  strokeWidth = 3,
  className = '',
  showPercentage = false,
}: UploadProgressRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, progress));
  const isIndeterminate = clamped <= 0;
  const displayPercent = isIndeterminate ? 28 : Math.max(12, clamped);
  const offset = circumference - (displayPercent / 100) * circumference;

  return (
    <div
      className={`relative flex items-center justify-center rounded-full bg-black/60 backdrop-blur-md shadow-lg select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        className={`absolute inset-0 -rotate-90 ${isIndeterminate ? 'animate-spin' : ''}`}
        width={size}
        height={size}
      >
        {/* Track background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#00a884"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-150 ease-out"
        />
      </svg>
      {showPercentage && (
        <span className="text-[10px] sm:text-[11px] font-bold text-white z-10">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}
