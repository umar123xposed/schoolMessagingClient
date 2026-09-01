import { apiClient } from './client';
import { StorageStats, BatchDeletionJob, PaginatedResult } from '@/types';

export const adminApi = {
  getStorageStats: async (): Promise<StorageStats> => {
    const { data } = await apiClient.get<StorageStats>('/admin/storage-stats');
    return data;
  },

  requestBatchDeletion: async (batchLabel: string): Promise<BatchDeletionJob> => {
    const { data } = await apiClient.post<BatchDeletionJob>(`/admin/batches/${encodeURIComponent(batchLabel)}/delete`, {
      confirmBatchLabel: batchLabel,
    });
    return data;
  },

  getBatchDeletions: async (params?: { status?: string; batchLabel?: string }): Promise<PaginatedResult<BatchDeletionJob>> => {
    const { data } = await apiClient.get<PaginatedResult<BatchDeletionJob>>('/admin/batch-deletions', { params });
    return data;
  },

  getBatchDeletionById: async (id: string): Promise<BatchDeletionJob> => {
    const { data } = await apiClient.get<BatchDeletionJob>(`/admin/batch-deletions/${id}`);
    return data;
  },
};
