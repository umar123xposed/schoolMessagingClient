'use client';

import React, { useEffect } from 'react';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useAuthStore } from '@/stores/useAuthStore';
import { useChatStore } from '@/stores/useChatStore';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { useSocket } from '@/hooks/useSocket';

import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { ChatSearch } from '@/components/sidebar/ChatSearch';
import { FilterChips } from '@/components/sidebar/FilterChips';
import { ConversationList } from '@/components/sidebar/ConversationList';

import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList';
import { ChatComposer } from '@/components/chat/composer/ChatComposer';
import { ChatInfoDrawer } from '@/components/chat/info/ChatInfoDrawer';

import { MessageSquare, Lock } from 'lucide-react';
import { Conversation } from '@/types';

export default function ChatPage() {
  return (
    <RoleGuard requireAuth={true}>
      <ChatApp />
    </RoleGuard>
  );
}

function ChatApp() {
  const { user } = useAuthStore();
  const { isSocketReady } = useSocket();
  const {
    activeConversation,
    activeConversationId,
    setActiveConversation,
    searchInChatQuery,
  } = useChatStore();

  const {
    conversations,
    isLoading: isLoadingConversations,
    updateLabels,
    deleteGroup,
  } = useConversations();

  const {
    messages,
    sendMessage,
    sendMultipleMessages,
    pinMessage,
    deleteMessage,
  } = useMessages(activeConversationId);

  const isStudent = user?.role === 'student';

  // Automatically select the student's single conversation
  useEffect(() => {
    if (isStudent && conversations.length > 0 && !activeConversationId) {
      setActiveConversation(conversations[0]);
    }
  }, [isStudent, conversations, activeConversationId, setActiveConversation]);

  // Keep active conversation reference in sync when conversations list updates
  useEffect(() => {
    if (activeConversationId && conversations.length > 0) {
      const updated = conversations.find((c) => c.id === activeConversationId);
      if (updated && updated !== activeConversation) {
        setActiveConversation(updated);
      }
    }
  }, [conversations, activeConversationId, activeConversation, setActiveConversation]);

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversation(conv);
  };

  const handleBackToSidebar = () => {
    setActiveConversation(null);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#111b21]">
      {/* LEFT PANE: Sidebar (Conversation List & Filters) */}
      {/* On mobile: hidden if a chat is active */}
      <div
        className={`w-full lg:w-96 xl:w-[420px] flex-shrink-0 flex flex-col h-full bg-[#111b21] border-r border-[#222e35] transition-all ${
          activeConversationId && !isStudent ? 'hidden lg:flex' : 'flex'
        }`}
      >
        <SidebarHeader />
        {!isStudent && (
          <>
            <ChatSearch />
            <FilterChips />
          </>
        )}
        <ConversationList
          conversations={conversations}
          isLoading={isLoadingConversations}
          onSelectConversation={handleSelectConversation}
        />

        {/* Bottom Connection Status Pill */}
        <div className="px-4 py-2 bg-[#0b141a] border-t border-[#222e35] flex items-center justify-between text-[11px] text-[#8696a0]">
          <div className="flex items-center gap-1.5">
            {isSocketReady ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-400 font-medium">Real-Time Connected</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Connecting live sync...</span>
              </>
            )}
          </div>
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3" /> Encrypted
          </span>
        </div>
      </div>

      {/* CENTER & RIGHT PANE: Active Chat & Info Drawer */}
      {/* On mobile: hidden if no chat is active, unless student */}
      <div
        className={`flex-1 flex h-full min-w-0 transition-all ${
          !activeConversationId && !isStudent ? 'hidden lg:flex' : 'flex'
        }`}
      >
        {activeConversation ? (
          <div className="flex-1 flex h-full min-w-0">
            {/* Main Chat Stream & Composer */}
            <div className="flex-1 flex flex-col h-full min-w-0">
              <ChatHeader
                conversation={activeConversation}
                onBackToSidebar={handleBackToSidebar}
              />
              <MessageList
                messages={messages}
                conversation={activeConversation}
                onPinMessage={pinMessage}
                onDeleteMessage={deleteMessage}
                searchQuery={searchInChatQuery}
              />
              <ChatComposer
                conversationId={activeConversation.id}
                onSendMessage={sendMessage}
                onSendMultipleMessages={sendMultipleMessages}
              />
            </div>

            {/* Right-hand Info Drawer */}
            <ChatInfoDrawer
              conversation={activeConversation}
              onUpdateLabels={(labelIds) => updateLabels({ id: activeConversation.id, labelIds })}
              onDeleteGroup={(groupId) => deleteGroup(groupId)}
            />
          </div>
        ) : (
          /* Empty State Placeholder (WhatsApp Web style desktop splash) */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#222e35]/40 border-b-8 border-[#00a884]">
            <div className="flex items-center justify-center w-24 h-24 rounded-full bg-[#202c33] text-[#00a884] mb-6 shadow-xl border border-[#2a3942]">
              <MessageSquare className="w-12 h-12 stroke-[1.5]" />
            </div>
            <h2 className="text-2xl font-light text-[#e9edef] mb-2">School Support Desk</h2>
            <p className="text-sm text-[#8696a0] max-w-md leading-relaxed mb-6">
              Select a conversation from the sidebar to view student requests, answer questions, and
              collaborate with school staff.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#8696a0] bg-[#111b21] px-4 py-2 rounded-full border border-[#2a3942]">
              <Lock className="w-3.5 h-3.5 text-[#00a884]" />
              <span>Internal School Communications Network</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
