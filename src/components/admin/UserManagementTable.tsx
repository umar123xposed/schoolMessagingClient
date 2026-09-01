'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { useUIStore } from '@/stores/useUIStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { User, UserRole } from '@/types';
import { formatWhatsAppChatDate } from '@/lib/utils/formatters';
import { Search, UserPlus, Trash2, Shield, UserCheck, GraduationCap, X } from 'lucide-react';

export function UserManagementTable() {
  const queryClient = useQueryClient();
  const { setCreateUserModalOpen, addToast } = useUIStore();
  const { user: currentUser } = useAuthStore();

  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data: usersResult, isLoading } = useQuery({
    queryKey: ['users', roleFilter, search],
    queryFn: () =>
      usersApi.getUsers({
        role: roleFilter === 'all' ? undefined : roleFilter,
        name: search.trim() || undefined,
        limit: 100,
        sortBy: 'createdAt:desc',
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      addToast({ type: 'info', message: 'User account removed' });
    },
  });

  const handleDeleteUser = (u: User) => {
    if (u.id === currentUser?.id) {
      addToast({ type: 'warning', message: 'You cannot delete your own account' });
      return;
    }

    const warning =
      u.role === 'student'
        ? `Deleting student "${u.name}" will permanently delete their support conversation and all messages. Proceed?`
        : `Deleting agent "${u.name}" will remove them from all groups. Proceed?`;

    if (confirm(warning)) {
      deleteMutation.mutate(u.id);
    }
  };

  const users = usersResult?.results || [];

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111b21] p-4 rounded-xl border border-[#222e35]">
        {/* Role Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['all', 'student', 'agent', 'super_admin'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${
                roleFilter === r
                  ? 'bg-[#00a884]/20 border-[#00a884] text-[#00a884]'
                  : 'bg-[#202c33] border-[#2a3942] text-[#8696a0] hover:text-[#e9edef]'
              }`}
            >
              {r.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search & Add User Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#202c33] border border-[#2a3942] focus-within:border-[#00a884]">
            <Search className="w-4 h-4 text-[#8696a0]" />
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs text-[#e9edef] placeholder-[#8696a0] outline-none w-32 sm:w-48"
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="text-[#8696a0]">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setCreateUserModalOpen(true)}
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Account</span>
          </Button>
        </div>
      </div>

      {/* Users Table / List */}
      <div className="rounded-xl bg-[#111b21] border border-[#222e35] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#202c33] text-[#8696a0] uppercase tracking-wider font-semibold border-b border-[#222e35]">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Phone (Login)</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Cohort Batch</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222e35] text-[#d1d7db]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#8696a0]">
                    Loading accounts...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#8696a0]">
                    No user accounts found matching your query
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#182229] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} size="sm" />
                        <div>
                          <p className="font-semibold text-[#e9edef]">{u.name}</p>
                          {u.email && <p className="text-[11px] text-[#8696a0]">{u.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[#e9edef]">{u.phoneNumber}</td>
                    <td className="px-4 py-3">
                      {u.role === 'super_admin' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold text-[10px]">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      ) : u.role === 'agent' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 font-semibold text-[10px]">
                          <UserCheck className="w-3 h-3" /> Staff / Agent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold text-[10px]">
                          <GraduationCap className="w-3 h-3" /> Student
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.batchLabel ? (
                        <span className="px-2 py-0.5 rounded bg-[#202c33] text-emerald-400 font-mono text-[11px] border border-[#2a3942]">
                          {u.batchLabel}
                        </span>
                      ) : (
                        <span className="text-[#8696a0]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#8696a0]">
                      {formatWhatsAppChatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.id !== currentUser?.id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u)}
                          className="p-1.5 rounded-md text-[#8696a0] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
