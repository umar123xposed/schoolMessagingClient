'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, CreateUserPayload } from '@/lib/api/users';
import { useUIStore } from '@/stores/useUIStore';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { UserRole } from '@/types';
import { UserPlus, User, Phone, Lock, Mail, GraduationCap } from 'lucide-react';

export function CreateUserModal() {
  const queryClient = useQueryClient();
  const { isCreateUserModalOpen, setCreateUserModalOpen, addToast } = useUIStore();

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('password1');
  const [role, setRole] = useState<UserRole>('student');
  const [batchLabel, setBatchLabel] = useState('2026-spring');
  const [notes, setNotes] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => usersApi.createUser(payload),
    onSuccess: (newUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
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
    setBatchLabel('2026-spring');
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

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        phoneNumber: phoneClean,
        password,
        role,
        batchLabel: role === 'student' ? batchLabel.trim() || undefined : undefined,
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
            <Input
              label="Cohort Batch Label (e.g. 2026-spring)"
              placeholder="2026-spring"
              value={batchLabel}
              onChange={(e) => setBatchLabel(e.target.value)}
              leftIcon={<GraduationCap className="w-4 h-4 text-[#00a884]" />}
            />

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
