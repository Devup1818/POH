import type { UserRole } from '@/types';
import { createClient } from '@/lib/supabase/client';

/**
 * Permission checking utilities for role-based access control.
 * 
 * Role hierarchy:
 * - Admin: Full access to all sheds and all operations
 * - Senior_Section_Engineer: Create, update, view at assigned sheds
 * - Junior_Engineer: Create, update, view at assigned sheds
 * - Technician: View at assigned sheds, add notes
 * - Viewer: Read-only access at assigned sheds
 */

/** Roles allowed to create new rakes */
const RAKE_CREATORS: UserRole[] = ['Admin', 'Senior_Section_Engineer', 'Junior_Engineer'];

/** Roles allowed to update coach data (stage, parts, checklist, tests) */
const COACH_UPDATERS: UserRole[] = ['Admin', 'Senior_Section_Engineer', 'Junior_Engineer'];

/** Roles allowed to add notes */
const NOTE_ADDERS: UserRole[] = ['Admin', 'Senior_Section_Engineer', 'Junior_Engineer', 'Technician'];

/** Admin-only operations */
const ADMIN_ONLY: UserRole[] = ['Admin'];

export function canCreateRake(role: UserRole): boolean {
  return RAKE_CREATORS.includes(role);
}

export function canUpdateCoach(role: UserRole): boolean {
  return COACH_UPDATERS.includes(role);
}

export function canAddNotes(role: UserRole): boolean {
  return NOTE_ADDERS.includes(role);
}

export function canViewOnly(role: UserRole): boolean {
  return role === 'Viewer';
}

export function canManageUsers(role: UserRole): boolean {
  return ADMIN_ONLY.includes(role);
}

export function canManageSheds(role: UserRole): boolean {
  return ADMIN_ONLY.includes(role);
}

export function canDeleteRake(role: UserRole): boolean {
  return ADMIN_ONLY.includes(role);
}

export function canEditRake(role: UserRole): boolean {
  return ADMIN_ONLY.includes(role);
}


/**
 * Check if a user has access to a specific shed.
 * Admin users always have access to all sheds.
 * Other users must have an explicit shed assignment.
 * 
 * Falls back to `true` if the database is unavailable (dev mode).
 */
export async function canAccessShed(
  userId: string,
  shedId: string,
): Promise<boolean> {
  try {
    const supabase = createClient();

    // Check if user is Admin — Admins can access all sheds
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (profile?.role === 'Admin') {
      return true;
    }

    // Check shed assignment for non-Admin users
    const { data: assignment } = await supabase
      .from('user_shed_assignments')
      .select('id')
      .eq('user_id', userId)
      .eq('shed_id', shedId)
      .single();

    return !!assignment;
  } catch {
    // DB not available — allow access in development
    return true;
  }
}


/**
 * Check if a user can access a specific POH section.
 * Admin users bypass section filtering and can access all sections.
 * SSE/other users must have an explicit section_in_charge_assignment.
 */
export async function canAccessSection(
  userId: string,
  sectionName: string,
): Promise<boolean> {
  try {
    const supabase = createClient();

    // Admin users can access all sections
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (profile?.role === 'Admin') {
      return true;
    }

    // Check section_in_charge_assignments for non-Admin users
    const { data: assignment } = await supabase
      .from('section_in_charge_assignments')
      .select('id')
      .eq('user_id', userId)
      .eq('section_name', sectionName)
      .single();

    return !!assignment;
  } catch {
    return true;
  }
}

/**
 * Get the list of POH section names assigned to a user within a specific shed.
 * Admin users get all 10 POH sections.
 */
export async function getUserSections(
  userId: string,
  shedId: string,
): Promise<string[]> {
  try {
    const supabase = createClient();

    // Admin users see all sections
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (profile?.role === 'Admin') {
      const { POH_SECTIONS } = await import('@/lib/constants');
      return [...POH_SECTIONS];
    }

    // Non-Admin: return only assigned sections for this shed
    const { data: assignments } = await supabase
      .from('section_in_charge_assignments')
      .select('section_name')
      .eq('user_id', userId)
      .eq('shed_id', shedId);

    return assignments?.map((a) => a.section_name) ?? [];
  } catch {
    return [];
  }
}

/**
 * Verify that an SSE user has permission to modify data in a specific workshop section.
 * Admin users always have access. SSE users must have the section assigned via user_section_assignments.
 *
 * Accepts a Supabase server client as parameter to avoid import conflicts
 * (permissions.ts uses the browser client, but this function is called from server actions).
 *
 * Returns { authorized: true } or { authorized: false, error: string }
 */
export async function verifySSESectionAccess(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  sectionCode: string
): Promise<{ authorized: true } | { authorized: false; error: string }> {
  // Check if user is Admin — Admins always have access
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (profile?.role === 'Admin') {
    return { authorized: true };
  }

  // For non-Admin: check user_section_assignments for matching section
  const { data: assignment } = await supabase
    .from('user_section_assignments')
    .select('sub_section')
    .eq('user_id', userId)
    .eq('sub_section', sectionCode)
    .single();

  if (!assignment) {
    return { authorized: false, error: 'You do not have permission to modify this section' };
  }

  return { authorized: true };
}

