'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Phone, Lock, Eye, EyeOff, MessageSquare } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const { addToast } = useUIStore();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const phoneClean = phoneNumber.trim();
    if (!phoneClean.startsWith('+')) {
      setError('Phone number must start with "+" and country code (e.g. +14155552671)');
      return;
    }
    if (!/^\+[0-9]{7,15}$/.test(phoneClean)) {
      setError('Phone number must contain 7-15 digits after "+" (e.g. +14155552671)');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    try {
      const user = await login(phoneClean, password);
      addToast({
        type: 'success',
        title: `Welcome back, ${user.name}!`,
        message: `Logged in as ${user.role.replace('_', ' ')}`,
      });

      router.push('/chat');
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Invalid phone number or password';
      setError(errorMsg);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00a884]/15 text-[#00a884] shadow-inner mb-2">
          <MessageSquare className="w-9 h-9 fill-[#00a884]/20 text-[#00a884]" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#e9edef]">School Support Chat</h1>
        <p className="text-sm text-[#8696a0]">
          Sign in to access your account
        </p>
      </div>

      {/* Form Container */}
      <div className="bg-[#111b21] p-8 rounded-2xl border border-[#222e35] shadow-2xl space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+14155552671"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            leftIcon={<Phone className="w-4 h-4" />}
            required
            autoComplete="username"
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="focus:outline-none hover:text-[#e9edef] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            required
            autoComplete="current-password"
          />

          <div className="flex items-center justify-end -mt-1">
            <Link
              href="/reset-password"
              className="text-xs text-[#00a884] hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" className="w-full mt-2" isLoading={isLoading}>
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
