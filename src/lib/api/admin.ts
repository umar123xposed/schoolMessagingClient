import { apiClient } from './client';
import { StorageStats, BatchDeletionJob, PaginatedResult } from '@/types';

export const adminApi = {
  getStorageStats: async (): Promise<StorageStats> => {
    const { data } = await apiClient.get<StorageStats>('/admin/storage-stats');
    return data;
  },

  requestBatchDeletion: async (batchId: string, confirmName: string): Promise<BatchDeletionJob> => {
    const { data } = await apiClient.delete<BatchDeletionJob>(`/batches/${batchId}`, {
      data: { confirmName },
    });
    return data;
  },

  getBatchDeletions: async (params?: {
    status?: string;
    batchId?: string;
    batchLabel?: string;
    sortBy?: string;
    limit?: number;
    page?: number;
  }): Promise<PaginatedResult<BatchDeletionJob>> => {
    const { data } = await apiClient.get<PaginatedResult<BatchDeletionJob>>('/admin/batch-deletions', { params });
    return data;
  },

  getBatchDeletionById: async (id: string): Promise<BatchDeletionJob> => {
    const { data } = await apiClient.get<BatchDeletionJob>(`/admin/batch-deletions/${id}`);
    return data;
  },
};
