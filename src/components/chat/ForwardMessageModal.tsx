'use client';

import React, { useState, useMemo } from 'react';
import { Message } from '@/types';
import { useConversations } from '@/hooks/useConversations';
import { useUserMap } from '@/hooks/useUserMap';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { resolveConversationDetails } from '@/lib/utils/conversation';
import { messagesApi } from '@/lib/api/messages';
import { soundEffects } from '@/lib/utils/sound';
import { Avatar } from '@/components/common/Avatar';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import {
  Search,
  Users,
  Send,
  CheckSquare,
  Square,
  FileText,
  ImageIcon,
  Mic,
  Video,
} from 'lucide-react';

interface ForwardMessageModalProps {
  message: Message | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ForwardMessageModal({
  message,
  isOpen,
  onClose,
  onSuccess,
}: ForwardMessageModalProps) {
  const { user } = useAuthStore();
  const userMap = useUserMap();
  const { addToast } = useUIStore();
  const { conversations } = useConversations();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'students' | 'groups'>('all');
  const [sendToAll, setSendToAll] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available conversations (both student support and staff groups)
  const availableConversations = useMemo(() => {
    return conversations.filter((c) => c.type === 'student_support' || c.type === 'agent_group');
  }, [conversations]);

  const studentCount = useMemo(
    () => availableConversations.filter((c) => c.type === 'student_support').length,
    [availableConversations]
  );
  const groupCount = useMemo(
    () => availableConversations.filter((c) => c.type === 'agent_group').length,
    [availableConversations]
  );

  // Filter conversations by category and search query
  const filteredConversations = useMemo(() => {
    let list = availableConversations;
    if (categoryFilter === 'students') {
      list = list.filter((c) => c.type === 'student_support');
    } else if (categoryFilter === 'groups') {
      list = list.filter((c) => c.type === 'agent_group');
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();

    return list.filter((c) => {
      const details = resolveConversationDetails(c, user, userMap);
      const nameMatch = details.title.toLowerCase().includes(q);
      const phoneMatch = details.phoneNumber?.toLowerCase().includes(q);
      const batchMatch = details.batchLabel?.toLowerCase().includes(q);
      return nameMatch || phoneMatch || batchMatch;
    });
  }, [availableConversations, categoryFilter, searchQuery, user, userMap]);

  const handleToggleSelect = (convId: string) => {
    setSelectedIds((prev) =>
      prev.includes(convId) ? prev.filter((id) => id !== convId) : [...prev, convId]
    );
  };

  const handleSelectAllFiltered = () => {
    const currentFilteredIds = filteredConversations.map((c) => c.id);
    const allSelected = currentFilteredIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentFilteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentFilteredIds])));
    }
  };

  const handleForward = async () => {
    if (!message) return;
    if (!sendToAll && selectedIds.length === 0) {
      addToast({
        type: 'warning',
        title: 'No recipients selected',
        message: 'Please select at least one chat or choose "Broadcast to All Students".',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (sendToAll) {
        await messagesApi.broadcastMessage({
          contentType: message.contentType,
          text: message.text,
          attachment: message.attachment,
          toAll: true,
        });
        soundEffects.playSent();
        addToast({
          type: 'success',
          title: 'Message forwarded',
          message: 'Successfully broadcasted to all students!',
        });
      } else {
        // Send to each selected conversation (supports both agent_group and student_support)
        await Promise.all(
          selectedIds.map((id) =>
            messagesApi.sendMessage(id, {
              contentType: message.contentType,
              text: message.text,
              attachment: message.attachment,
            })
          )
        );
        soundEffects.playSent();
        addToast({
          type: 'success',
          title: 'Message forwarded',
          message: `Successfully forwarded to ${selectedIds.length} chat${selectedIds.length === 1 ? '' : 's'}.`,
        });
      }

      onClose();
      onSuccess?.();
    } catch (err) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to forward message. Please try again.';
      addToast({
        type: 'error',
        title: 'Forwarding failed',
        message: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!message) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Forward Message"
      maxWidth="md"
      className="max-h-[85vh] flex flex-col"
    >
      <div className="flex flex-col gap-4 overflow-hidden -mx-6 -mb-6 p-6 pt-0">
        {/* Message Preview Box */}
        <div className="p-3 bg-[#182229] border border-[#222e35] rounded-xl flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#202c33] flex items-center justify-center flex-shrink-0 text-[#00a884]">
            {message.contentType === 'image' && <ImageIcon className="w-4 h-4" />}
            {(message.contentType === 'audio' || message.contentType === 'voice_note') && (
              <Mic className="w-4 h-4" />
            )}
            {message.contentType === 'video' && <Video className="w-4 h-4" />}
            {(message.contentType === 'pdf' || message.contentType === 'file') && (
              <FileText className="w-4 h-4" />
            )}
            {message.contentType === 'text' && <Send className="w-4 h-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider mb-0.5">
              Forwarding Content
            </p>
            {message.text ? (
              <p className="text-sm text-[#e9edef] line-clamp-2 break-words">{message.text}</p>
            ) : (
              <p className="text-sm text-[#8696a0] italic">
                {message.attachment?.fileName || `${message.contentType} attachment`}
              </p>
            )}
          </div>
        </div>

        {/* Send to all students Toggle Card */}
        <div
          onClick={() => setSendToAll((prev) => !prev)}
          className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer select-none transition-all ${
            sendToAll
              ? 'bg-[#00a884]/15 border-[#00a884] text-[#e9edef]'
              : 'bg-[#182229] border-[#222e35] text-[#8696a0] hover:border-[#374248]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                sendToAll ? 'bg-[#00a884] text-white' : 'bg-[#202c33] text-[#8696a0]'
              }`}
            >
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#e9edef]">Broadcast to All Students</p>
              <p className="text-xs text-[#8696a0]">
                Sends this message to every active student conversation
              </p>
            </div>
          </div>
          <div>
            {sendToAll ? (
              <CheckSquare className="w-5 h-5 text-[#00a884]" />
            ) : (
              <Square className="w-5 h-5 text-[#8696a0]" />
            )}
          </div>
        </div>

        {!sendToAll && (
          <>
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  categoryFilter === 'all'
                    ? 'bg-[#00a884] text-white'
                    : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
                }`}
              >
                All ({availableConversations.length})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('students')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  categoryFilter === 'students'
                    ? 'bg-[#00a884] text-white'
                    : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
                }`}
              >
                Students ({studentCount})
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('groups')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  categoryFilter === 'groups'
                    ? 'bg-[#00a884] text-white'
                    : 'bg-[#202c33] text-[#8696a0] hover:text-[#e9edef]'
                }`}
              >
                Staff Groups ({groupCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#8696a0] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats by name, phone or group..."
                className="w-full bg-[#202c33] text-[#e9edef] text-sm pl-10 pr-4 py-2 rounded-xl border border-transparent focus:border-[#00a884] focus:outline-none placeholder:text-[#8696a0]"
              />
            </div>

            {/* List Header / Select All */}
            <div className="flex items-center justify-between text-xs text-[#8696a0] px-1">
              <span>
                {filteredConversations.length} conversation
                {filteredConversations.length === 1 ? '' : 's'} found
              </span>
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="text-[#00a884] hover:underline font-medium"
              >
                {filteredConversations.every((c) => selectedIds.includes(c.id))
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>

            {/* Scrollable Conversation Checkbox List */}
            <div className="flex-1 max-h-56 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
              {filteredConversations.length === 0 ? (
                <div className="py-8 text-center text-[#8696a0] text-sm">
                  No matching chats found
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const details = resolveConversationDetails(conv, user, userMap);
                  const isSelected = selectedIds.includes(conv.id);

                  return (
                    <div
                      key={conv.id}
                      onClick={() => handleToggleSelect(conv.id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer border transition-colors ${
                        isSelected
                          ? 'bg-[#202c33] border-[#00a884]/40'
                          : 'bg-[#111b21] border-transparent hover:bg-[#182229]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          name={details.avatarName}
                          isGroup={details.isGroup}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-[#e9edef] truncate">
                              {details.title}
                            </p>
                            {details.isGroup && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-semibold flex-shrink-0">
                                Group
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#8696a0] truncate">
                            {details.isGroup
                              ? details.subtitle || 'Staff Discussion Group'
                              : details.phoneNumber || 'Student'}
                            {details.batchLabel ? ` • Cohort: ${details.batchLabel}` : ''}
                          </p>
                        </div>
                      </div>
                      <div>
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-[#00a884]" />
                        ) : (
                          <Square className="w-5 h-5 text-[#8696a0]" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#222e35] mt-2">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleForward}
            isLoading={isSubmitting}
            disabled={!sendToAll && selectedIds.length === 0}
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>
              {sendToAll
                ? 'Broadcast to All'
                : `Forward (${selectedIds.length})`}
            </span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
