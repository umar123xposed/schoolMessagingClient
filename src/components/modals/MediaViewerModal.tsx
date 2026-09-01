'use client';

import React from 'react';
import { useUIStore } from '@/stores/useUIStore';
import { X, Download, ExternalLink } from 'lucide-react';

export function MediaViewerModal() {
  const { mediaPreview, closeMediaPreview } = useUIStore();

  if (!mediaPreview.isOpen || !mediaPreview.attachment) return null;

  const att = mediaPreview.attachment;
  const isImage = att.mimeType.startsWith('image/');
  const isVideo = att.mimeType.startsWith('video/');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      {/* Top Bar Controls */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="text-white text-sm font-medium truncate max-w-md">
          {att.fileName}
        </div>
        <div className="flex items-center gap-3">
          <a
            href={att.url}
            target="_blank"
            rel="noopener noreferrer"
            download={att.fileName}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Download file"
          >
            <Download className="w-5 h-5" />
          </a>
          <button
            type="button"
            onClick={closeMediaPreview}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Media Content */}
      <div className="max-w-4xl max-h-[85vh] flex items-center justify-center overflow-hidden">
        {isImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={att.url}
            alt={att.fileName}
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
          />
        )}
        {isVideo && (
          <video
            src={att.url}
            controls
            autoPlay
            playsInline
            className="max-w-full max-h-[80vh] rounded-lg shadow-2xl"
          />
        )}
        {!isImage && !isVideo && (
          <div className="p-8 rounded-2xl bg-[#111b21] border border-[#222e35] text-center space-y-4">
            <p className="text-sm text-[#e9edef]">{att.fileName}</p>
            <a
              href={att.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00a884] text-white text-xs font-semibold"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in new tab</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
