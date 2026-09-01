'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const variants = {
      primary: 'bg-[#00a884] text-white hover:bg-[#008f72] shadow-sm',
      secondary: 'bg-[#202c33] text-[#e9edef] hover:bg-[#2a3942] border border-[#2a3942]',
      ghost: 'bg-transparent text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33]/60',
      danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
      outline: 'bg-transparent text-[#e9edef] border border-[#2a3942] hover:bg-[#202c33]',
      icon: 'bg-transparent text-[#aebac1] hover:text-[#e9edef] hover:bg-[#202c33] rounded-full p-2',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2.5 gap-2',
      lg: 'text-base px-5 py-3 gap-2.5',
      icon: 'p-2 w-10 h-10',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
