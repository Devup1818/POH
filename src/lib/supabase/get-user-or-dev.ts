/**
 * Client-side helper: resolves the current user ID + Supabase client.
 *
 * When auth is disabled it returns the DEV_USER identity so that
 * components can still query the DB with a valid user ID.
 */
import { createClient } from '@/lib/supabase/client';
import { isAuthEnabled, DEV_USER } from '@/lib/dev-auth';

/**
 * Returns { supabase, userId } — works whether auth is on or off.
 * Components should use this instead of calling supabase.auth.getUser() directly.
 */
export async function getClientUser() {
  const supabase = createClient();

  if (!isAuthEnabled) {
    return { supabase, userId: DEV_USER.id, email: DEV_USER.email };
  }

  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null, email: user?.email ?? null };
}
