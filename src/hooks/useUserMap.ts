'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { useAuthStore } from '@/stores/useAuthStore';
import { User } from '@/types';

export function useUserMap() {
  const { user } = useAuthStore();
  const isAgentOrAdmin = user?.role === 'agent' || user?.role === 'super_admin';

  const { data } = useQuery({
    queryKey: ['users-map'],
    queryFn: () => usersApi.getUsers({ limit: 1000 }),
    enabled: isAgentOrAdmin,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const userMap = useMemo(() => {
    const map: Record<string, User> = {};
    if (data?.results) {
      data.results.forEach((u) => {
        map[u.id] = u;
      });
    }
    return map;
  }, [data]);

  return userMap;
}
