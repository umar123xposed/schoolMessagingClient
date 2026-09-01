import { create } from 'zustand';
import { Attachment } from '@/types';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

interface UIState {
  isCreateGroupModalOpen: boolean;
  isBroadcastModalOpen: boolean;
  isLabelManagerModalOpen: boolean;
  isTemplateManagerModalOpen: boolean;
  isCreateUserModalOpen: boolean;
  isBatchDeleteModalOpen: boolean;
  selectedBatchForDeletion: string | null;
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
  setBatchDeleteModalOpen: (open: boolean, batchLabel?: string) => void;
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
  setBatchDeleteModalOpen: (open, batchLabel) =>
    set({ isBatchDeleteModalOpen: open, selectedBatchForDeletion: batchLabel || null }),

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
