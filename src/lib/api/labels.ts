import { apiClient } from './client';
import { Label, PaginatedResult } from '@/types';

export const labelsApi = {
  getLabels: async (): Promise<PaginatedResult<Label>> => {
    const { data } = await apiClient.get<PaginatedResult<Label>>('/labels');
    return data;
  },

  createLabel: async (payload: { name: string; color: string }): Promise<Label> => {
    const { data } = await apiClient.post<Label>('/labels', payload);
    return data;
  },

  updateLabel: async (id: string, payload: { name?: string; color?: string }): Promise<Label> => {
    const { data } = await apiClient.patch<Label>(`/labels/${id}`, payload);
    return data;
  },

  deleteLabel: async (id: string): Promise<void> => {
    await apiClient.delete(`/labels/${id}`);
  },
};
