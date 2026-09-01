import { apiClient } from './client';
import { Attachment, MessageContentType } from '@/types';

export interface UploadProgressCallback {
  (progress: number): void;
}

export const uploadsApi = {
  uploadFile: async (
    contentType: MessageContentType,
    file: File | Blob,
    fileName?: string,
    onProgress?: UploadProgressCallback
  ): Promise<Attachment> => {
    const formData = new FormData();
    // Crucial: contentType must be appended BEFORE file
    formData.append('contentType', contentType);

    if (file instanceof File) {
      formData.append('file', file);
    } else {
      const name = fileName || `voice_note_${Date.now()}.webm`;
      formData.append('file', file, name);
    }

    const { data } = await apiClient.post<Attachment>('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    return data;
  },
};
