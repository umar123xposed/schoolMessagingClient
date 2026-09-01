'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { UserManagementTable } from '@/components/admin/UserManagementTable';
import { StorageStatsView } from '@/components/admin/StorageStatsView';
import { BatchJobsList } from '@/components/admin/BatchJobsList';
import { Shield, ArrowLeft, Users, HardDrive, ListOrdered } from 'lucide-react';

export default function AdminPage() {
  return (
    <RoleGuard requireAuth={true} allowedRoles={['super_admin']}>
      <AdminDashboard />
    </RoleGuard>
  );
}

function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'storage' | 'jobs'>('users');

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0c1317] text-[#e9edef] overflow-hidden">
      {/* Admin Top Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#111b21] border-b border-[#222e35] flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push('/chat')}
            className="p-2 rounded-full text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33] transition-colors"
            title="Return to Chat"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#00a884]/20 text-[#00a884]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#e9edef]">Admin Control Center</h1>
              <p className="text-[11px] text-[#8696a0]">School Support Administration</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 bg-[#202c33] p-1 rounded-xl border border-[#2a3942]">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'users'
                ? 'bg-[#00a884] text-white shadow-sm'
                : 'text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Accounts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('storage')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'storage'
                ? 'bg-[#00a884] text-white shadow-sm'
                : 'text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Storage & Batches</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('jobs')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'jobs'
                ? 'bg-[#00a884] text-white shadow-sm'
                : 'text-[#8696a0] hover:text-[#e9edef]'
            }`}
          >
            <ListOrdered className="w-4 h-4" />
            <span>Cleanup Jobs</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto custom-scrollbar">
        {activeTab === 'users' && <UserManagementTable />}
        {activeTab === 'storage' && <StorageStatsView />}
        {activeTab === 'jobs' && <BatchJobsList />}
      </main>
    </div>
  );
}
