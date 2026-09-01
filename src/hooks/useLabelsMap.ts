'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { labelsApi } from '@/lib/api/labels';
import { Label } from '@/types';

export function useLabelsMap() {
  const { data } = useQuery({
    queryKey: ['labels'],
    queryFn: () => labelsApi.getLabels(),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const labelsMap = useMemo(() => {
    const map: Record<string, Label> = {};
    if (data?.results) {
      data.results.forEach((lbl) => {
        map[lbl.id] = lbl;
      });
    }
    return map;
  }, [data]);

  return { labelsMap, allLabels: data?.results || [] };
}
