'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { useUIStore } from '@/stores/useUIStore';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Phone, Lock, Eye, EyeOff, MessageSquare, ShieldCheck, UserCheck, GraduationCap } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const { addToast } = useUIStore();

  const [phoneNumber, setPhoneNumber] = useState('+10000000001');
  const [password, setPassword] = useState('password1');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate phone number per backend spec ^\+?[0-9]{7,15}$
    const phoneClean = phoneNumber.trim();
    if (!/^\+?[0-9]{7,15}$/.test(phoneClean)) {
      setError('Please enter a valid phone number (7-15 digits, e.g. +10000000001)');
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

      if (user.role === 'super_admin') {
        router.push('/chat');
      } else {
        router.push('/chat');
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Invalid phone number or password';
      setError(errorMsg);
    }
  };

  const handleQuickFill = (phone: string, pass: string) => {
    setPhoneNumber(phone);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* WhatsApp Header Badge */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00a884]/15 text-[#00a884] shadow-inner mb-2">
          <MessageSquare className="w-9 h-9 fill-[#00a884]/20 text-[#00a884]" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#e9edef]">School Support Chat</h1>
        <p className="text-sm text-[#8696a0]">
          Sign in with your phone number to access your support desk
        </p>
      </div>

      {/* Form Container */}
      <div className="bg-[#111b21] p-8 rounded-2xl border border-[#222e35] shadow-2xl space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Phone Number"
            type="tel"
            placeholder="+10000000001"
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

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" size="lg" className="w-full mt-2" isLoading={isLoading}>
            Sign In to Support
          </Button>
        </form>

        {/* Quick Credentials Helpers for Testing / Evaluation */}
        <div className="pt-4 border-t border-[#222e35] space-y-2.5">
          <p className="text-[11px] font-semibold text-[#8696a0] uppercase tracking-wider text-center">
            Quick demo presets
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('+10000000001', 'password1')}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#202c33] hover:bg-[#2a3942] border border-[#2a3942] transition-all text-left group"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-medium text-[#e9edef]">Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('+10000000002', 'password1')}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#202c33] hover:bg-[#2a3942] border border-[#2a3942] transition-all text-left group"
            >
              <UserCheck className="w-4 h-4 text-sky-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-medium text-[#e9edef]">Agent</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('+10000000003', 'password1')}
              className="flex flex-col items-center justify-center p-2 rounded-lg bg-[#202c33] hover:bg-[#2a3942] border border-[#2a3942] transition-all text-left group"
            >
              <GraduationCap className="w-4 h-4 text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-medium text-[#e9edef]">Student</span>
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-[#8696a0]">
        Accounts are provisioned by the School Administration.
      </p>
    </div>
  );
}
