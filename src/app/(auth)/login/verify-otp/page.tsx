'use client';

import { useState, useTransition, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { sanitizeOtpInput, isValidOtp } from '@/lib/utils/otp';
import { verifyLoginOtp, resendOtp, cancelTwoFactor, getPending2faEmail } from '@/lib/supabase/auth';
import { maskEmail } from '@/lib/utils/otp';

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyOtpPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);

  // Fetch the masked email on mount
  useEffect(() => {
    getPending2faEmail().then((email) => {
      if (email) setMaskedEmail(maskEmail(email));
    });
  }, []);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleOtpChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const sanitized = sanitizeOtpInput(e.target.value).slice(0, 8);
      setOtp(sanitized);
      if (validationError) setValidationError('');
      if (error) setError('');
    },
    [validationError, error]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPending) return;

    // Client-side validation
    if (!otp || otp.length < 6) {
      setValidationError('Please enter the complete verification code.');
      return;
    }

    if (!isValidOtp(otp)) {
      setValidationError('Please enter a valid numeric verification code.');
      return;
    }

    setError('');
    setValidationError('');
    setSuccessMessage('');

    startTransition(async () => {
      const result = await verifyLoginOtp(otp);

      if (!result.success) {
        setError(result.error ?? 'Verification failed. Please try again.');
        setOtp('');
        return;
      }

      router.push('/');
      router.refresh();
    });
  }

  async function handleResend() {
    if (isResending || resendCooldown > 0) return;

    setIsResending(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await resendOtp();

      if (!result.success) {
        setError(result.error ?? 'Failed to resend code. Please try again.');
      } else {
        setSuccessMessage('A new verification code has been sent to your email.');
        setOtp('');
      }

      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } finally {
      setIsResending(false);
    }
  }

  async function handleBackToLogin() {
    if (isCancelling) return;
    setIsCancelling(true);

    try {
      await cancelTwoFactor();
      router.push('/login');
    } finally {
      setIsCancelling(false);
    }
  }

  const isSubmitDisabled = isPending || !otp || otp.length < 6;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm w-full max-w-sm">
      <div className="mb-1 flex items-center justify-center gap-2">
        <ShieldCheck className="h-5 w-5 text-blue-600" />
        <h2 className="text-center text-lg font-semibold text-gray-900">
          Two-Factor Verification
        </h2>
      </div>
      <p className="mb-6 text-center text-sm text-gray-500">
        {maskedEmail
          ? <>We&apos;ve sent a verification code to <span className="font-medium text-gray-700">{maskedEmail}</span></>
          : <>We&apos;ve sent a verification code to your email</>}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="otp-input"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Verification Code
          </label>
          <input
            id="otp-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={8}
            value={otp}
            onChange={handleOtpChange}
            placeholder="Enter verification code"
            aria-label="Verification code"
            aria-describedby={
              validationError
                ? 'otp-validation-error'
                : error
                  ? 'otp-error'
                  : undefined
            }
            aria-invalid={!!(validationError || error)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-center text-lg font-mono tracking-widest shadow-sm placeholder:text-gray-400 placeholder:text-sm placeholder:tracking-normal placeholder:font-sans focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            autoFocus
            autoComplete="one-time-code"
            disabled={isPending}
          />
        </div>

        {validationError && (
          <div
            id="otp-validation-error"
            role="alert"
            className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-sm text-red-700">{validationError}</p>
          </div>
        )}

        {error && (
          <div
            id="otp-error"
            role="alert"
            className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-3"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitDisabled}
          aria-busy={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              Verify Code
            </>
          )}
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending || resendCooldown > 0}
          aria-busy={isResending}
          aria-label={
            resendCooldown > 0
              ? `Resend code available in ${resendCooldown} seconds`
              : 'Resend verification code'
          }
          className="flex items-center gap-1.5 text-sm font-medium text-blue-600 transition-colors hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isResending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          {resendCooldown > 0
            ? `Resend in ${resendCooldown}s`
            : isResending
              ? 'Sending...'
              : 'Resend Code'}
        </button>

        <button
          type="button"
          onClick={handleBackToLogin}
          disabled={isCancelling}
          aria-label="Go back to login page"
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {isCancelling ? 'Redirecting...' : 'Back to Login'}
        </button>
      </div>

      <div className="mt-6 rounded-md border border-gray-100 bg-gray-50 p-3">
        <p className="text-xs text-gray-400">
          Check your email inbox for the 6-digit verification code. If you
          don&apos;t see it, check your spam folder or request a new code.
        </p>
      </div>
    </div>
  );
}
