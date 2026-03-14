'use client';

import { Suspense, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Mail, KeyRound, AlertCircle, Clock } from 'lucide-react';
import { signInStep1 } from '@/lib/supabase/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const reason = searchParams.get('reason');
  const isFormValid = email.trim().length > 0 && password.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFormValid || isPending) return;

    setError('');

    startTransition(async () => {
      const result = await signInStep1(email.trim(), password);

      if (!result.success) {
        setError(result.error ?? 'An error occurred during sign in. Please try again.');
        return;
      }

      router.push('/login/verify-otp');
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm w-full max-w-sm">
      <h2 className="mb-1 text-center text-lg font-semibold text-gray-900">
        POH Management System
      </h2>
      <p className="mb-6 text-center text-sm text-gray-500">
        Sign in to your account
      </p>

      {reason === 'timeout' && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-700">
            Your session expired due to inactivity. Please sign in again.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700"
          >
            <Mail className="h-3.5 w-3.5" />
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            placeholder="you@example.com"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            autoFocus
            autoComplete="email"
            disabled={isPending}
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700"
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
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            autoComplete="current-password"
            disabled={isPending}
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!isFormValid || isPending}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LogIn className="h-4 w-4" />
          {isPending ? 'Verifying...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 rounded-md border border-gray-100 bg-gray-50 p-3">
        <p className="text-xs font-medium text-gray-500 mb-1">
          Railway POH Management System
        </p>
        <p className="text-xs text-gray-400">
          Contact your administrator if you need access or have forgotten your credentials.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm w-full max-w-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
