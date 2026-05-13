'use client';

import { Suspense, useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, AlertCircle, CheckCircle2, Loader2, Lock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { resetPassword } from '@/lib/supabase/auth';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [sessionReady, setSessionReady] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    const code = searchParams.get('code');

    async function init() {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setError('Invalid or expired reset link. Please request a new one.');
          setVerifying(false);
          return;
        }
        setSessionReady(true);
        setVerifying(false);
      } else {
        // Check if already authenticated (direct access with hash from email)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setSessionReady(true);
        }
        setVerifying(false);
      }
    }

    init();
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPending) return;
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    startTransition(async () => {
      const result = await resetPassword(password);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => router.push('/'), 3000);
      } else {
        setError(result.error ?? 'Failed to reset password.');
      }
    });
  }

  if (success) {
    return (
      <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-xl p-8 shadow-2xl w-full max-w-sm">
        <div className="flex flex-col items-center gap-3">
          <CheckCircle2 className="h-12 w-12 text-green-300" />
          <h2 className="text-lg font-semibold text-white">Password Reset Successful</h2>
          <p className="text-center text-sm text-white/60">
            Your password has been updated. Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-xl p-8 shadow-2xl w-full max-w-sm">
      <h2 className="mb-1 text-center text-lg font-semibold text-white">
        Set New Password
      </h2>
      <p className="mb-6 text-center text-sm text-white/60">
        Enter your new password below
      </p>

      {verifying ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-300" />
          <p className="text-sm text-white/60">Verifying reset link...</p>
        </div>
      ) : !sessionReady ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <AlertCircle className="h-8 w-8 text-red-300" />
          <p className="text-sm text-red-200 text-center">
            {error || 'Invalid or expired reset link. Please request a new one.'}
          </p>
          <a
            href="/forgot-password"
            className="text-sm font-medium text-amber-300 hover:text-amber-200 transition-colors"
          >
            Request new reset link
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="new-password"
              className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-white/80"
            >
              <Lock className="h-3.5 w-3.5" />
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
              placeholder="Minimum 6 characters"
              className="block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/30 backdrop-blur-sm transition-all"
              autoFocus
              autoComplete="new-password"
              disabled={isPending}
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-white/80"
            >
              <KeyRound className="h-3.5 w-3.5" />
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError(''); }}
              placeholder="Re-enter your new password"
              className="block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/30 backdrop-blur-sm transition-all"
              autoComplete="new-password"
              disabled={isPending}
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-400/30 bg-red-500/10 backdrop-blur-sm p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!password || !confirmPassword || isPending}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-orange-500/20 transition-all hover:from-amber-400 hover:to-orange-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            {isPending ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-xl p-8 shadow-2xl w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 py-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-300" />
          <p className="text-sm text-white/60">Verifying reset link...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
