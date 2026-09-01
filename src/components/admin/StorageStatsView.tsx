'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { useUIStore } from '@/stores/useUIStore';
import { formatFileSize } from '@/lib/utils/formatters';
import { HardDrive, Users, MessageSquare, Paperclip, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/common/Button';

export function StorageStatsView() {
  const { setBatchDeleteModalOpen } = useUIStore();

  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['storage-stats'],
    queryFn: () => adminApi.getStorageStats(),
    refetchInterval: 10000,
  });

  interface RawBatch {
    batchLabel?: string;
    _id?: string;
    studentCount?: number;
    students?: number;
    conversationCount?: number;
    conversations?: number;
    messageCount?: number;
    messages?: number;
    attachmentCount?: number;
    attachments?: number;
    attachmentBytes?: number;
    attachmentsBytes?: number;
    storageBytes?: number;
    mediaBytes?: number;
    totalSizeBytes?: number;
    totalSize?: number;
    totalBytes?: number;
    sizeBytes?: number;
    size?: number;
    storageSize?: number;
    bytes?: number;
  }

  interface NormalizedBatch {
    batchLabel: string;
    studentCount: number;
    conversationCount: number;
    messageCount: number;
    attachmentCount: number;
    totalSizeBytes: number;
  }

  // Support both array response or object response with .batches / .results
  const rawBatches: RawBatch[] = Array.isArray(stats)
    ? (stats as RawBatch[])
    : (stats as unknown as { batches?: RawBatch[]; results?: RawBatch[] })?.batches ||
      (stats as unknown as { batches?: RawBatch[]; results?: RawBatch[] })?.results ||
      [];

  const batches: NormalizedBatch[] = rawBatches.map((b: RawBatch) => ({
    batchLabel: (b.batchLabel as string) || (b._id as string) || '(Unassigned)',
    studentCount: Number(b.studentCount ?? b.students ?? 0) || 0,
    conversationCount: Number(b.conversationCount ?? b.conversations ?? 0) || 0,
    messageCount: Number(b.messageCount ?? b.messages ?? 0) || 0,
    attachmentCount: Number(b.attachmentCount ?? b.attachments ?? 0) || 0,
    totalSizeBytes: Number(
      b.attachmentBytes ??
      b.attachmentsBytes ??
      b.totalSizeBytes ??
      b.totalSize ??
      b.totalBytes ??
      b.sizeBytes ??
      b.storageBytes ??
      b.mediaBytes ??
      b.size ??
      b.storageSize ??
      b.bytes ??
      0
    ) || 0,
  }));

  // Aggregate batch totals as fallback
  const computedTotals = batches.reduce(
    (acc, b) => ({
      studentCount: acc.studentCount + b.studentCount,
      conversationCount: acc.conversationCount + b.conversationCount,
      messageCount: acc.messageCount + b.messageCount,
      attachmentCount: acc.attachmentCount + b.attachmentCount,
      totalSizeBytes: acc.totalSizeBytes + b.totalSizeBytes,
    }),
    {
      studentCount: 0,
      conversationCount: 0,
      messageCount: 0,
      attachmentCount: 0,
      totalSizeBytes: 0,
    }
  );

  const statsObj = stats && !Array.isArray(stats) ? (stats as unknown as { totals?: Record<string, unknown> }) : null;
  const totals = statsObj?.totals
    ? {
        studentCount: Number(statsObj.totals.studentCount ?? statsObj.totals.students ?? computedTotals.studentCount) || computedTotals.studentCount,
        conversationCount: Number(statsObj.totals.conversationCount ?? statsObj.totals.conversations ?? computedTotals.conversationCount) || computedTotals.conversationCount,
        messageCount: Number(statsObj.totals.messageCount ?? statsObj.totals.messages ?? computedTotals.messageCount) || computedTotals.messageCount,
        attachmentCount: Number(statsObj.totals.attachmentCount ?? statsObj.totals.attachments ?? computedTotals.attachmentCount) || computedTotals.attachmentCount,
        totalSizeBytes: Number(
          statsObj.totals.attachmentBytes ??
          statsObj.totals.attachmentsBytes ??
          statsObj.totals.totalSizeBytes ??
          statsObj.totals.totalSize ??
          statsObj.totals.totalBytes ??
          statsObj.totals.sizeBytes ??
          statsObj.totals.storageBytes ??
          statsObj.totals.mediaBytes ??
          statsObj.totals.size ??
          computedTotals.totalSizeBytes
        ) || computedTotals.totalSizeBytes,
      }
    : computedTotals;

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#e9edef]">System Storage & Cohort Metrics</h2>
          <p className="text-xs text-[#8696a0]">Overview of media assets and student cohort data</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => refetch()}
          isLoading={isRefetching}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#111b21] border border-[#222e35] space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#8696a0]">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Students</span>
          </div>
          <p className="text-xl font-bold text-[#e9edef]">{totals.studentCount}</p>
        </div>

        <div className="p-4 rounded-xl bg-[#111b21] border border-[#222e35] space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#8696a0]">
            <MessageSquare className="w-4 h-4 text-sky-400" />
            <span>Messages</span>
          </div>
          <p className="text-xl font-bold text-[#e9edef]">{totals.messageCount}</p>
        </div>

        <div className="p-4 rounded-xl bg-[#111b21] border border-[#222e35] space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#8696a0]">
            <Paperclip className="w-4 h-4 text-amber-400" />
            <span>Attachments</span>
          </div>
          <p className="text-xl font-bold text-[#e9edef]">{totals.attachmentCount}</p>
        </div>

        <div className="p-4 rounded-xl bg-[#111b21] border border-[#222e35] space-y-1">
          <div className="flex items-center gap-2 text-xs text-[#8696a0]">
            <HardDrive className="w-4 h-4 text-purple-400" />
            <span>Total Storage</span>
          </div>
          <p className="text-xl font-bold text-[#e9edef]">
            {formatFileSize(totals.totalSizeBytes)}
          </p>
        </div>
      </div>

      {/* Cohort Breakdown Table */}
      <div className="rounded-xl bg-[#111b21] border border-[#222e35] overflow-hidden">
        <div className="px-5 py-3.5 bg-[#202c33] border-b border-[#222e35] flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#8696a0] uppercase tracking-wider">
            Cohort Batches Breakdown ({batches.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#182229] text-[#8696a0] uppercase tracking-wider font-semibold border-b border-[#222e35]">
              <tr>
                <th className="px-5 py-3">Cohort Batch</th>
                <th className="px-5 py-3">Students</th>
                <th className="px-5 py-3">Conversations</th>
                <th className="px-5 py-3">Messages</th>
                <th className="px-5 py-3">Attachments</th>
                <th className="px-5 py-3">Storage Size</th>
                <th className="px-5 py-3 text-right">Cohort Cleanup</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222e35] text-[#d1d7db]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-[#8696a0]">
                    Loading storage statistics...
                  </td>
                </tr>
              ) : batches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-[#8696a0]">
                    No batch labeled data available yet
                  </td>
                </tr>
              ) : (
                batches.map((b) => (
                  <tr key={b.batchLabel} className="hover:bg-[#182229] transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-emerald-400 font-mono">
                      {b.batchLabel || '(Unassigned)'}
                    </td>
                    <td className="px-5 py-3.5">{b.studentCount}</td>
                    <td className="px-5 py-3.5">{b.conversationCount}</td>
                    <td className="px-5 py-3.5">{b.messageCount}</td>
                    <td className="px-5 py-3.5">{b.attachmentCount}</td>
                    <td className="px-5 py-3.5 font-medium text-[#e9edef]">
                      {formatFileSize(b.totalSizeBytes)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {b.batchLabel && (
                        <button
                          type="button"
                          onClick={() => setBatchDeleteModalOpen(true, b.batchLabel)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-medium transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Batch</span>
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
