'use client';

import React from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0c1317] p-4 sm:p-6 overflow-y-auto">
      {/* Top Brand Stripe (WhatsApp web style header) */}
      <div className="fixed top-0 left-0 right-0 h-32 bg-[#00a884] -z-10 shadow-md opacity-90" />

      <LoginForm />
    </div>
  );
}
