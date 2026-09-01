'use client';

import React from 'react';
import { useUIStore, ToastMessage } from '@/stores/useUIStore';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-400 flex-shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500/30 bg-[#111b21]/95',
    error: 'border-rose-500/30 bg-[#111b21]/95',
    warning: 'border-amber-500/30 bg-[#111b21]/95',
    info: 'border-sky-500/30 bg-[#111b21]/95',
  };

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all animate-slide-up',
        borders[toast.type]
      )}
    >
      {icons[toast.type]}
      <div className="flex-1 text-left">
        {toast.title && <h4 className="text-sm font-semibold text-[#e9edef]">{toast.title}</h4>}
        <p className="text-xs text-[#8696a0] mt-0.5">{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-[#8696a0] hover:text-[#e9edef] p-1 rounded-md transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
