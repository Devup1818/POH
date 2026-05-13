'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, AlertCircle, CheckCircle2, Loader2, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { changePassword } from '@/lib/supabase/auth';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPending) return;
    setError('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    startTransition(async () => {
      const result = await changePassword(currentPassword, newPassword);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => router.push('/settings'), 2000);
      } else {
        setError(result.error ?? 'Failed to change password.');
      }
    });
  }

  return (
    <div className="space-y-5 max-w-md">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-gray-800">Change Password</h1>
        <p className="mt-0.5 text-xs text-gray-400">
          Update your account password
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        {success ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
            <p className="text-sm font-medium text-green-700">Password changed successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="current-password" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <Lock className="h-3.5 w-3.5" />
                Current Password
              </label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => { setCurrentPassword(e.target.value); if (error) setError(''); }}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                autoComplete="current-password"
                disabled={isPending}
              />
            </div>

            <div>
              <label htmlFor="new-password" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <KeyRound className="h-3.5 w-3.5" />
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); if (error) setError(''); }}
                placeholder="Minimum 6 characters"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                autoComplete="new-password"
                disabled={isPending}
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <KeyRound className="h-3.5 w-3.5" />
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError(''); }}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                autoComplete="new-password"
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
              disabled={!currentPassword || !newPassword || !confirmPassword || isPending}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4" />
              )}
              {isPending ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
