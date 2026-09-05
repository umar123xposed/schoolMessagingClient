'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, CreateUserPayload } from '@/lib/api/users';
import { useUIStore } from '@/stores/useUIStore';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { UserRole } from '@/types';
import { UserPlus, User, Phone, Lock, Mail, GraduationCap, Plus, Undo2 } from 'lucide-react';
import { useBatches } from '@/hooks/useBatches';

export function CreateUserModal() {
  const queryClient = useQueryClient();
  const { isCreateUserModalOpen, setCreateUserModalOpen, addToast } = useUIStore();
  const { batches, isLoading: isLoadingBatches, createBatch } = useBatches();

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('password1');
  const [role, setRole] = useState<UserRole>('student');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [isCreatingNewBatch, setIsCreatingNewBatch] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [notes, setNotes] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Auto-select first batch when batches load if not set
  React.useEffect(() => {
    if (batches.length > 0 && !selectedBatchId) {
      setSelectedBatchId(batches[0].id);
    }
  }, [batches, selectedBatchId]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => usersApi.createUser(payload),
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
      addToast({
        type: 'success',
        title: 'Account Provisioned',
        message: `Successfully created ${newUser.role} account for ${newUser.name}`,
      });
      setCreateUserModalOpen(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setName('');
    setPhoneNumber('');
    setPassword('password1');
    setRole('student');
    setSelectedBatchId(batches[0]?.id || '');
    setIsCreatingNewBatch(false);
    setNewBatchName('');
    setNotes('');
    setEmail('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const phoneClean = phoneNumber.trim();
    if (!/^\+?[0-9]{7,15}$/.test(phoneClean)) {
      setError('Phone number must contain 7-15 digits (e.g. +10000000003)');
      return;
    }

    if (!name.trim()) {
      setError('Please provide a full name');
      return;
    }

    let finalBatchId = selectedBatchId;

    // If user typed a new batch inline, create the batch first
    if (role === 'student' && isCreatingNewBatch) {
      const trimmedBatch = newBatchName.trim();
      if (!trimmedBatch) {
        setError('Please provide a name for the new batch');
        return;
      }
      try {
        const created = await createBatch({ name: trimmedBatch });
        finalBatchId = created.id;
        setSelectedBatchId(created.id);
        setIsCreatingNewBatch(false);
      } catch (batchErr: unknown) {
        const errorMsg =
          (batchErr as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to create batch';
        setError(errorMsg);
        return;
      }
    }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        phoneNumber: phoneClean,
        password,
        role,
        batchId: role === 'student' ? finalBatchId || undefined : undefined,
        notes: notes.trim() || undefined,
        email: email.trim() || undefined,
      });
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to provision user account';
      setError(errorMsg);
    }
  };

  return (
    <Modal
      isOpen={isCreateUserModalOpen}
      onClose={() => setCreateUserModalOpen(false)}
      title="Provision New Account"
      description="Create a student, agent, or super admin account with direct credentials"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role Selection Tabs */}
        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-semibold text-[#8696a0] uppercase tracking-wider">
            Account Role
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['student', 'agent', 'super_admin'] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize border transition-all ${
                  role === r
                    ? 'bg-[#00a884]/20 border-[#00a884] text-[#00a884]'
                    : 'bg-[#202c33] border-[#2a3942] text-[#8696a0] hover:bg-[#2a3942]'
                }`}
              >
                {r.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Full Name"
            placeholder="e.g. Alex Johnson"
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<User className="w-4 h-4 text-[#8696a0]" />}
            required
          />

          <Input
            label="Phone Number (Login ID)"
            placeholder="+10000000003"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            leftIcon={<Phone className="w-4 h-4 text-[#8696a0]" />}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Default Password"
            type="text"
            placeholder="password1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4 text-[#8696a0]" />}
            required
          />

          <Input
            label="Email (Optional for password recovery)"
            type="email"
            placeholder="alex@school.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4 text-[#8696a0]" />}
          />
        </div>

        {/* Student Specific Fields */}
        {role === 'student' && (
          <div className="p-3.5 rounded-xl bg-[#202c33] border border-[#2a3942] space-y-3 animate-fade-in">
            {/* Cohort Batch Selector (Authoritative BatchId) */}
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-[#8696a0]">
                  Cohort Batch (Required for Students)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNewBatch(!isCreatingNewBatch);
                    setNewBatchName('');
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-[#00a884] hover:underline"
                >
                  {isCreatingNewBatch ? (
                    <>
                      <Undo2 className="w-3 h-3" /> Select Existing
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" /> New Cohort Batch
                    </>
                  )}
                </button>
              </div>

              {isCreatingNewBatch ? (
                <Input
                  placeholder="e.g. 2026-fall"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  leftIcon={<GraduationCap className="w-4 h-4 text-[#00a884]" />}
                  required
                  autoFocus
                />
              ) : (
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#00a884]">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <select
                    value={selectedBatchId}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setIsCreatingNewBatch(true);
                      } else {
                        setSelectedBatchId(e.target.value);
                      }
                    }}
                    className="w-full rounded-xl bg-[#111b21] pl-9 pr-3 py-2.5 text-xs text-[#e9edef] border border-[#2a3942] focus:border-[#00a884] outline-none transition-colors appearance-none cursor-pointer"
                  >
                    {batches.length === 0 ? (
                      <option value="" disabled>
                        {isLoadingBatches ? 'Loading batches...' : 'No batches exist yet (Create one)'}
                      </option>
                    ) : (
                      batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))
                    )}
                    <option value="__NEW__">+ Create New Cohort Batch...</option>
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-medium text-[#8696a0]">
                Admin Internal Notes (Staff only)
              </label>
              <textarea
                rows={2}
                placeholder="Notes about student program, guardian details, or special support requirements..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg bg-[#111b21] p-2.5 text-xs text-[#e9edef] placeholder-[#8696a0] outline-none border border-[#2a3942] focus:border-[#00a884] resize-none"
              />
            </div>

            <p className="text-[11px] text-[#00a884] font-medium">
              ✓ Creating a student will automatically provision their one dedicated support conversation.
            </p>
          </div>
        )}

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-400">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setCreateUserModalOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={createMutation.isPending}>
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
}
