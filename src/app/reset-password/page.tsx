'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { MessageSquare, Lock, Eye, EyeOff, CheckCircle2, ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-[#8696a0] text-center p-8">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // If token is present in URL, we show Reset Password form.
  // If token is missing, we show Forgot Password (request email) form.
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Password reset token is missing or expired. Please request a new link.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
      setError('Password must contain at least one letter and one number');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setIsSuccess(true);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Password reset failed. The link may have expired.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your registered email address');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      setIsEmailSent(true);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to send reset email. Please verify your email address.';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c1317] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00a884]/15 text-[#00a884] shadow-inner mb-2">
            <MessageSquare className="w-9 h-9 fill-[#00a884]/20 text-[#00a884]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#e9edef]">
            {token ? 'Reset Password' : 'Forgot Password'}
          </h1>
          <p className="text-sm text-[#8696a0]">
            {token
              ? 'Choose a new password for your account'
              : 'Enter your registered email to receive a password reset link'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#111b21] p-8 rounded-2xl border border-[#222e35] shadow-2xl space-y-5">
          {isSuccess ? (
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-semibold text-[#e9edef]">Password Reset Successful!</h2>
              <p className="text-xs text-[#8696a0] leading-relaxed">
                Your password has been updated. You can now sign in with your new credentials.
              </p>
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full mt-4"
                onClick={() => router.push('/login')}
              >
                Go to Sign In
              </Button>
            </div>
          ) : isEmailSent ? (
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#00a884]/20 text-[#00a884]">
                <Mail className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-semibold text-[#e9edef]">Check Your Email</h2>
              <p className="text-xs text-[#8696a0] leading-relaxed">
                If an account matches <strong className="text-[#e9edef]">{email}</strong>, a link
                to reset your password has been sent.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 text-xs text-[#00a884] hover:underline pt-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          ) : token ? (
            /* Reset password form with token */
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <Input
                label="New Password"
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
                autoComplete="new-password"
              />

              <Input
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="focus:outline-none hover:text-[#e9edef] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                required
                autoComplete="new-password"
              />

              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2"
                isLoading={isLoading}
              >
                Reset Password
              </Button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs text-[#8696a0] hover:text-[#e9edef]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            </form>
          ) : (
            /* Forgot password form without token */
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <Input
                label="Registered Email"
                type="email"
                placeholder="student@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
                autoComplete="email"
              />

              {error && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2"
                isLoading={isLoading}
              >
                Send Reset Link
              </Button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs text-[#8696a0] hover:text-[#e9edef]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
