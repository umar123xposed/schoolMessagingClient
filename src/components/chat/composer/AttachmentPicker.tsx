'use client';

import React, { useRef } from 'react';
import { ImageIcon, FileText, Music, Video, Paperclip } from 'lucide-react';
import { MessageContentType } from '@/types';
import { useUIStore } from '@/stores/useUIStore';

interface AttachmentPickerProps {
  onFileSelect: (file: File, contentType: MessageContentType) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function AttachmentPicker({ onFileSelect, isOpen, onClose }: AttachmentPickerProps) {
  const { addToast } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedTypeRef = useRef<MessageContentType>('file');

  if (!isOpen) return null;

  const handleTriggerInput = (type: MessageContentType, accept: string) => {
    selectedTypeRef.current = type;
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const contentType = selectedTypeRef.current;

    // Client-side size checks per backend spec
    const sizeMB = file.size / (1024 * 1024);
    const sizeLimits: Record<MessageContentType, number> = {
      image: 10,
      audio: 20,
      voice_note: 8,
      video: 60,
      pdf: 20,
      file: 30,
      text: 1,
    };

    const maxLimit = sizeLimits[contentType] || 30;
    if (sizeMB > maxLimit) {
      addToast({
        type: 'error',
        title: 'File Too Large',
        message: `Maximum allowed size for ${contentType} is ${maxLimit} MB.`,
      });
      return;
    }

    onFileSelect(file, contentType);
    onClose();

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const options = [
    {
      id: 'photos',
      label: 'Photos & Videos',
      icon: <ImageIcon className="w-5 h-5 text-purple-400" />,
      bg: 'bg-purple-500/20 hover:bg-purple-500/30',
      action: () => handleTriggerInput('image', 'image/*,video/*'),
    },
    {
      id: 'document',
      label: 'Document / PDF',
      icon: <FileText className="w-5 h-5 text-indigo-400" />,
      bg: 'bg-indigo-500/20 hover:bg-indigo-500/30',
      action: () => handleTriggerInput('pdf', 'application/pdf,.doc,.docx,.xls,.xlsx,.txt'),
    },
    {
      id: 'audio',
      label: 'Audio File',
      icon: <Music className="w-5 h-5 text-amber-400" />,
      bg: 'bg-amber-500/20 hover:bg-amber-500/30',
      action: () => handleTriggerInput('audio', 'audio/*'),
    },
    {
      id: 'video',
      label: 'Video',
      icon: <Video className="w-5 h-5 text-rose-400" />,
      bg: 'bg-rose-500/20 hover:bg-rose-500/30',
      action: () => handleTriggerInput('video', 'video/*'),
    },
    {
      id: 'file',
      label: 'Any File',
      icon: <Paperclip className="w-5 h-5 text-teal-400" />,
      bg: 'bg-teal-500/20 hover:bg-teal-500/30',
      action: () => handleTriggerInput('file', '*/*'),
    },
  ];

  return (
    <>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      {/* Backdrop */}
      <div className="fixed inset-0 z-30" onClick={onClose} />

      {/* Options Menu */}
      <div className="absolute bottom-full left-12 mb-3 z-40 rounded-2xl bg-[#202c33] p-2 border border-[#2a3942] shadow-2xl flex flex-col gap-1 w-48 animate-scale-in">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={opt.action}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-[#111b21] transition-colors"
          >
            <div className={`p-2 rounded-full ${opt.bg} flex-shrink-0`}>{opt.icon}</div>
            <span className="text-xs font-medium text-[#e9edef]">{opt.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
