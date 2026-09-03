'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  onOpenChange?: (isOpen: boolean) => void;
}

export function Dropdown({
  trigger,
  items,
  align = 'right',
  className,
  onOpenChange,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    openUpward: boolean;
  }>({
    left: 0,
    openUpward: false,
  });

  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSetOpen = useCallback(
    (open: boolean) => {
      setIsOpen(open);
      onOpenChange?.(open);
    },
    [onOpenChange]
  );

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 208; // w-52 = 208px
    const estimatedHeight = menuRef.current?.offsetHeight || items.length * 42 + 20;
    const padding = 12;

    // Evaluate available space above vs below
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const shouldOpenUpward = spaceBelow < estimatedHeight && spaceAbove > spaceBelow;

    // Calculate left alignment
    let left: number;
    if (align === 'right') {
      left = rect.right - menuWidth;
    } else {
      left = rect.left;
    }

    // Horizontal boundary containment
    if (left + menuWidth > window.innerWidth - padding) {
      left = window.innerWidth - menuWidth - padding;
    }
    if (left < padding) {
      left = padding;
    }

    if (shouldOpenUpward) {
      setCoords({
        bottom: window.innerHeight - rect.top + 6,
        left,
        openUpward: true,
      });
    } else {
      setCoords({
        top: rect.bottom + 6,
        left,
        openUpward: false,
      });
    }
  }, [align, items.length]);

  useEffect(() => {
    if (!isOpen) return;

    // Immediately calculate coordinates when open
    updatePosition();

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        handleSetOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isOpen, updatePosition, handleSetOpen]);

  return (
    <div className="relative inline-block" ref={triggerRef}>
      <div
        onClick={(e) => {
          e.stopPropagation();
          handleSetOpen(!isOpen);
        }}
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {mounted &&
        isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: coords.top !== undefined ? `${coords.top}px` : undefined,
              bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
              left: `${coords.left}px`,
              zIndex: 99999,
            }}
            className={cn(
              'w-52 rounded-xl bg-[#233138] py-1.5 shadow-2xl border border-[#2a3942] animate-scale-in select-none',
              coords.openUpward ? 'origin-bottom' : 'origin-top',
              className
            )}
            onClick={(e) => e.stopPropagation()}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    item.onClick();
                    handleSetOpen(false);
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
          </div>,
          document.body
        )}
    </div>
  );
}
