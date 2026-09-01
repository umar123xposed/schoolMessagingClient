'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: (DropdownItem | 'divider')[];
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, items, align = 'right', className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={cn('relative inline-block text-left', isOpen && 'z-50')} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {isOpen && (
        <div
          className={cn(
            'absolute z-[100] mt-1.5 w-52 rounded-xl bg-[#233138] py-1.5 shadow-2xl border border-[#2a3942] animate-scale-in origin-top',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
        >
          {items.map((item, idx) => {
            if (item === 'divider') {
              return <div key={`divider-${idx}`} className="my-1 border-t border-[#2a3942]" />;
            }

            return (
              <button
                key={item.id}
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed',
                  item.danger
                    ? 'text-rose-400 hover:bg-rose-500/10'
                    : 'text-[#d1d7db] hover:bg-[#182229] hover:text-[#e9edef]'
                )}
              >
                {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
                <span className="flex-1">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
