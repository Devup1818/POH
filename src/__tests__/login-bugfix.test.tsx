/**
 * Bug Condition Exploration Tests
 *
 * These tests validate the fault conditions identified in the bugfix spec.
 * Updated to match the current Supabase-based auth flow.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor, cleanup } from '@testing-library/react';
import React from 'react';

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ─── Test 1: Login form resets loading after successful sign-in ───
// **Validates: Requirements 1.1, 2.1**
describe('Bug 1: handleSubmit loading state reset', () => {
  it('should reset loading to false after successful credential verification', async () => {
    const pushMock = vi.fn();
    vi.doMock('next/navigation', () => ({
      useRouter: () => ({ push: pushMock }),
      useSearchParams: () => new URLSearchParams(),
    }));

    vi.doMock('@/lib/supabase/auth', () => ({
      signInStep1: vi.fn().mockResolvedValue({ success: true }),
      getPending2faEmail: vi.fn().mockResolvedValue(null),
    }));

    const { default: LoginPage } = await import('@/app/(auth)/login/page');

    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('Enter your password');

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
    });

    const signInButton = screen.getByRole('button', { name: /sign in/i });
    await act(async () => {
      fireEvent.click(signInButton);
    });

    // After successful sign-in, router.push should redirect to verify-otp
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/login/verify-otp');
    });

    // The button should not be stuck in "Verifying..." state
    await waitFor(() => {
      expect(screen.queryByText('Verifying...')).not.toBeInTheDocument();
    });
  });
});

// ─── Test 2: handleSubmit catches signInStep1 errors ───
// **Validates: Requirements 1.2, 2.2**
describe('Bug 2: handleSubmit error handling', () => {
  it('should reset loading and show error when signInStep1 fails', async () => {
    vi.doMock('next/navigation', () => ({
      useRouter: () => ({ push: vi.fn() }),
      useSearchParams: () => new URLSearchParams(),
    }));

    vi.doMock('@/lib/supabase/auth', () => ({
      signInStep1: vi.fn().mockResolvedValue({
        success: false,
        error: 'Invalid email or password. Please check your credentials and try again.',
      }),
      getPending2faEmail: vi.fn().mockResolvedValue(null),
    }));

    const { default: LoginPage } = await import('@/app/(auth)/login/page');

    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    const passwordInput = screen.getByPlaceholderText('Enter your password');

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    });

    const signInButton = screen.getByRole('button', { name: /sign in/i });
    await act(async () => {
      fireEvent.click(signInButton);
    });

    // Wait for the error to be displayed
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });

    // The button should not be stuck in "Verifying..." state
    expect(screen.queryByText('Verifying...')).not.toBeInTheDocument();
  });
});

// ─── Test 3: sha256 fallback when crypto.subtle is undefined ───
// **Validates: Requirements 1.4, 2.4**
describe('Bug 4: sha256 fallback for non-secure contexts', () => {
  let originalSubtle: SubtleCrypto | undefined;

  beforeEach(() => {
    originalSubtle = globalThis.crypto?.subtle;
  });

  afterEach(() => {
    // Restore crypto.subtle
    if (originalSubtle) {
      Object.defineProperty(globalThis.crypto, 'subtle', {
        value: originalSubtle,
        writable: true,
        configurable: true,
      });
    }
  });

  it('should return a hex string without throwing when crypto.subtle is undefined', async () => {
    // Remove crypto.subtle to simulate non-secure context
    Object.defineProperty(globalThis.crypto, 'subtle', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { sha256 } = await import('@/lib/auth-context');

    // sha256 should not throw even without crypto.subtle
    const result = await sha256('test-input');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    // Should be a hex string
    expect(result).toMatch(/^[0-9a-f]+$/);
  });
});

// ─── Test 4: Session timeout reason displays correctly ───
// **Validates: Requirements 1.3, 2.3**
describe('Bug 3: Session timeout reason display', () => {
  it('should display session expired message when reason=timeout query param is present', async () => {
    vi.doMock('next/navigation', () => ({
      useRouter: () => ({ push: vi.fn() }),
      useSearchParams: () => new URLSearchParams('reason=timeout'),
    }));

    vi.doMock('@/lib/supabase/auth', () => ({
      signInStep1: vi.fn(),
      getPending2faEmail: vi.fn().mockResolvedValue(null),
    }));

    const { default: LoginPage } = await import('@/app/(auth)/login/page');

    render(<LoginPage />);

    // Should display the session expired message
    await waitFor(() => {
      expect(screen.getByText(/session expired due to inactivity/i)).toBeInTheDocument();
    });
  });
});
