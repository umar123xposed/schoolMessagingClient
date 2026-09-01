'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { BatchJobStatus } from '@/types';
import { formatWhatsAppChatDate } from '@/lib/utils/formatters';
import { Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export function BatchJobsList() {
  const { data: jobsResult, isLoading } = useQuery({
    queryKey: ['batch-jobs'],
    queryFn: () => adminApi.getBatchDeletions(),
    refetchInterval: 5000, // Poll every 5s for job status updates
  });

  const jobs = jobsResult?.results || [];

  const renderStatusBadge = (status: BatchJobStatus) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 font-semibold text-[11px]">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> In Progress
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-semibold text-[11px]">
            <AlertCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-semibold text-[11px]">
            <Clock className="w-3.5 h-3.5" /> Queued
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#e9edef]">Cohort Deletion Task History</h3>
          <p className="text-xs text-[#8696a0]">Live monitoring of background cleanup workers</p>
        </div>
      </div>

      <div className="rounded-xl bg-[#111b21] border border-[#222e35] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#202c33] text-[#8696a0] uppercase tracking-wider font-semibold border-b border-[#222e35]">
              <tr>
                <th className="px-5 py-3">Batch Label</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Deleted Records</th>
                <th className="px-5 py-3">Requested At</th>
                <th className="px-5 py-3">Completed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222e35] text-[#d1d7db]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[#8696a0]">
                    Loading batch history...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-[#8696a0]">
                    No batch deletion jobs have been run
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-[#182229] transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-[#e9edef]">
                      {job.batchLabel}
                    </td>
                    <td className="px-5 py-3.5">{renderStatusBadge(job.status)}</td>
                    <td className="px-5 py-3.5 text-[#8696a0]">
                      {job.counts ? (
                        <span>
                          {job.counts.studentsDeleted} students, {job.counts.messagesDeleted} msgs,{' '}
                          {job.counts.attachmentsDeleted} files
                        </span>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-[#8696a0]">
                      {formatWhatsAppChatDate(job.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-[#8696a0]">
                      {job.completedAt ? formatWhatsAppChatDate(job.completedAt) : '—'}
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
