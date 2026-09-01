'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserRole } from '@/types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

export function RoleGuard({ children, allowedRoles, requireAuth = true }: RoleGuardProps) {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const { user, isAuthenticated, isLoading, initializeAuth } = useAuthStore();

  useEffect(() => {
    setMounted(true);
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (mounted && !isLoading) {
      if (requireAuth && !isAuthenticated) {
        router.push('/login');
        return;
      }

      if (requireAuth && isAuthenticated && allowedRoles && user && !allowedRoles.includes(user.role)) {
        router.push('/chat');
      }
    }
  }, [mounted, isLoading, isAuthenticated, user, allowedRoles, requireAuth, router]);

  if (!mounted || isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#111b21]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#00a884] border-t-transparent" />
          <p className="text-sm text-[#8696a0]">Loading School Support...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return null;
  }

  if (requireAuth && allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
