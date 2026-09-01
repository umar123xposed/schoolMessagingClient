'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { labelsApi } from '@/lib/api/labels';
import { Badge } from '@/components/common/Badge';
import { Tag, Plus, Check } from 'lucide-react';
import { useUIStore } from '@/stores/useUIStore';

interface LabelSelectorProps {
  currentLabelIds: string[];
  onUpdateLabels: (labelIds: string[]) => Promise<unknown>;
  disabled?: boolean;
}

export function LabelSelector({ currentLabelIds, onUpdateLabels, disabled = false }: LabelSelectorProps) {
  const { setLabelManagerModalOpen } = useUIStore();
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: labelsResult, isLoading } = useQuery({
    queryKey: ['labels'],
    queryFn: () => labelsApi.getLabels(),
    staleTime: 1000 * 60 * 5,
  });

  const availableLabels = labelsResult?.results || [];

  const handleToggleLabel = async (labelId: string) => {
    if (disabled || isUpdating) return;

    const exists = currentLabelIds.includes(labelId);
    const newLabels = exists
      ? currentLabelIds.filter((id) => id !== labelId)
      : [...currentLabelIds, labelId];

    setIsUpdating(true);
    try {
      await onUpdateLabels(newLabels);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8696a0] uppercase tracking-wider">
          <Tag className="w-3.5 h-3.5 text-[#00a884]" />
          <span>Labels & Tags</span>
        </div>
        <button
          type="button"
          onClick={() => setLabelManagerModalOpen(true)}
          className="text-xs text-[#00a884] hover:underline flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          <span>Manage</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 pt-1">
        {availableLabels.length === 0 && !isLoading && (
          <p className="text-xs text-[#8696a0] italic">No labels created yet</p>
        )}

        {availableLabels.map((label) => {
          const isSelected = currentLabelIds.includes(label.id);
          return (
            <button
              key={label.id}
              type="button"
              disabled={disabled || isUpdating}
              onClick={() => handleToggleLabel(label.id)}
              className="focus:outline-none"
            >
              <Badge
                variant="custom"
                color={label.color}
                size="md"
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? 'ring-2 ring-white/60 font-semibold'
                    : 'opacity-50 hover:opacity-100'
                }`}
              >
                {label.name}
                {isSelected && <Check className="w-3 h-3 ml-1 stroke-[3]" />}
              </Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
