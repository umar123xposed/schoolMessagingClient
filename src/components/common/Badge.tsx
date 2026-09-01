'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'custom';
  color?: string;
  size?: 'sm' | 'md';
  className?: string;
  onRemove?: () => void;
}

export function Badge({
  children,
  variant = 'default',
  color,
  size = 'sm',
  className,
  onRemove,
}: BadgeProps) {
  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  const variants = {
    default: 'bg-[#202c33] text-[#8696a0] border border-[#2a3942]',
    primary: 'bg-[#00a884]/20 text-[#00a884] border border-[#00a884]/30',
    success: 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40',
    warning: 'bg-amber-950/60 text-amber-400 border border-amber-800/40',
    danger: 'bg-rose-950/60 text-rose-400 border border-rose-800/40',
    custom: '',
  };

  const customStyle = color
    ? {
        backgroundColor: `${color}20`,
        borderColor: `${color}50`,
        color: color,
      }
    : undefined;

  return (
    <span
      style={customStyle}
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium select-none',
        sizeClasses[size],
        variant !== 'custom' && variants[variant],
        color && 'border',
        className
      )}
    >
      {color && (
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      <span>{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:text-white rounded-full p-0.5 transition-colors"
        >
          ×
        </button>
      )}
    </span>
  );
}
