'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { useConversations } from '@/hooks/useConversations';
import { useUIStore } from '@/stores/useUIStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Avatar } from '@/components/common/Avatar';
import { Users, Check } from 'lucide-react';

export function CreateGroupModal() {
  const { isCreateGroupModalOpen, setCreateGroupModalOpen, addToast } = useUIStore();
  const { createGroup, isCreatingGroup } = useConversations();
  const { user: currentUser } = useAuthStore();

  const [groupName, setGroupName] = useState('');
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch all agents and super_admins
  const { data: usersResult } = useQuery({
    queryKey: ['staff-users'],
    queryFn: () => usersApi.getUsers({ limit: 100 }),
    enabled: isCreateGroupModalOpen,
  });

  const staffUsers = (usersResult?.results || []).filter(
    (u) => (u.role === 'agent' || u.role === 'super_admin') && u.id !== currentUser?.id
  );

  const toggleSelectUser = (id: string) => {
    setSelectedAgentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!groupName.trim()) {
      setError('Please provide a name for the group');
      return;
    }

    if (selectedAgentIds.length === 0) {
      setError('Please select at least one staff member to join');
      return;
    }

    try {
      await createGroup({
        name: groupName.trim(),
        participantIds: selectedAgentIds,
      });

      addToast({
        type: 'success',
        title: 'Group Chat Created',
        message: `Created "${groupName}" with ${selectedAgentIds.length + 1} members`,
      });

      setCreateGroupModalOpen(false);
      setGroupName('');
      setSelectedAgentIds([]);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create group';
      setError(errorMsg);
    }
  };

  return (
    <Modal
      isOpen={isCreateGroupModalOpen}
      onClose={() => setCreateGroupModalOpen(false)}
      title="Create Staff Group Chat"
      description="Create an internal discussion channel for teachers and agents"
      maxWidth="md"
    >
      <form onSubmit={handleCreate} className="space-y-4">
        <Input
          label="Group Name"
          placeholder="e.g. Grade 10 Teachers / Science Dept"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          leftIcon={<Users className="w-4 h-4 text-[#00a884]" />}
          required
        />

        <div className="space-y-1.5 text-left">
          <label className="block text-xs font-medium text-[#8696a0]">
            Select Staff Participants ({selectedAgentIds.length} selected)
          </label>
          <div className="max-h-52 overflow-y-auto rounded-lg border border-[#2a3942] bg-[#111b21] p-1 space-y-1 custom-scrollbar">
            {staffUsers.length === 0 ? (
              <p className="p-3 text-center text-xs text-[#8696a0]">No other staff accounts found</p>
            ) : (
              staffUsers.map((u) => {
                const isSelected = selectedAgentIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleSelectUser(u.id)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[#202c33] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={u.name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#e9edef] truncate">{u.name}</p>
                        <p className="text-[10px] text-[#8696a0]">{u.phoneNumber} • {u.role}</p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-[#00a884] border-[#00a884] text-white'
                          : 'border-[#2a3942] bg-[#202c33]'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

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
            onClick={() => setCreateGroupModalOpen(false)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isCreatingGroup}>
            Create Group
          </Button>
        </div>
      </form>
    </Modal>
  );
}
