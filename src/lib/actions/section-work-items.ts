'use server';

import { createClient } from '@/lib/supabase/server';
import type { Result } from '@/types';
import { updateWorkItemStatusSchema } from '@/lib/validations/section';
import { verifySSESectionAccess } from '@/lib/auth/permissions';

export async function updateSectionWorkItemStatus(itemId: string, status: string): Promise<Result<void>> {
  const parsed = updateWorkItemStatusSchema.safeParse({ itemId, status });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Get the work item's section
  const { data: item } = await supabase
    .from('section_work_items')
    .select('section_id, workshop_sections(section_code)')
    .eq('id', itemId)
    .single();
  if (!item) return { success: false, error: 'Work item not found' };

  // Verify SSE access
  const sectionCode = (item as any).workshop_sections?.section_code;
  const access = await verifySSESectionAccess(supabase, user.id, sectionCode);
  if (!access.authorized) return { success: false, error: access.error };

  const updateData: Record<string, unknown> = { status: parsed.data.status, updated_at: new Date().toISOString() };
  if (parsed.data.status === 'Completed') {
    updateData.completion_date = new Date().toISOString();
    updateData.completed_by = user.id;
  }

  const { error } = await supabase.from('section_work_items').update(updateData).eq('id', itemId);
  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}
