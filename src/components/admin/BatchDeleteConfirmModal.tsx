'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { useUIStore } from '@/stores/useUIStore';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { AlertTriangle, Trash2 } from 'lucide-react';

export function BatchDeleteConfirmModal() {
  const queryClient = useQueryClient();
  const {
    isBatchDeleteModalOpen,
    setBatchDeleteModalOpen,
    selectedBatchForDeletion,
    addToast,
  } = useUIStore();

  const [confirmationInput, setConfirmationInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (batchLabel: string) => adminApi.requestBatchDeletion(batchLabel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
      queryClient.invalidateQueries({ queryKey: ['batch-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });

      addToast({
        type: 'warning',
        title: 'Batch Deletion Queued',
        message: `Deletion job initiated for cohort "${selectedBatchForDeletion}".`,
      });

      setBatchDeleteModalOpen(false);
      setConfirmationInput('');
    },
  });

  if (!isBatchDeleteModalOpen || !selectedBatchForDeletion) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (confirmationInput.trim() !== selectedBatchForDeletion) {
      setError(`Confirmation text must exactly match "${selectedBatchForDeletion}"`);
      return;
    }

    try {
      await deleteMutation.mutateAsync(selectedBatchForDeletion);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to request cohort deletion';
      setError(errorMsg);
    }
  };

  return (
    <Modal
      isOpen={isBatchDeleteModalOpen}
      onClose={() => setBatchDeleteModalOpen(false)}
      title="Irreversible Cohort Deletion"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2 text-left">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>Danger: Destructive Action</span>
          </div>
          <p className="text-xs text-[#e9edef] leading-relaxed">
            You are about to permanently delete all student accounts, support conversations,
            messages, and uploaded attachments associated with cohort batch{' '}
            <strong className="font-mono text-rose-400 bg-black/40 px-1 py-0.5 rounded">
              {selectedBatchForDeletion}
            </strong>
            . This cannot be undone.
          </p>
        </div>

        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-medium text-[#8696a0]">
            Please type <span className="text-[#e9edef] font-mono font-bold">{selectedBatchForDeletion}</span> below to confirm:
          </label>
          <Input
            placeholder={selectedBatchForDeletion}
            value={confirmationInput}
            onChange={(e) => setConfirmationInput(e.target.value)}
            required
            autoFocus
          />
        </div>

        {error && (
          <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setBatchDeleteModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            size="sm"
            disabled={confirmationInput !== selectedBatchForDeletion}
            isLoading={deleteMutation.isPending}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Permanently Delete Cohort</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
