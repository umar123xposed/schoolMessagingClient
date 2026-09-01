'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/useAuthStore';
import { ToastContainer } from '@/components/common/Toast';
import { CreateGroupModal } from '@/components/modals/CreateGroupModal';
import { BroadcastModal } from '@/components/modals/BroadcastModal';
import { LabelManagerModal } from '@/components/modals/LabelManagerModal';
import { TemplateManagerModal } from '@/components/modals/TemplateManagerModal';
import { MediaViewerModal } from '@/components/modals/MediaViewerModal';
import { CreateUserModal } from '@/components/admin/CreateUserModal';
import { BatchDeleteConfirmModal } from '@/components/admin/BatchDeleteConfirmModal';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2, // 2 minutes
            retry: (failureCount, error: unknown) => {
              // Don't retry 401 or 403 or 404
              const status = (error as { response?: { status?: number } })?.response?.status;
              if (status === 401 || status === 403 || status === 404) return false;
              return failureCount < 2;
            },
            refetchOnWindowFocus: true,
          },
        },
      })
  );

  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ToastContainer />
      <CreateGroupModal />
      <BroadcastModal />
      <LabelManagerModal />
      <TemplateManagerModal />
      <MediaViewerModal />
      <CreateUserModal />
      <BatchDeleteConfirmModal />
    </QueryClientProvider>
  );
}
