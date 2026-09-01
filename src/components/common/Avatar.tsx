'use client';

import React from 'react';
import { cn } from '@/lib/utils/cn';
import { getInitials, getAvatarBgColor } from '@/lib/utils/formatters';
import { Users, User as UserIcon } from 'lucide-react';

interface AvatarProps {
  name?: string;
  isGroup?: boolean;
  isOnline?: boolean;
  showOnlineStatus?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({
  name,
  isGroup = false,
  isOnline = false,
  showOnlineStatus = false,
  size = 'md',
  className,
}: AvatarProps) {
  const sizeClasses = {
    xs: 'w-7 h-7 text-xs',
    sm: 'w-9 h-9 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  };

  const statusDotSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
  };

  const initials = getInitials(name);
  const bgColor = isGroup ? 'bg-teal-700' : getAvatarBgColor(name);

  return (
    <div className={cn('relative inline-flex flex-shrink-0 select-none items-center justify-center rounded-full font-medium text-white shadow-sm', sizeClasses[size], bgColor, className)}>
      {isGroup ? (
        <Users className="w-1/2 h-1/2" />
      ) : initials !== '?' ? (
        <span>{initials}</span>
      ) : (
        <UserIcon className="w-1/2 h-1/2 opacity-80" />
      )}

      {showOnlineStatus && isOnline && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full bg-emerald-500 ring-2 ring-[#111b21]',
            statusDotSizes[size]
          )}
        />
      )}
    </div>
  );
}
