'use client';

import React, { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { templatesApi } from '@/lib/api/templates';
import { Template } from '@/types';
import { Zap, Globe, User as UserIcon } from 'lucide-react';

interface TemplatePickerProps {
  query: string;
  onSelect: (template: Template) => void;
  onClose: () => void;
}

export function TemplatePicker({ query, onSelect, onClose }: TemplatePickerProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  const { data: templatesResult, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.getTemplates(),
    staleTime: 1000 * 60 * 5,
  });

  const templates = templatesResult?.results || [];

  // Filter templates matching the shortcut after '/'
  const searchFilter = query.startsWith('/') ? query.substring(1).toLowerCase() : query.toLowerCase();
  const filteredTemplates = templates.filter((t) =>
    t.shortcut.toLowerCase().includes(searchFilter) || t.content.toLowerCase().includes(searchFilter)
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (isLoading || filteredTemplates.length === 0) return null;

  return (
    <div
      ref={popupRef}
      className="absolute bottom-full left-4 mb-3 w-80 max-h-64 overflow-y-auto rounded-xl bg-[#202c33] border border-[#2a3942] shadow-2xl z-30 p-1.5 animate-scale-in"
    >
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-[#2a3942] text-[11px] font-semibold text-[#8696a0] uppercase tracking-wider">
        <Zap className="w-3 h-3 text-[#00a884]" />
        <span>Quick Replies (Templates)</span>
      </div>

      <div className="py-1 space-y-0.5">
        {filteredTemplates.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className="w-full flex items-start gap-2.5 px-3 py-2 rounded-lg text-left hover:bg-[#111b21] transition-colors group"
          >
            <span className="flex-shrink-0 mt-0.5 px-1.5 py-0.5 rounded bg-[#111b21] text-[#00a884] font-mono text-xs font-bold group-hover:bg-[#00a884] group-hover:text-white transition-colors">
              /{template.shortcut}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#e9edef] truncate">{template.content}</p>
              <div className="flex items-center gap-1 mt-0.5 text-[10px] text-[#8696a0]">
                {template.isShared ? (
                  <>
                    <Globe className="w-2.5 h-2.5" /> Shared
                  </>
                ) : (
                  <>
                    <UserIcon className="w-2.5 h-2.5" /> Personal
                  </>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
