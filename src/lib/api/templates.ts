import { apiClient } from './client';
import { Template, PaginatedResult } from '@/types';

export interface CreateTemplatePayload {
  shortcut: string;
  content: string;
  isShared?: boolean;
}

export interface UpdateTemplatePayload {
  shortcut?: string;
  content?: string;
  isShared?: boolean;
}

export const templatesApi = {
  getTemplates: async (): Promise<PaginatedResult<Template>> => {
    const { data } = await apiClient.get<PaginatedResult<Template>>('/templates');
    return data;
  },

  createTemplate: async (payload: CreateTemplatePayload): Promise<Template> => {
    const { data } = await apiClient.post<Template>('/templates', payload);
    return data;
  },

  updateTemplate: async (id: string, payload: UpdateTemplatePayload): Promise<Template> => {
    const { data } = await apiClient.patch<Template>(`/templates/${id}`, payload);
    return data;
  },

  deleteTemplate: async (id: string): Promise<void> => {
    await apiClient.delete(`/templates/${id}`);
  },
};
