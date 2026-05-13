'use client';

import { useState, useTransition } from 'react';
import { Mail, ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { forgotPassword } from '@/lib/supabase/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || isPending) return;
    setError('');

    startTransition(async () => {
      const result = await forgotPassword(email.trim());
      if (result.success) {
        setSent(true);
      } else {
        setError(result.error ?? 'Failed to send reset email.');
      }
    });
  }

  return (
    <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-xl p-8 shadow-2xl w-full max-w-sm">
      <h2 className="mb-1 text-center text-lg font-semibold text-white">
        Reset Password
      </h2>
      <p className="mb-6 text-center text-sm text-white/60">
        {sent
          ? 'Check your email for the reset link'
          : 'Enter your email or username to receive a reset link'}
      </p>

      {sent ? (
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-md border border-green-400/30 bg-green-500/10 backdrop-blur-sm p-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-300" />
            <div>
              <p className="text-sm font-medium text-green-200">Reset link sent</p>
              <p className="mt-1 text-xs text-green-300">
                If an account exists with that email, you'll receive a password reset link shortly.
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 text-sm font-medium text-amber-300 hover:text-amber-200 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="reset-email"
              className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-white/80"
            >
              <Mail className="h-3.5 w-3.5" />
              Email / Username
            </label>
            <input
              id="reset-email"
              type="text"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
              placeholder="Enter your email or username"
              className="block w-full rounded-md border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/30 backdrop-blur-sm transition-all"
              autoFocus
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
            disabled={!email.trim() || isPending}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-orange-500/20 transition-all hover:from-amber-400 hover:to-orange-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-transparent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            {isPending ? 'Sending...' : 'Send Reset Link'}
          </button>

          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 text-sm font-medium text-white/50 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Login
          </Link>
        </form>
      )}
    </div>
  );
}
