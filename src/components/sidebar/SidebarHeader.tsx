'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { Avatar } from '@/components/common/Avatar';
import { Dropdown, DropdownItem } from '@/components/common/Dropdown';
import {
  Users,
  Megaphone,
  Tag,
  Zap,
  Shield,
  LogOut,
  MoreVertical,
} from 'lucide-react';

export function SidebarHeader() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const {
    setCreateGroupModalOpen,
    setBroadcastModalOpen,
    setLabelManagerModalOpen,
    setTemplateManagerModalOpen,
  } = useUIStore();

  const isSuperAdmin = user?.role === 'super_admin';
  const isAgentOrAdmin = user?.role === 'agent' || isSuperAdmin;

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const menuItems: (DropdownItem | 'divider')[] = [];

  if (isAgentOrAdmin) {
    if (isSuperAdmin) {
      menuItems.push({
        id: 'new-group',
        label: 'New Group Chat',
        icon: <Users className="w-4 h-4 text-emerald-400" />,
        onClick: () => setCreateGroupModalOpen(true),
      });
    }

    menuItems.push({
      id: 'broadcast',
      label: 'Broadcast Message',
      icon: <Megaphone className="w-4 h-4 text-sky-400" />,
      onClick: () => setBroadcastModalOpen(true),
    });

    menuItems.push({
      id: 'templates',
      label: 'Quick Replies (/shortcuts)',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      onClick: () => setTemplateManagerModalOpen(true),
    });

    menuItems.push({
      id: 'labels',
      label: 'Manage Labels',
      icon: <Tag className="w-4 h-4 text-purple-400" />,
      onClick: () => setLabelManagerModalOpen(true),
    });

    if (isSuperAdmin) {
      menuItems.push('divider');
      menuItems.push({
        id: 'admin-dashboard',
        label: 'Admin Control Center',
        icon: <Shield className="w-4 h-4 text-emerald-400" />,
        onClick: () => router.push('/admin'),
      });
    }
  }

  if (menuItems.length > 0) menuItems.push('divider');

  menuItems.push({
    id: 'logout',
    label: 'Sign Out',
    icon: <LogOut className="w-4 h-4" />,
    danger: true,
    onClick: handleLogout,
  });

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[#202c33] border-b border-[#222e35]">
      {/* Current User Info */}
      <div className="flex items-center gap-3 min-w-0">
        <Avatar name={user?.name} isOnline={true} showOnlineStatus={isAgentOrAdmin} size="md" />
        <div className="min-w-0 text-left">
          <h1 className="text-sm font-semibold text-[#e9edef] truncate">{user?.name || 'Staff User'}</h1>
          <span className="text-[11px] font-medium text-[#00a884] capitalize">
            {user?.role?.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Quick Action Icons */}
      <div className="flex items-center gap-1">
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setCreateGroupModalOpen(true)}
            className="p-2 text-[#aebac1] hover:text-[#e9edef] hover:bg-[#111b21] rounded-full transition-colors"
            title="Create group chat"
          >
            <Users className="w-5 h-5" />
          </button>
        )}

        {isAgentOrAdmin && (
          <button
            type="button"
            onClick={() => setBroadcastModalOpen(true)}
            className="p-2 text-[#aebac1] hover:text-[#e9edef] hover:bg-[#111b21] rounded-full transition-colors"
            title="Broadcast message"
          >
            <Megaphone className="w-5 h-5" />
          </button>
        )}

        <Dropdown
          trigger={
            <button
              type="button"
              className="p-2 text-[#aebac1] hover:text-[#e9edef] hover:bg-[#111b21] rounded-full transition-colors"
              title="Menu"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          }
          items={menuItems}
          align="right"
        />
      </div>
    </div>
  );
}
