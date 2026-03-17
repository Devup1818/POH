/**
 * Server-side helper: returns the current user ID.
 *
 * When NEXT_PUBLIC_AUTH_ENABLED=false it returns the dev user ID
 * (from DEV_USER_ID env var or the default placeholder UUID)
 * so that server actions can still run DB queries.
 *
 * When auth is enabled it delegates to supabase.auth.getUser().
 */
import { createClient } from '@/lib/supabase/server';

const isAuthEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLED !== 'false';
const DEV_USER_ID = process.env.DEV_USER_ID || '00000000-0000-0000-0000-000000000000';

/**
 * Get the authenticated user from Supabase, or a mock user when auth is bypassed.
 * Returns the same shape as supabase.auth.getUser().data.user.
 */
export async function getEffectiveUser() {
  if (!isAuthEnabled) {
    return {
      id: DEV_USER_ID,
      email: 'dev@localhost',
      aud: 'authenticated',
      role: 'authenticated',
      app_metadata: {},
      user_metadata: { role: 'Admin', full_name: 'Dev Admin' },
      created_at: '',
    } as any;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
