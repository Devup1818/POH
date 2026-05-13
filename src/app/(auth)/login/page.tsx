'use client';

import { Suspense, useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, User, KeyRound, AlertCircle, Clock, ShieldCheck } from 'lucide-react';
import { signInStep1, getPending2faEmail } from '@/lib/supabase/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);

  const reason = searchParams.get('reason');
  const isFormValid = identifier.trim().length > 0 && password.length > 0;

  useEffect(() => {
    getPending2faEmail().then((email) => {
      if (email) setPendingEmail(email);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid || isPending) return;

    setError('');

    startTransition(async () => {
      const result = await signInStep1(identifier.trim(), password);

      if (!result.success) {
        setError(result.error ?? 'An error occurred during sign in. Please try again.');
        return;
      }

      // If OTP is disabled (DISABLE_OTP env var), go straight to dashboard
      const otpDisabled = result.otpRequired === false;
      router.push(otpDisabled ? '/' : '/login/verify-otp');
      if (otpDisabled) router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-xl p-8 shadow-2xl w-full max-w-sm">
      <h2 className="mb-1 text-center text-lg font-semibold text-white">
        POH Management System
      </h2>
      <p className="mb-6 text-center text-sm text-white/60">
        Sign in to your account
      </p>

      {reason === 'timeout' && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-amber-400/30 bg-amber-500/10 backdrop-blur-sm p-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <p className="text-sm text-amber-200">
            Your session expired due to inactivity. Please sign in again.
          </p>
        </div>
      )}

      {pendingEmail && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-blue-400/30 bg-blue-500/10 backdrop-blur-sm p-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
          <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
            <p className="text-sm text-blue-200">
              You have a pending verification.
            </p>
            <a
              href="/login/verify-otp"
              className="text-sm font-medium text-blue-300 underline hover:text-blue-200"
            >
              Resume verifying
            </a>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="identifier"
            className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-white/80"
          >
            <User className="h-3.5 w-3.5" />
            Username / Email
          </label>
          <input
            id="identifier"
            type="text"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              if (error) setError('');
            }}
            placeholder="Enter username or email"
            className="block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/30 backdrop-blur-sm transition-all"
            autoFocus
            autoComplete="username"
            disabled={isPending}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-white/80"
          >
            <KeyRound className="h-3.5 w-3.5" />
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError('');
            }}
            placeholder="Enter your password"
            className="block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/30 backdrop-blur-sm transition-all"
            autoComplete="current-password"
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
          disabled={!isFormValid || isPending}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-orange-500/20 transition-all hover:from-amber-400 hover:to-orange-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogIn className="h-4 w-4" />
          {isPending ? 'Verifying...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 rounded-md border border-white/10 bg-white/5 backdrop-blur-sm p-3">
        <p className="text-xs font-medium text-white/50 mb-1">
          Railway POH Management System
        </p>
        <p className="text-xs text-white/30">
          Contact your administrator if you need access or have forgotten your credentials.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-xl p-8 shadow-2xl w-full max-w-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/20 rounded w-3/4 mx-auto" />
          <div className="h-4 bg-white/10 rounded w-1/2 mx-auto" />
          <div className="h-10 bg-white/10 rounded" />
          <div className="h-10 bg-white/10 rounded" />
          <div className="h-10 bg-white/10 rounded" />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
