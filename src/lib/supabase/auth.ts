'use server';

import { createClient } from '@/lib/supabase/server';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createLoginAuditLog } from './audit';

export async function signIn(email: string, password: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false as const, error: getUserFriendlyError(error.message) };
  }

  return { success: true as const, data: { user: data.user, session: data.session } };
}

export async function signInStep1(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[DEBUG signInStep1] Starting for email:', email);
    const supabase = await createClient();

    // Step 1: Verify credentials
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('[DEBUG signInStep1] Password check failed:', signInError.message, '| status:', signInError.status);
      return { success: false, error: getUserFriendlyError(signInError.message) };
    }

    console.log('[DEBUG signInStep1] Password OK, signing out partial session...');
    // Clear the partial session — no full session until OTP is verified
    await supabase.auth.signOut();

    // Set the 2FA pending cookie with the user's email
    const cookieStore = await cookies();
    cookieStore.set('poh_2fa_pending', email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 300, // 5 minutes
    });

    console.log('[DEBUG signInStep1] Sending OTP...');
    // Trigger OTP delivery
    const { error: otpError } = await supabase.auth.signInWithOtp({ email });

    if (otpError) {
      console.error('[DEBUG signInStep1] OTP send failed:', otpError.message);
      return { success: false, error: getUserFriendlyError(otpError.message) };
    }

    console.log('[DEBUG signInStep1] OTP sent successfully');
    return { success: true };
  } catch (err) {
    console.error('[DEBUG signInStep1] Unhandled exception:', err);
    return { success: false, error: 'An error occurred during sign in. Please try again.' };
  }
}

export async function verifyLoginOtp(token: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const cookieStore = await cookies();
  const email = cookieStore.get('poh_2fa_pending')?.value;

  console.log('[DEBUG verifyLoginOtp] email from cookie:', email, '| token length:', token.length);

  if (!email) {
    return { success: false, error: 'Two-factor session has expired. Please log in again.' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  console.log('[DEBUG verifyLoginOtp] verifyOtp result — error:', error?.message, '| error_code:', (error as any)?.code, '| status:', error?.status, '| has session:', !!data?.session, '| has user:', !!data?.user);

  if (error) {
    const lower = error.message.toLowerCase();
    if (lower.includes('expired') || lower.includes('otp has expired') || lower.includes('otp_expired')) {
      return { success: false, error: 'Verification code has expired. Please request a new one.' };
    }
    return { success: false, error: `Invalid verification code. Please check and try again. (${error.message})` };
  }

  // Clear the 2FA pending cookie on success
  cookieStore.delete('poh_2fa_pending');

  // Auto-provision users table row if missing (fixes RLS data visibility)
  const userId = data.session?.user?.id ?? data.user?.id;
  if (userId) {
    await ensureUserProvisioned(userId, email);
  }

  // Audit logging — non-blocking
  try {
    const headerStore = await headers();
    const ip =
      headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headerStore.get('x-real-ip') ||
      '0.0.0.0';
    if (userId) {
      await createLoginAuditLog(userId, ip);
    }
  } catch {
    // Audit logging failure must not block login
  }

  return { success: true };
}

/**
 * Ensures the authenticated user has a corresponding row in the `users` table.
 * Without this row, RLS policies (is_admin, user_has_shed_access) deny all data.
 * This replaces the auth.users trigger which requires elevated DB permissions.
 *
 * Uses the admin (service_role) client to bypass RLS — the regular client can't
 * INSERT into `users` because the INSERT policy requires is_admin(), which itself
 * needs a `users` row to exist (chicken-and-egg).
 */
async function ensureUserProvisioned(userId: string, email: string): Promise<void> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const adminClient = createAdminClient();

    // Check if user row already exists
    const { data: existing } = await adminClient
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (!existing) {
      // Create a default Viewer row — admin can promote later
      const fullName = email.split('@')[0] ?? '';
      await adminClient
        .from('users')
        .insert({
          id: userId,
          email,
          full_name: fullName,
          role: 'Viewer',
          is_active: true,
        });
    }
  } catch {
    // Provisioning failure must not block login
  }
}

export async function resendOtp(): Promise<{
  success: boolean;
  error?: string;
}> {
  const cookieStore = await cookies();
  const email = cookieStore.get('poh_2fa_pending')?.value;

  if (!email) {
    return { success: false, error: 'Two-factor session has expired. Please log in again.' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({ email });

  if (error) {
    const lower = error.message.toLowerCase();
    if (lower.includes('too many requests') || lower.includes('rate limit')) {
      return { success: false, error: 'Please wait a moment before requesting a new code.' };
    }
    return { success: false, error: 'Failed to send verification code. Please try again.' };
  }

  return { success: true };
}

export async function cancelTwoFactor(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('poh_2fa_pending');
}

export async function getPending2faEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('poh_2fa_pending')?.value ?? null;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function getSession() {
  const supabase = await createClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    return null;
  }

  return session;
}

export async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
}

function getUserFriendlyError(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes('invalid login credentials') ||
    lower.includes('invalid_credentials') ||
    lower.includes('user not found')
  ) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Invalid email or password. Please check your credentials and try again.';
  }
  if (lower.includes('too many requests') || lower.includes('rate limit')) {
    return 'Too many login attempts. Please wait a moment and try again.';
  }
  if (lower.includes('email rate limit')) {
    return 'Too many verification emails sent. Please wait a minute and try again.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  return 'An error occurred during sign in. Please try again.';
}
