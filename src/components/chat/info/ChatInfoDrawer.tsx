'use client';

import { Conversation, User } from '@/types';
import { useAuthStore } from '@/stores/useAuthStore';
import { useChatStore } from '@/stores/useChatStore';
import { useUserMap } from '@/hooks/useUserMap';
import { resolveConversationDetails } from '@/lib/utils/conversation';
import { Avatar } from '@/components/common/Avatar';
import { LabelSelector } from './LabelSelector';
import { X, Phone, Mail, GraduationCap, FileText, Users, Calendar, Shield, Trash2 } from 'lucide-react';
import { formatWhatsAppChatDate } from '@/lib/utils/formatters';

interface ChatInfoDrawerProps {
  conversation: Conversation;
  onUpdateLabels?: (labelIds: string[]) => Promise<unknown>;
  onDeleteGroup?: (groupId: string) => Promise<unknown>;
}

export function ChatInfoDrawer({
  conversation,
  onUpdateLabels,
  onDeleteGroup,
}: ChatInfoDrawerProps) {
  const { user } = useAuthStore();
  const userMap = useUserMap();
  const { isInfoDrawerOpen, setIsInfoDrawerOpen } = useChatStore();

  if (!isInfoDrawerOpen) return null;

  const details = resolveConversationDetails(conversation, user, userMap);
  const { isGroup, student, title, avatarName, phoneNumber, batchLabel } = details;
  const isSuperAdmin = user?.role === 'super_admin';
  const isAgentOrAdmin = user?.role === 'agent' || isSuperAdmin;

  const labelIds = (conversation.labels || []).map((l) => (typeof l === 'string' ? l : l.id));

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-80 lg:w-96 lg:relative flex-shrink-0 bg-[#111b21] border-l border-[#222e35] flex flex-col h-full overflow-y-auto animate-slide-left z-40">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-[#202c33] border-b border-[#222e35]">
        <h3 className="text-sm font-semibold text-[#e9edef]">
          {isGroup ? 'Group Information' : 'Student Contact Details'}
        </h3>
        <button
          type="button"
          onClick={() => setIsInfoDrawerOpen(false)}
          className="p-1.5 rounded-full text-[#8696a0] hover:text-[#e9edef] hover:bg-[#111b21] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Profile Card */}
        <div className="flex flex-col items-center text-center space-y-3 pb-6 border-b border-[#222e35]">
          <Avatar
            name={avatarName}
            isGroup={isGroup}
            size="xl"
          />
          <div>
            <h2 className="text-lg font-bold text-[#e9edef]">
              {title}
            </h2>
            <p className="text-xs text-[#8696a0] mt-0.5">
              {isGroup ? 'Staff Discussion Group' : phoneNumber || 'Student Support'}
            </p>
          </div>
        </div>

        {/* Student Details Section */}
        {!isGroup && (student || phoneNumber) && (
          <div className="space-y-4 pb-6 border-b border-[#222e35]">
            <h4 className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider">
              Profile Overview
            </h4>

            <div className="space-y-3">
              {phoneNumber && (
                <div className="flex items-center gap-3 text-xs text-[#d1d7db]">
                  <Phone className="w-4 h-4 text-[#8696a0] flex-shrink-0" />
                  <span>{phoneNumber}</span>
                </div>
              )}

              {student?.email && (
                <div className="flex items-center gap-3 text-xs text-[#d1d7db]">
                  <Mail className="w-4 h-4 text-[#8696a0] flex-shrink-0" />
                  <span>{student.email}</span>
                </div>
              )}

              {batchLabel && (
                <div className="flex items-center gap-3 text-xs text-[#d1d7db]">
                  <GraduationCap className="w-4 h-4 text-[#00a884] flex-shrink-0" />
                  <span className="font-semibold text-emerald-400">Cohort: {batchLabel}</span>
                </div>
              )}

              {student?.notes && (
                <div className="p-3 rounded-lg bg-[#202c33] border border-[#2a3942] space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8696a0]">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Admin Notes</span>
                  </div>
                  <p className="text-xs text-[#e9edef] whitespace-pre-wrap">{student.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Labels & Tags Section (For student support conversations) */}
        {!isGroup && isAgentOrAdmin && onUpdateLabels && (
          <div className="pb-6 border-b border-[#222e35]">
            <LabelSelector
              currentLabelIds={labelIds}
              onUpdateLabels={onUpdateLabels}
            />
          </div>
        )}

        {/* Group Participants Section */}
        {isGroup && (
          <div className="space-y-3 pb-6 border-b border-[#222e35]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#00a884]" />
                <span>Participants ({conversation.participantIds?.length || 0})</span>
              </h4>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {conversation.participantIds?.map((p, idx) => {
                const participant = typeof p === 'object' ? (p as User) : null;
                const pName = participant?.name || `Agent ${idx + 1}`;
                const pRole = participant?.role || 'agent';

                return (
                  <div
                    key={participant?.id || idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#202c33] border border-[#2a3942]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={pName} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#e9edef] truncate">{pName}</p>
                        <p className="text-[10px] text-[#8696a0]">{participant?.phoneNumber || 'Staff'}</p>
                      </div>
                    </div>
                    {pRole === 'super_admin' && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                        Admin
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Metadata info */}
        <div className="space-y-2 text-xs text-[#8696a0]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Created</span>
            </span>
            <span>{formatWhatsAppChatDate(conversation.createdAt)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Conversation Type</span>
            </span>
            <span className="capitalize">{conversation.type.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Delete Group Action for Super Admin (Groups only per backend requirements) */}
        {isGroup && isSuperAdmin && onDeleteGroup && (
          <div className="pt-4 border-t border-[#222e35]">
            <button
              type="button"
              onClick={() => {
                if (confirm('Are you sure you want to delete this agent group chat?')) {
                  onDeleteGroup(conversation.id);
                  setIsInfoDrawerOpen(false);
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Group Chat</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
