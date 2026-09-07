'use client';

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { batchesApi, CreateBatchPayload, UpdateBatchPayload, DeleteBatchPayload } from '@/lib/api/batches';
import { useAuthStore } from '@/stores/useAuthStore';
import { Batch } from '@/types';

export function useBatches() {
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';

  const batchesQuery = useQuery({
    queryKey: ['batches'],
    queryFn: () => batchesApi.getBatches({ limit: 100, sortBy: 'name:asc' }),
    enabled: isAuthenticated && isSuperAdmin,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const batches: Batch[] = useMemo(() => {
    return batchesQuery.data?.results || [];
  }, [batchesQuery.data?.results]);

  const batchMap = useMemo(() => {
    const map: Record<string, Batch> = {};
    batches.forEach((b) => {
      if (b && b.id) {
        map[b.id] = b;
      }
    });
    return map;
  }, [batches]);

  const createBatchMutation = useMutation({
    mutationFn: (payload: CreateBatchPayload) => batchesApi.createBatch(payload),
    onSuccess: (newBatch) => {
      queryClient.setQueryData(['batches'], (oldData: unknown) => {
        if (!oldData) return { results: [newBatch], totalResults: 1, totalPages: 1, page: 1, limit: 100 };
        const data = oldData as { results: Batch[]; totalResults?: number };
        const filtered = (data.results || []).filter((b) => b.id !== newBatch.id);
        const nextResults = [...filtered, newBatch].sort((a, b) => a.name.localeCompare(b.name));
        return {
          ...data,
          results: nextResults,
          totalResults: (data.totalResults || filtered.length) + 1,
        };
      });
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
    },
  });

  const updateBatchMutation = useMutation({
    mutationFn: ({ batchId, payload }: { batchId: string; payload: UpdateBatchPayload }) =>
      batchesApi.updateBatch(batchId, payload),
    onSuccess: (updatedBatch) => {
      queryClient.setQueryData(['batches'], (oldData: unknown) => {
        if (!oldData) return oldData;
        const data = oldData as { results: Batch[] };
        const nextResults = (data.results || []).map((b) =>
          b.id === updatedBatch.id ? updatedBatch : b
        );
        return { ...data, results: nextResults };
      });
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
      queryClient.invalidateQueries({ queryKey: ['batch', updatedBatch.id] });
    },
  });

  const deleteBatchMutation = useMutation({
    mutationFn: ({ batchId, payload }: { batchId: string; payload: DeleteBatchPayload }) =>
      batchesApi.deleteBatch(batchId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
      queryClient.invalidateQueries({ queryKey: ['batch-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  return {
    batches,
    batchMap,
    isLoading: batchesQuery.isLoading,
    isError: batchesQuery.isError,
    refetch: batchesQuery.refetch,
    createBatch: createBatchMutation.mutateAsync,
    isCreatingBatch: createBatchMutation.isPending,
    updateBatch: updateBatchMutation.mutateAsync,
    isUpdatingBatch: updateBatchMutation.isPending,
    deleteBatch: deleteBatchMutation.mutateAsync,
    isDeletingBatch: deleteBatchMutation.isPending,
  };
}
