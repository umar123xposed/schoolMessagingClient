'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { conversationsApi } from '@/lib/api/conversations';
import { messagesApi } from '@/lib/api/messages';
import { uploadsApi } from '@/lib/api/uploads';
import { useUIStore } from '@/stores/useUIStore';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Avatar } from '@/components/common/Avatar';
import { Megaphone, Paperclip, Check, Radio } from 'lucide-react';
import { User, MessageContentType } from '@/types';

export function BroadcastModal() {
  const { isBroadcastModalOpen, setBroadcastModalOpen, addToast } = useUIStore();

  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'selected'>('all');
  const [selectedConvIds, setSelectedConvIds] = useState<string[]>([]);
  const [messageText, setMessageText] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: convResult } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => conversationsApi.getConversations({ limit: 100 }),
    enabled: isBroadcastModalOpen,
  });

  const studentConversations = (convResult?.results || []).filter((c) => c.type === 'student_support');

  const toggleSelectConv = (id: string) => {
    setSelectedConvIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = messageText.trim();
    if (!trimmed && !attachedFile) {
      setError('Please provide a message or attach a file to broadcast');
      return;
    }

    if (broadcastTarget === 'selected' && selectedConvIds.length === 0) {
      setError('Please select at least one recipient student conversation');
      return;
    }

    setIsSending(true);
    try {
      let attachment;
      let contentType: MessageContentType = 'text';

      if (attachedFile) {
        if (attachedFile.type.startsWith('image/')) contentType = 'image';
        else if (attachedFile.type === 'application/pdf') contentType = 'pdf';
        else if (attachedFile.type.startsWith('video/')) contentType = 'video';
        else if (attachedFile.type.startsWith('audio/')) contentType = 'audio';
        else contentType = 'file';

        attachment = await uploadsApi.uploadFile(contentType, attachedFile);
      }

      const result = await messagesApi.broadcastMessage({
        contentType,
        text: trimmed || undefined,
        attachment,
        toAll: broadcastTarget === 'all',
        targetConversationIds: broadcastTarget === 'selected' ? selectedConvIds : undefined,
      });

      addToast({
        type: 'success',
        title: 'Broadcast Dispatched',
        message: `Successfully broadcast message to ${result.count} conversations`,
      });

      setBroadcastModalOpen(false);
      setMessageText('');
      setAttachedFile(null);
      setSelectedConvIds([]);
      setBroadcastTarget('all');
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Broadcast failed to dispatch';
      setError(errorMsg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      isOpen={isBroadcastModalOpen}
      onClose={() => setBroadcastModalOpen(false)}
      title="Broadcast Announcement"
      description="Send a message to multiple student chats simultaneously"
      maxWidth="lg"
    >
      <form onSubmit={handleBroadcast} className="space-y-4">
        {/* Recipient Target Radio */}
        <div className="space-y-2 text-left">
          <label className="block text-xs font-semibold text-[#8696a0] uppercase tracking-wider">
            Recipients
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => setBroadcastTarget('all')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                broadcastTarget === 'all'
                  ? 'bg-[#00a884]/15 border-[#00a884] text-[#e9edef]'
                  : 'bg-[#202c33] border-[#2a3942] text-[#8696a0] hover:bg-[#2a3942]'
              }`}
            >
              <div className="flex items-center gap-2 font-medium text-xs">
                <Radio className="w-4 h-4 text-[#00a884]" />
                <span>All Active Students ({studentConversations.length})</span>
              </div>
            </div>

            <div
              onClick={() => setBroadcastTarget('selected')}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                broadcastTarget === 'selected'
                  ? 'bg-[#00a884]/15 border-[#00a884] text-[#e9edef]'
                  : 'bg-[#202c33] border-[#2a3942] text-[#8696a0] hover:bg-[#2a3942]'
              }`}
            >
              <div className="flex items-center gap-2 font-medium text-xs">
                <Radio className="w-4 h-4 text-[#00a884]" />
                <span>Select Students ({selectedConvIds.length})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected List picker if Target == Selected */}
        {broadcastTarget === 'selected' && (
          <div className="max-h-40 overflow-y-auto rounded-lg border border-[#2a3942] bg-[#111b21] p-1 space-y-1 custom-scrollbar">
            {studentConversations.map((c) => {
              const student = typeof c.studentId === 'object' ? (c.studentId as User) : null;
              const isSelected = selectedConvIds.includes(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => toggleSelectConv(c.id)}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-[#202c33] cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar name={student?.name || 'Student'} size="xs" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#e9edef] truncate">{student?.name || 'Student'}</p>
                      <p className="text-[10px] text-[#8696a0]">{student?.phoneNumber}</p>
                    </div>
                  </div>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border ${
                      isSelected ? 'bg-[#00a884] border-[#00a884] text-white' : 'border-[#2a3942]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Message Input */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-medium text-[#8696a0]">Message Content</label>
          <textarea
            rows={3}
            placeholder="Type broadcast message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="w-full rounded-lg bg-[#202c33] p-3 text-xs text-[#e9edef] placeholder-[#8696a0] outline-none border border-[#2a3942] focus:border-[#00a884] resize-none"
          />
        </div>

        {/* File Attachment */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#202c33] border border-[#2a3942]">
          <label className="inline-flex items-center gap-2 text-xs text-[#8696a0] hover:text-[#e9edef] cursor-pointer">
            <Paperclip className="w-4 h-4 text-[#00a884]" />
            <span>{attachedFile ? attachedFile.name : 'Attach file (optional)'}</span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setAttachedFile(f);
              }}
            />
          </label>
          {attachedFile && (
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="text-xs text-rose-400 hover:underline"
            >
              Remove
            </button>
          )}
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setBroadcastModalOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSending}>
            <Megaphone className="w-3.5 h-3.5" />
            <span>Dispatch Broadcast</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
