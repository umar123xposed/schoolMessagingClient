import { create } from 'zustand';
import { Attachment } from '@/types';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

export interface BatchDeletionTarget {
  id: string;
  name: string;
}

interface UIState {
  isCreateGroupModalOpen: boolean;
  isBroadcastModalOpen: boolean;
  isLabelManagerModalOpen: boolean;
  isTemplateManagerModalOpen: boolean;
  isCreateUserModalOpen: boolean;
  isBatchDeleteModalOpen: boolean;
  selectedBatchForDeletion: BatchDeletionTarget | null;
  mediaPreview: {
    isOpen: boolean;
    attachment: Attachment | null;
  };
  toasts: ToastMessage[];

  setCreateGroupModalOpen: (open: boolean) => void;
  setBroadcastModalOpen: (open: boolean) => void;
  setLabelManagerModalOpen: (open: boolean) => void;
  setTemplateManagerModalOpen: (open: boolean) => void;
  setCreateUserModalOpen: (open: boolean) => void;
  setBatchDeleteModalOpen: (open: boolean, batch?: BatchDeletionTarget | string) => void;
  openMediaPreview: (attachment: Attachment) => void;
  closeMediaPreview: () => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isCreateGroupModalOpen: false,
  isBroadcastModalOpen: false,
  isLabelManagerModalOpen: false,
  isTemplateManagerModalOpen: false,
  isCreateUserModalOpen: false,
  isBatchDeleteModalOpen: false,
  selectedBatchForDeletion: null,
  mediaPreview: {
    isOpen: false,
    attachment: null,
  },
  toasts: [],

  setCreateGroupModalOpen: (open) => set({ isCreateGroupModalOpen: open }),
  setBroadcastModalOpen: (open) => set({ isBroadcastModalOpen: open }),
  setLabelManagerModalOpen: (open) => set({ isLabelManagerModalOpen: open }),
  setTemplateManagerModalOpen: (open) => set({ isTemplateManagerModalOpen: open }),
  setCreateUserModalOpen: (open) => set({ isCreateUserModalOpen: open }),
  setBatchDeleteModalOpen: (open, batch) => {
    let target: BatchDeletionTarget | null = null;
    if (batch) {
      if (typeof batch === 'string') {
        target = { id: batch, name: batch };
      } else {
        target = batch;
      }
    }
    set({ isBatchDeleteModalOpen: open, selectedBatchForDeletion: target });
  },

  openMediaPreview: (attachment) =>
    set({
      mediaPreview: {
        isOpen: true,
        attachment,
      },
    }),

  closeMediaPreview: () =>
    set({
      mediaPreview: {
        isOpen: false,
        attachment: null,
      },
    }),

  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
