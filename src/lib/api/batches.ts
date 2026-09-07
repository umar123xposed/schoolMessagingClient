import { apiClient } from './client';
import { Batch, BatchDeletionJob, PaginatedResult, User, ImportedStudent, ImportStudentsResponse } from '@/types';

export interface CreateBatchPayload {
  name: string;
}

export interface UpdateBatchPayload {
  name: string;
}

export interface DeleteBatchPayload {
  confirmName: string;
}

export interface GetBatchesParams {
  name?: string;
  sortBy?: string;
  limit?: number;
  page?: number;
}

export interface GetBatchStudentsParams {
  limit?: number;
  page?: number;
  sortBy?: string;
}

export const batchesApi = {
  getBatches: async (params?: GetBatchesParams): Promise<PaginatedResult<Batch>> => {
    const { data } = await apiClient.get<PaginatedResult<Batch>>('/batches', { params });
    return data;
  },

  getBatch: async (batchId: string): Promise<Batch> => {
    const { data } = await apiClient.get<Batch>(`/batches/${batchId}`);
    return data;
  },

  createBatch: async (payload: CreateBatchPayload): Promise<Batch> => {
    const { data } = await apiClient.post<Batch>('/batches', payload);
    return data;
  },

  updateBatch: async (batchId: string, payload: UpdateBatchPayload): Promise<Batch> => {
    const { data } = await apiClient.patch<Batch>(`/batches/${batchId}`, payload);
    return data;
  },

  deleteBatch: async (batchId: string, payload: DeleteBatchPayload): Promise<BatchDeletionJob> => {
    const { data } = await apiClient.delete<BatchDeletionJob>(`/batches/${batchId}`, {
      data: payload,
    });
    return data;
  },

  getBatchStudents: async (batchId: string, params?: GetBatchStudentsParams): Promise<PaginatedResult<User>> => {
    const { data } = await apiClient.get<PaginatedResult<User>>(`/batches/${batchId}/students`, { params });
    return data;
  },

  importStudents: async (
    batchId: string,
    file: File
  ): Promise<ImportedStudent[] | ImportStudentsResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<ImportedStudent[] | ImportStudentsResponse>(
      `/batches/${batchId}/students/import`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return data;
  },
};
