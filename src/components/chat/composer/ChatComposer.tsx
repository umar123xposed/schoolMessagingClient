'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { useTyping } from '@/hooks/useTyping';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { uploadsApi } from '@/lib/api/uploads';
import { SendMessagePayload, MessageContentType, Template } from '@/types';
import { Paperclip, Mic, Send, Layers, Loader2 } from 'lucide-react';
import { AttachmentPicker } from './AttachmentPicker';
import { VoiceRecorder } from './VoiceRecorder';
import { TemplatePicker } from './TemplatePicker';
import { MultiSendModal } from './MultiSendModal';

interface ChatComposerProps {
  conversationId: string;
  onSendMessage: (payload: SendMessagePayload) => Promise<unknown>;
  onSendMediaMessage?: (payload: {
    contentType: MessageContentType;
    file: File | Blob;
    fileName?: string;
    text?: string;
    duration?: number;
  }) => Promise<unknown>;
  onSendMultipleMessages: (payloads: SendMessagePayload[]) => Promise<unknown>;
  disabled?: boolean;
}

export function ChatComposer({
  conversationId,
  onSendMessage,
  onSendMediaMessage,
  onSendMultipleMessages,
  disabled = false,
}: ChatComposerProps) {
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const isAgentOrAdmin = user?.role === 'agent' || user?.role === 'super_admin';

  const [text, setText] = useState('');
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [isMultiSendOpen, setIsMultiSendOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Template quick-reply state
  const [templateQuery, setTemplateQuery] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { handleUserTyping, handleStopTypingImmediately } = useTyping(conversationId);
  const recorder = useVoiceRecorder();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    handleUserTyping();

    // Check if user is typing a template shortcut (e.g. /1 or /greeting)
    if (isAgentOrAdmin) {
      const match = val.match(/(?:^|\s)\/([a-zA-Z0-9_-]*)$/);
      if (match) {
        setTemplateQuery(match[0].trim());
      } else {
        setTemplateQuery(null);
      }
    }
  };

  const handleSelectTemplate = (template: Template) => {
    if (templateQuery) {
      const newText = text.replace(new RegExp(`${templateQuery}$`), template.content);
      setText(newText);
    } else {
      setText(template.content);
    }
    setTemplateQuery(null);
    textareaRef.current?.focus();
  };

  const handleSendText = async () => {
    const trimmed = text.trim();
    if (!trimmed || isUploading) return;

    handleStopTypingImmediately();
    setText('');
    setTemplateQuery(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      await onSendMessage({
        contentType: 'text',
        text: trimmed,
      });
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to send message';
      addToast({ type: 'error', message: errorMsg });
      setText(trimmed); // Restore text on failure
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleFileSelected = async (file: File, contentType: MessageContentType) => {
    const currentText = text.trim();
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    if (onSendMediaMessage) {
      try {
        await onSendMediaMessage({
          contentType,
          file,
          fileName: file.name,
          text: currentText || undefined,
        });
      } catch (err: unknown) {
        const errorMsg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Upload failed. Please check file type and size.';
        addToast({ type: 'error', title: 'Attachment Failed', message: errorMsg });
      }
      return;
    }

    // Fallback if onSendMediaMessage not supplied
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const attachment = await uploadsApi.uploadFile(contentType, file, file.name, (progress) => {
        setUploadProgress(progress);
      });

      await onSendMessage({
        contentType,
        attachment,
        text: currentText || undefined,
      });
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Upload failed. Please check file type and size.';
      addToast({ type: 'error', title: 'Attachment Failed', message: errorMsg });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSendVoiceNote = async (blob: Blob) => {
    const recordedDuration = recorder.recordingDuration;
    if (onSendMediaMessage) {
      try {
        await onSendMediaMessage({
          contentType: 'voice_note',
          file: blob,
          fileName: `voice_note_${Date.now()}.webm`,
          duration: recordedDuration > 0 ? recordedDuration : undefined,
        });
      } catch (err: unknown) {
        const errorMsg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to upload voice note';
        addToast({ type: 'error', message: errorMsg });
      }
      return;
    }

    // Fallback
    setIsUploading(true);
    try {
      const uploadedAttachment = await uploadsApi.uploadFile(
        'voice_note',
        blob,
        `voice_note_${Date.now()}.webm`,
        undefined,
        recordedDuration > 0 ? recordedDuration : undefined
      );
      await onSendMessage({
        contentType: 'voice_note',
        attachment: uploadedAttachment,
      });
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to upload voice note';
      addToast({ type: 'error', message: errorMsg });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative bg-[#202c33] px-4 py-2.5 border-t border-[#222e35]">
      {/* Quick Reply Template Autocomplete Picker */}
      {templateQuery && (
        <TemplatePicker
          query={templateQuery}
          onSelect={handleSelectTemplate}
          onClose={() => setTemplateQuery(null)}
        />
      )}

      {/* Attachment Category Picker Popover */}
      <AttachmentPicker
        isOpen={isAttachmentOpen}
        onClose={() => setIsAttachmentOpen(false)}
        onFileSelect={handleFileSelected}
      />

      {/* Multi-Message Send Modal for Agents */}
      {isMultiSendOpen && (
        <MultiSendModal
          isOpen={isMultiSendOpen}
          onClose={() => setIsMultiSendOpen(false)}
          onSendMultiple={onSendMultipleMessages}
        />
      )}

      {/* Uploading Progress Indicator */}
      {isUploading && (
        <div className="absolute -top-6 left-0 right-0 bg-[#111b21] px-4 py-1 border-t border-[#222e35] flex items-center justify-between text-xs text-[#8696a0] animate-slide-down">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00a884]" />
          <div className="w-28 bg-[#202c33] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#00a884] h-full transition-all duration-150"
              style={{ width: `${uploadProgress || 10}%` }}
            />
          </div>
        </div>
      )}

      {/* Voice Recorder Mode */}
      {recorder.isRecording ? (
        <VoiceRecorder
          recorder={recorder}
          onSendVoiceNote={handleSendVoiceNote}
          onCancel={() => recorder.cancelRecording()}
        />
      ) : (
        /* Standard WhatsApp Input Bar */
        <div className="flex items-end gap-2">
          {/* Attachment Paperclip Button */}
          <button
            type="button"
            disabled={disabled || isUploading}
            onClick={() => setIsAttachmentOpen(!isAttachmentOpen)}
            className="p-2 text-[#8696a0] hover:text-[#e9edef] hover:bg-[#111b21] rounded-full transition-colors flex-shrink-0"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Multi-send Mode Trigger for Agents/Admins */}
          {isAgentOrAdmin && (
            <button
              type="button"
              disabled={disabled || isUploading}
              onClick={() => setIsMultiSendOpen(true)}
              className="hidden sm:flex p-2 text-[#8696a0] hover:text-[#00a884] hover:bg-[#111b21] rounded-full transition-colors flex-shrink-0"
              title="Multi-message batch send"
            >
              <Layers className="w-5 h-5" />
            </button>
          )}

          {/* Textarea Input Container */}
          <div className="flex-1 flex items-center bg-[#2a3942] rounded-xl px-3.5 py-1.5 focus-within:ring-1 focus-within:ring-[#00a884]/60 transition-all min-h-[42px]">
            <textarea
              ref={textareaRef}
              rows={1}
              value={text}
              disabled={disabled || isUploading}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder={
                isAgentOrAdmin
                  ? "Type a message or type '/' for quick replies..."
                  : 'Type a message...'
              }
              className="w-full bg-transparent text-sm text-[#e9edef] placeholder-[#8696a0] outline-none resize-none max-h-28 leading-5 self-center"
            />
          </div>

          {/* Send or Voice Record Action Button */}
          {text.trim().length > 0 ? (
            <button
              type="button"
              disabled={disabled || isUploading}
              onClick={handleSendText}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white hover:bg-[#008f72] transition-transform active:scale-95 shadow-sm"
              title="Send message"
            >
              <Send className="w-4 h-4 fill-current ml-0.5" />
            </button>
          ) : (
            <button
              type="button"
              disabled={disabled || isUploading}
              onClick={() => recorder.startRecording()}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[#8696a0] hover:text-[#e9edef] hover:bg-[#111b21] transition-colors"
              title="Record voice note"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
