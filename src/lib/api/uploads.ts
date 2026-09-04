import axios from 'axios';
import { apiClient } from './client';
import { Attachment, MessageContentType } from '@/types';

export interface UploadProgressCallback {
  (progress: number): void;
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  expiresIn: number;
  attachment: Attachment;
}

export interface UploadFileOptions {
  fileName?: string;
  onProgress?: UploadProgressCallback;
  duration?: number;
}

/**
 * Resolve the proper MIME type to declare for backend validation and R2 Content-Type header.
 */
function resolveMimeType(file: File | Blob, contentType: MessageContentType, fileName?: string): string {
  if (file.type && file.type.trim().length > 0) {
    const declaredType = file.type.trim();
    // Voice notes must have an audio/* MIME type per backend CONTENT_TYPE_RULES
    if (contentType === 'voice_note' && !declaredType.startsWith('audio/')) {
      return 'audio/webm';
    }
    return declaredType;
  }

  const ext = fileName ? fileName.split('.').pop()?.toLowerCase() : '';
  switch (contentType) {
    case 'image':
      if (ext === 'png') return 'image/png';
      if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
      if (ext === 'webp') return 'image/webp';
      if (ext === 'gif') return 'image/gif';
      return 'image/jpeg';
    case 'pdf':
      return 'application/pdf';
    case 'audio':
      if (ext === 'mp3') return 'audio/mpeg';
      if (ext === 'wav') return 'audio/wav';
      if (ext === 'ogg') return 'audio/ogg';
      return 'audio/mpeg';
    case 'voice_note':
      return 'audio/webm';
    case 'video':
      if (ext === 'mp4') return 'video/mp4';
      if (ext === 'webm') return 'video/webm';
      if (ext === 'mov') return 'video/quicktime';
      return 'video/mp4';
    case 'file':
    default:
      if (ext === 'pdf') return 'application/pdf';
      if (ext === 'txt') return 'text/plain';
      if (ext === 'json') return 'application/json';
      if (ext === 'csv') return 'text/csv';
      if (ext === 'zip') return 'application/zip';
      return 'application/octet-stream';
  }
}

/**
 * Determine a sanitized file name for the attachment.
 */
function resolveFileName(file: File | Blob, contentType: MessageContentType, fallbackName?: string): string {
  if (fallbackName && fallbackName.trim().length > 0) {
    return fallbackName.trim();
  }
  if (file instanceof File && file.name) {
    return file.name;
  }
  switch (contentType) {
    case 'voice_note':
      return `voice_note_${Date.now()}.webm`;
    case 'audio':
      return `audio_${Date.now()}.mp3`;
    case 'image':
      return `image_${Date.now()}.jpg`;
    case 'video':
      return `video_${Date.now()}.mp4`;
    case 'pdf':
      return `document_${Date.now()}.pdf`;
    case 'file':
    default:
      return `file_${Date.now()}.bin`;
  }
}

export const uploadsApi = {
  /**
   * Uploads a file directly to Cloudflare R2 using a backend-issued presigned PUT URL.
   * 1. Declares metadata (contentType, mimeType, fileName, size, duration) to POST /v1/uploads via JSON.
   * 2. Direct PUT of file bytes to R2 using the presigned URL with the exact Content-Type header.
   * 3. Returns the saved Attachment metadata for POST /conversations/:id/messages.
   */
  uploadFile: async (
    contentType: MessageContentType,
    file: File | Blob,
    fileNameOrOptions?: string | UploadFileOptions,
    onProgress?: UploadProgressCallback,
    duration?: number
  ): Promise<Attachment> => {
    let resolvedFileName: string | undefined;
    let resolvedProgress = onProgress;
    let resolvedDuration = duration;

    if (typeof fileNameOrOptions === 'string') {
      resolvedFileName = fileNameOrOptions;
    } else if (typeof fileNameOrOptions === 'object' && fileNameOrOptions !== null) {
      resolvedFileName = fileNameOrOptions.fileName;
      resolvedProgress = fileNameOrOptions.onProgress;
      resolvedDuration = fileNameOrOptions.duration;
    }

    const fileName = resolveFileName(file, contentType, resolvedFileName);
    const mimeType = resolveMimeType(file, contentType, fileName);
    const size = file.size;

    // Step 1: Request presigned upload URL from backend
    const { data: presigned } = await apiClient.post<PresignedUploadResponse>('/uploads', {
      contentType,
      mimeType,
      fileName,
      size,
      ...(resolvedDuration !== undefined && resolvedDuration > 0 && { duration: resolvedDuration }),
    });

    // Step 2: PUT file directly to Cloudflare R2 storage (bypasses server completely)
    await axios.put(presigned.uploadUrl, file, {
      headers: {
        'Content-Type': mimeType,
      },
      onUploadProgress: (progressEvent) => {
        if (resolvedProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          resolvedProgress(percentCompleted);
        }
      },
    });

    // Step 3: Return attachment descriptor
    return presigned.attachment;
  },
};
