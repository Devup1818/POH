/**
 * Dev-mode auth bypass configuration.
 *
 * When NEXT_PUBLIC_AUTH_ENABLED=false, the app skips login/OTP but still
 * talks to Supabase for data.  Components that need a "current user" fall
 * back to DEV_USER below.
 *
 * Set DEV_USER_ID to a real user UUID from your `users` table so that
 * RLS policies and shed assignments work correctly.
 */

export const isAuthEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLED !== 'false';

/** Fallback identity used by client & server code when auth is bypassed. */
export const DEV_USER = {
  /** Replace DEV_USER_ID in .env.local with a real UUID from your Supabase `users` table */
  id: process.env.NEXT_PUBLIC_DEV_USER_ID || '00000000-0000-0000-0000-000000000000',
  email: 'dev@localhost',
  full_name: 'Dev Admin',
  role: 'Admin' as const,
};
