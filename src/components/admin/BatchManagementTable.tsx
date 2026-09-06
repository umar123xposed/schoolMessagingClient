'use client';

import React, { useState } from 'react';
import { useBatches } from '@/hooks/useBatches';
import { useUIStore } from '@/stores/useUIStore';
import { formatWhatsAppChatDate } from '@/lib/utils/formatters';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { GraduationCap, Plus, Edit2, Check, X, Trash2, RefreshCw, Layers } from 'lucide-react';

export function BatchManagementTable() {
  const {
    batches,
    isLoading,
    refetch,
    createBatch,
    isCreatingBatch,
    updateBatch,
    isUpdatingBatch,
  } = useBatches();
  const { setBatchDeleteModalOpen, addToast } = useUIStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const name = newBatchName.trim();
    if (!name) {
      setCreateError('Batch name cannot be empty');
      return;
    }

    try {
      await createBatch({ name });
      addToast({
        type: 'success',
        title: 'Batch Created',
        message: `Cohort batch "${name}" is now available.`,
      });
      setNewBatchName('');
      setIsCreating(false);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create batch (name may already exist)';
      setCreateError(errorMsg);
    }
  };

  const startEditing = (batch: { id: string; name: string }) => {
    setEditingBatchId(batch.id);
    setEditingName(batch.name);
    setEditError(null);
  };

  const cancelEditing = () => {
    setEditingBatchId(null);
    setEditingName('');
    setEditError(null);
  };

  const handleUpdateSubmit = async (batchId: string) => {
    setEditError(null);
    const name = editingName.trim();
    if (!name) {
      setEditError('Batch name cannot be empty');
      return;
    }

    try {
      await updateBatch({ batchId, payload: { name } });
      addToast({
        type: 'success',
        title: 'Batch Renamed',
        message: `Batch renamed to "${name}".`,
      });
      cancelEditing();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to rename batch';
      setEditError(errorMsg);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#e9edef]">Student Cohort Batches</h2>
          <p className="text-xs text-[#8696a0]">
            Manage authoritative cohorts. Students must be assigned to one of these valid batches.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            title="Refresh batches"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          {!isCreating && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setIsCreating(true);
                setCreateError(null);
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Create Cohort Batch</span>
            </Button>
          )}
        </div>
      </div>

      {/* Inline Create Form */}
      {isCreating && (
        <form
          onSubmit={handleCreateSubmit}
          className="p-4 rounded-xl bg-[#111b21] border border-[#00a884]/40 space-y-3 animate-slide-down"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#e9edef] flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-[#00a884]" />
              New Cohort Batch
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setCreateError(null);
              }}
              className="text-[#8696a0] hover:text-[#e9edef] text-xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder="Batch name"
                value={newBatchName}
                onChange={(e) => setNewBatchName(e.target.value)}
                autoFocus
                required
              />
            </div>
            <Button type="submit" variant="primary" size="sm" isLoading={isCreatingBatch}>
              Save Batch
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsCreating(false);
                setCreateError(null);
              }}
            >
              Cancel
            </Button>
          </div>

          {createError && (
            <p className="text-xs text-rose-400">{createError}</p>
          )}
        </form>
      )}

      {/* Batches Table */}
      <div className="rounded-xl bg-[#111b21] border border-[#222e35] overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 bg-[#202c33] border-b border-[#222e35] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#8696a0] uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-[#00a884]" />
            Registered Batches ({batches.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#182229] text-[#8696a0] uppercase tracking-wider font-semibold border-b border-[#222e35]">
              <tr>
                <th className="px-5 py-3">Batch Name</th>
                <th className="px-5 py-3">Created</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222e35] text-[#d1d7db]">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-[#8696a0]">
                    Loading batches...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-[#8696a0]">
                    No cohort batches registered yet. Click &quot;Create Cohort Batch&quot; above to add one.
                  </td>
                </tr>
              ) : (
                batches.map((batch) => {
                  const isEditing = editingBatchId === batch.id;
                  return (
                    <tr key={batch.id} className="hover:bg-[#182229] transition-colors">
                      <td className="px-5 py-3 font-semibold text-emerald-400">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="px-2 py-1 rounded bg-[#0c1317] border border-[#00a884] text-[#e9edef] text-xs font-mono outline-none"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdateSubmit(batch.id);
                                if (e.key === 'Escape') cancelEditing();
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateSubmit(batch.id)}
                              disabled={isUpdatingBatch}
                              className="p-1 rounded text-emerald-400 hover:bg-emerald-500/20"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="p-1 rounded text-[#8696a0] hover:bg-[#202c33]"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="font-mono text-[13px]">{batch.name}</span>
                        )}
                        {isEditing && editError && (
                          <p className="text-[11px] text-rose-400 mt-1">{editError}</p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-[#8696a0]">
                        {formatWhatsAppChatDate(batch.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isEditing && (
                            <button
                              type="button"
                              onClick={() => startEditing(batch)}
                              className="p-1.5 rounded-lg text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] transition-colors"
                              title="Rename batch"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setBatchDeleteModalOpen(true, { id: batch.id, name: batch.name })
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium transition-colors"
                            title="Cascading delete of batch and all associated students"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
