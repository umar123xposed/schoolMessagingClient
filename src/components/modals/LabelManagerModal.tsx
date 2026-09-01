'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { labelsApi } from '@/lib/api/labels';
import { useUIStore } from '@/stores/useUIStore';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Badge } from '@/components/common/Badge';
import { Tag, Plus, Trash2, Edit2, Check } from 'lucide-react';
import { Label } from '@/types';

const PRESET_COLORS = [
  '#00a884',
  '#53bdeb',
  '#ffad1f',
  '#f15c5c',
  '#9c27b0',
  '#e91e63',
  '#4caf50',
  '#00bcd4',
  '#ff9800',
  '#795548',
];

export function LabelManagerModal() {
  const queryClient = useQueryClient();
  const { isLabelManagerModalOpen, setLabelManagerModalOpen, addToast } = useUIStore();

  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [editingLabelId, setEditingLabelId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: labelsResult, isLoading } = useQuery({
    queryKey: ['labels'],
    queryFn: () => labelsApi.getLabels(),
    enabled: isLabelManagerModalOpen,
  });

  const labels = labelsResult?.results || [];

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; color: string }) => labelsApi.createLabel(payload),
    onSuccess: (newLabel) => {
      queryClient.setQueryData(['labels'], (old: unknown) => {
        if (!old) return { results: [newLabel] };
        const data = old as { results: Label[] };
        return { ...data, results: [...data.results, newLabel] };
      });
      setName('');
      setColor(PRESET_COLORS[0]);
      addToast({ type: 'success', message: `Created label "${newLabel.name}"` });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name?: string; color?: string } }) =>
      labelsApi.updateLabel(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['labels'], (old: unknown) => {
        if (!old) return old;
        const data = old as { results: Label[] };
        return {
          ...data,
          results: data.results.map((l) => (l.id === updated.id ? updated : l)),
        };
      });
      setEditingLabelId(null);
      setName('');
      addToast({ type: 'success', message: 'Label updated' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => labelsApi.deleteLabel(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(['labels'], (old: unknown) => {
        if (!old) return old;
        const data = old as { results: Label[] };
        return {
          ...data,
          results: data.results.filter((l) => l.id !== id),
        };
      });
      addToast({ type: 'info', message: 'Label deleted' });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a label name');
      return;
    }

    try {
      if (editingLabelId) {
        await updateMutation.mutateAsync({
          id: editingLabelId,
          payload: { name: name.trim(), color },
        });
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          color,
        });
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to save label';
      setError(errorMsg);
    }
  };

  const handleStartEdit = (label: Label) => {
    setEditingLabelId(label.id);
    setName(label.name);
    setColor(label.color);
  };

  const handleCancelEdit = () => {
    setEditingLabelId(null);
    setName('');
    setColor(PRESET_COLORS[0]);
  };

  return (
    <Modal
      isOpen={isLabelManagerModalOpen}
      onClose={() => setLabelManagerModalOpen(false)}
      title="Conversation Labels"
      description="Manage color-coded tags for organizing student support chats"
      maxWidth="md"
    >
      <div className="space-y-6">
        {/* Form to create/edit */}
        <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-[#202c33] border border-[#2a3942] space-y-3">
          <Input
            label={editingLabelId ? 'Edit Label Name' : 'New Label Name'}
            placeholder="e.g. Urgent / Fee Inquiry / New Admission"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<Tag className="w-4 h-4 text-[#00a884]" />}
            required
          />

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-[#8696a0]">Pick Color</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-[#202c33]' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 text-xs border border-rose-500/30">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            {editingLabelId && (
              <Button type="button" variant="ghost" size="sm" onClick={handleCancelEdit}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{editingLabelId ? 'Update Label' : 'Add Label'}</span>
            </Button>
          </div>
        </form>

        {/* Existing labels list */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider text-left">
            Configured Labels ({labels.length})
          </h4>

          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {labels.length === 0 && !isLoading && (
              <p className="text-xs text-[#8696a0] italic text-center py-4">No custom labels yet</p>
            )}

            {labels.map((lbl) => (
              <div
                key={lbl.id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[#202c33] border border-[#2a3942]"
              >
                <Badge variant="custom" color={lbl.color} size="md">
                  {lbl.name}
                </Badge>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(lbl)}
                    className="p-1.5 rounded-md text-[#8696a0] hover:text-[#e9edef] hover:bg-[#111b21] transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(lbl.id)}
                    className="p-1.5 rounded-md text-[#8696a0] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
