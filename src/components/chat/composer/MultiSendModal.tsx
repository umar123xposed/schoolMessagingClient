'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { SendMessagePayload, MessageContentType } from '@/types';
import { uploadsApi } from '@/lib/api/uploads';
import { Plus, Trash2, Send, Paperclip } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';

interface MultiSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMultiple: (payloads: SendMessagePayload[]) => Promise<unknown>;
}

export function MultiSendModal({ isOpen, onClose, onSendMultiple }: MultiSendModalProps) {
  const { addToast } = useUIStore();
  const [messagesQueue, setMessagesQueue] = useState<
    Array<{
      id: string;
      contentType: MessageContentType;
      text?: string;
      file?: File;
    }>
  >([
    { id: '1', contentType: 'text', text: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddText = () => {
    setMessagesQueue((prev) => [...prev, { id: Math.random().toString(), contentType: 'text', text: '' }]);
  };

  const handleRemove = (id: string) => {
    if (messagesQueue.length <= 1) return;
    setMessagesQueue((prev) => prev.filter((m) => m.id !== id));
  };

  const handleTextChange = (id: string, text: string) => {
    setMessagesQueue((prev) => prev.map((m) => (m.id === id ? { ...m, text } : m)));
  };

  const handleFileAttach = (id: string, file: File) => {
    let contentType: MessageContentType = 'file';
    if (file.type.startsWith('image/')) contentType = 'image';
    else if (file.type === 'application/pdf') contentType = 'pdf';
    else if (file.type.startsWith('video/')) contentType = 'video';
    else if (file.type.startsWith('audio/')) contentType = 'audio';

    setMessagesQueue((prev) =>
      prev.map((m) => (m.id === id ? { ...m, file, contentType } : m))
    );
  };

  const handleSendAll = async () => {
    // Validate that at least one item has content
    const validItems = messagesQueue.filter((m) => (m.text && m.text.trim().length > 0) || m.file);
    if (validItems.length === 0) {
      addToast({ type: 'warning', message: 'Please enter message text or attach files' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payloads: SendMessagePayload[] = [];

      for (const item of validItems) {
        if (item.file) {
          const attachment = await uploadsApi.uploadFile(item.contentType, item.file);
          payloads.push({
            contentType: item.contentType,
            attachment,
            text: item.text?.trim() || undefined,
          });
        } else if (item.text && item.text.trim().length > 0) {
          payloads.push({
            contentType: 'text',
            text: item.text.trim(),
          });
        }
      }

      await onSendMultiple(payloads);
      addToast({ type: 'success', message: `Dispatched ${payloads.length} messages simultaneously` });
      onClose();
      setMessagesQueue([{ id: '1', contentType: 'text', text: '' }]);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to dispatch multiple messages';
      addToast({ type: 'error', message: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Multi-Message Batch Dispatch"
      description="Queue several messages and send them concurrently in a single batch"
      maxWidth="lg"
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        {messagesQueue.map((item, idx) => (
          <div
            key={item.id}
            className="p-3.5 rounded-xl bg-[#202c33] border border-[#2a3942] space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#00a884]">Message #{idx + 1}</span>
              {messagesQueue.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="p-1 rounded-md text-[#8696a0] hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <textarea
              rows={2}
              placeholder="Type message content..."
              value={item.text || ''}
              onChange={(e) => handleTextChange(item.id, e.target.value)}
              className="w-full rounded-lg bg-[#111b21] p-2.5 text-xs text-[#e9edef] placeholder-[#8696a0] outline-none border border-[#2a3942] focus:border-[#00a884] resize-none"
            />

            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center gap-1.5 text-xs text-[#8696a0] hover:text-[#e9edef] cursor-pointer">
                <Paperclip className="w-3.5 h-3.5 text-[#00a884]" />
                <span>{item.file ? item.file.name : 'Attach file'}</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileAttach(item.id, f);
                  }}
                />
              </label>

              {item.file && (
                <span className="text-[10px] bg-[#111b21] text-emerald-400 px-2 py-0.5 rounded-full">
                  {item.contentType}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-[#222e35] mt-4">
        <Button type="button" variant="secondary" size="sm" onClick={handleAddText}>
          <Plus className="w-3.5 h-3.5" />
          <span>Add Another Message</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSendAll}
            isLoading={isSubmitting}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Batch ({messagesQueue.length})</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
