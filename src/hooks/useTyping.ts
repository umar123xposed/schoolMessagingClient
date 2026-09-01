'use client';

import { useRef, useCallback, useEffect } from 'react';
import { socketManager } from '@/lib/socket/socketManager';
import { useChatStore } from '@/stores/useChatStore';

export function useTyping(conversationId?: string | null) {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCurrentlyTypingRef = useRef(false);
  const { typingUsers } = useChatStore();

  const handleUserTyping = useCallback(() => {
    if (!conversationId) return;

    if (!isCurrentlyTypingRef.current) {
      isCurrentlyTypingRef.current = true;
      socketManager.emitTypingStart(conversationId);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isCurrentlyTypingRef.current = false;
      socketManager.emitTypingStop(conversationId);
    }, 2500);
  }, [conversationId]);

  const handleStopTypingImmediately = useCallback(() => {
    if (!conversationId || !isCurrentlyTypingRef.current) return;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    isCurrentlyTypingRef.current = false;
    socketManager.emitTypingStop(conversationId);
  }, [conversationId]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isCurrentlyTypingRef.current && conversationId) {
        socketManager.emitTypingStop(conversationId);
      }
    };
  }, [conversationId]);

  const activeTypingList = conversationId ? typingUsers[conversationId] || [] : [];
  // Filter out any stale typing events older than 4 seconds
  const now = Date.now();
  const validTyping = activeTypingList.filter((item) => now - item.timestamp < 4000);

  return {
    handleUserTyping,
    handleStopTypingImmediately,
    isOtherUserTyping: validTyping.length > 0,
    typingUsersCount: validTyping.length,
  };
}
