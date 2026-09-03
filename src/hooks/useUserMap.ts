'use client';

import { useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api/users';
import { useAuthStore } from '@/stores/useAuthStore';
import { User, Conversation, PaginatedResult } from '@/types';

const STORAGE_KEY = 'school_chat_known_users';

function getStoredUsers(): Record<string, User> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredUsers(users: Record<string, User>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch {
    // ignore
  }
}

export function useUserMap() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.role === 'super_admin';

  // Only super_admin has permission to call GET /users; agents receive 403 Forbidden
  const { data: usersData } = useQuery({
    queryKey: ['users-map'],
    queryFn: () => usersApi.getUsers({ limit: 1000 }),
    enabled: isSuperAdmin,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // Watch conversations cache to harvest populated student and participant objects
  const convData = queryClient.getQueryData<PaginatedResult<Conversation> | Conversation[]>(['conversations']);

  const userMap = useMemo(() => {
    const map: Record<string, User> = { ...getStoredUsers() };

    // 1. Incorporate from usersApi (super_admin)
    if (usersData?.results) {
      usersData.results.forEach((u) => {
        if (u && u.id) {
          map[u.id] = u;
        }
      });
    }

    // 2. Incorporate populated students and participants from conversations
    const convList: Conversation[] = Array.isArray(convData)
      ? convData
      : (convData && 'results' in convData && Array.isArray(convData.results))
      ? convData.results
      : [];

    convList.forEach((c) => {
      if (c.studentId && typeof c.studentId === 'object' && 'id' in c.studentId) {
        map[c.studentId.id] = c.studentId as User;
      }
      if (Array.isArray(c.participantIds)) {
        c.participantIds.forEach((p) => {
          if (p && typeof p === 'object' && 'id' in p) {
            map[p.id] = p as User;
          }
        });
      }
    });

    return map;
  }, [usersData, convData]);

  // Persist combined known users
  useEffect(() => {
    if (Object.keys(userMap).length > 0) {
      saveStoredUsers(userMap);
    }
  }, [userMap]);

  return userMap;
}
