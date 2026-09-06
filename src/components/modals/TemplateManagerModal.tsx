'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templatesApi } from '@/lib/api/templates';
import { useUIStore } from '@/stores/useUIStore';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { Template } from '@/types';

export function TemplateManagerModal() {
  const queryClient = useQueryClient();
  const { isTemplateManagerModalOpen, setTemplateManagerModalOpen, addToast } = useUIStore();

  const [shortcut, setShortcut] = useState('');
  const [content, setContent] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: templatesResult, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesApi.getTemplates(),
    enabled: isTemplateManagerModalOpen,
  });

  const templates = templatesResult?.results || [];

  const createMutation = useMutation({
    mutationFn: (payload: { shortcut: string; content: string }) =>
      templatesApi.createTemplate(payload),
    onSuccess: (newTemplate) => {
      queryClient.setQueryData(['templates'], (old: unknown) => {
        if (!old) return { results: [newTemplate] };
        const data = old as { results: Template[] };
        return { ...data, results: [...data.results, newTemplate] };
      });
      setShortcut('');
      setContent('');
      addToast({ type: 'success', message: `Created shortcut /${newTemplate.shortcut}` });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { shortcut?: string; content?: string };
    }) => templatesApi.updateTemplate(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['templates'], (old: unknown) => {
        if (!old) return old;
        const data = old as { results: Template[] };
        return {
          ...data,
          results: data.results.map((t) => (t.id === updated.id ? updated : t)),
        };
      });
      setEditingTemplateId(null);
      setShortcut('');
      setContent('');
      addToast({ type: 'success', message: 'Template updated' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => templatesApi.deleteTemplate(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(['templates'], (old: unknown) => {
        if (!old) return old;
        const data = old as { results: Template[] };
        return {
          ...data,
          results: data.results.filter((t) => t.id !== id),
        };
      });
      addToast({ type: 'info', message: 'Template deleted' });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanShortcut = shortcut.replace(/^\//, '').trim();
    if (!cleanShortcut) {
      setError('Please provide a shortcut name (e.g. 1 or fee)');
      return;
    }

    if (!content.trim()) {
      setError('Please enter template response text');
      return;
    }

    try {
      if (editingTemplateId) {
        await updateMutation.mutateAsync({
          id: editingTemplateId,
          payload: { shortcut: cleanShortcut, content: content.trim() },
        });
      } else {
        await createMutation.mutateAsync({
          shortcut: cleanShortcut,
          content: content.trim(),
        });
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to save template';
      setError(errorMsg);
    }
  };

  const handleStartEdit = (tpl: Template) => {
    setEditingTemplateId(tpl.id);
    setShortcut(tpl.shortcut);
    setContent(tpl.content);
  };

  const handleCancelEdit = () => {
    setEditingTemplateId(null);
    setShortcut('');
    setContent('');
  };

  return (
    <Modal
      isOpen={isTemplateManagerModalOpen}
      onClose={() => setTemplateManagerModalOpen(false)}
      title="Quick Replies & Templates"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Creation/Edit Form */}
        <form onSubmit={handleSubmit} className="p-4 rounded-xl bg-[#202c33] border border-[#2a3942] space-y-3">
          <div>
            <Input
              label="Shortcut Trigger"
              placeholder="Shortcut (e.g. 1)"
              value={shortcut}
              onChange={(e) => setShortcut(e.target.value)}
              leftIcon={<span className="text-[#00a884] font-bold">/</span>}
              required
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-medium text-[#8696a0]">Reply Message</label>
            <textarea
              rows={3}
              placeholder="Message text..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-lg bg-[#111b21] p-3 text-xs text-[#e9edef] placeholder-[#8696a0] outline-none border border-[#2a3942] focus:border-[#00a884] resize-none"
              required
            />
          </div>

          {error && (
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 text-xs border border-rose-500/30">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            {editingTemplateId && (
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
              <span>{editingTemplateId ? 'Update Template' : 'Add Template'}</span>
            </Button>
          </div>
        </form>

        {/* Existing Templates list */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-[#8696a0] uppercase tracking-wider text-left">
            Available Shortcuts ({templates.length})
          </h4>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {templates.length === 0 && !isLoading && (
              <p className="text-xs text-[#8696a0] italic text-center py-4">No shortcuts configured</p>
            )}

            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="flex items-start justify-between p-3 rounded-lg bg-[#202c33] border border-[#2a3942] gap-3"
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1 text-left">
                  <span className="px-2 py-0.5 rounded bg-[#111b21] text-[#00a884] font-mono text-xs font-bold flex-shrink-0">
                    /{tpl.shortcut}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-[#e9edef] whitespace-pre-wrap">{tpl.content}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(tpl)}
                    className="p-1.5 rounded-md text-[#8696a0] hover:text-[#e9edef] hover:bg-[#111b21] transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(tpl.id)}
                    className="p-1.5 rounded-md text-[#8696a0] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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
