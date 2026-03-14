'use server';

import { createClient } from '@/lib/supabase/server';
import type { Result } from '@/types';
import { completeSectionSchema } from '@/lib/validations/section';
import { verifySSESectionAccess } from '@/lib/auth/permissions';

export async function completeSectionForCoach(coachId: string, sectionCode: string): Promise<Result<void>> {
  const parsed = completeSectionSchema.safeParse({ coachId, sectionCode });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Verify SSE access
  const access = await verifySSESectionAccess(supabase, user.id, sectionCode);
  if (!access.authorized) return { success: false, error: access.error };

  // Get section ID
  const { data: section } = await supabase
    .from('workshop_sections')
    .select('id')
    .eq('section_code', sectionCode)
    .single();
  if (!section) return { success: false, error: 'Section not found' };

  // Check unreplaced must change items
  const { data: unreplaced } = await supabase
    .from('must_change_item_instances')
    .select('id, must_change_item_templates(item_name)')
    .eq('coach_id', coachId)
    .eq('section_id', section.id)
    .eq('is_replaced', false);

  if (unreplaced && unreplaced.length > 0) {
    const names = unreplaced.map((u: any) => u.must_change_item_templates?.item_name).filter(Boolean).join(', ');
    return { success: false, error: `Section cannot be completed: ${unreplaced.length} Must Change Items remaining (${names})` };
  }

  // Check failed/incomplete tests
  const { data: failedTests } = await supabase
    .from('section_test_instances')
    .select('id, section_test_templates(test_name)')
    .eq('coach_id', coachId)
    .eq('section_id', section.id)
    .in('status', ['Not Started', 'In Progress', 'Failed']);

  if (failedTests && failedTests.length > 0) {
    const names = failedTests.map((t: any) => t.section_test_templates?.test_name).filter(Boolean).join(', ');
    return { success: false, error: `Section cannot be completed: ${failedTests.length} tests remaining/failed (${names})` };
  }

  // Mark all work items as completed
  const { error } = await supabase
    .from('section_work_items')
    .update({ status: 'Completed', completion_date: new Date().toISOString(), completed_by: user.id, updated_at: new Date().toISOString() })
    .eq('coach_id', coachId)
    .eq('section_id', section.id)
    .neq('status', 'Completed');

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}
