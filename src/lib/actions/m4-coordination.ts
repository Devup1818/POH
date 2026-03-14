'use server';

import { createClient } from '@/lib/supabase/server';
import type { Result } from '@/types';
import { addM4CoordinationSchema } from '@/lib/validations/section';
import { verifySSESectionAccess } from '@/lib/auth/permissions';

export async function addM4CoordinationEntry(
  coachId: string,
  activityType: string,
  supportedSection: string,
  notes?: string
): Promise<Result<void>> {
  const parsed = addM4CoordinationSchema.safeParse({ coachId, activityType, supportedSection, notes });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Verify user is Admin or has M4 section assignment
  const access = await verifySSESectionAccess(supabase, user.id, 'M4');
  if (!access.authorized) return { success: false, error: access.error };

  // Look up M4 section ID
  const { data: m4Section } = await supabase
    .from('workshop_sections')
    .select('id')
    .eq('section_code', 'M4')
    .single();
  if (!m4Section) return { success: false, error: 'M4 section not found' };

  // Look up supported section ID
  const { data: supportedSectionRow } = await supabase
    .from('workshop_sections')
    .select('id')
    .eq('section_code', parsed.data.supportedSection)
    .single();
  if (!supportedSectionRow) return { success: false, error: 'Supported section not found' };

  // Insert coordination entry
  const { error } = await supabase.from('m4_coordination_entries').insert({
    coach_id: parsed.data.coachId,
    section_id: m4Section.id,
    supported_section_id: supportedSectionRow.id,
    activity_type: parsed.data.activityType,
    status: 'Pending',
    notes: parsed.data.notes ?? null,
    logged_by: user.id,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}
