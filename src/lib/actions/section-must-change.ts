'use server';

import { createClient } from '@/lib/supabase/server';
import type { Result } from '@/types';
import { replaceMustChangeItemSchema } from '@/lib/validations/section';
import { verifySSESectionAccess } from '@/lib/auth/permissions';

export async function replaceMustChangeItem(itemId: string, oldPartDetail: string, newPartDetail: string): Promise<Result<void>> {
  const parsed = replaceMustChangeItemSchema.safeParse({ itemId, oldPartDetail, newPartDetail });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Get the item's section
  const { data: item } = await supabase
    .from('must_change_item_instances')
    .select('section_id, workshop_sections(section_code)')
    .eq('id', itemId)
    .single();
  if (!item) return { success: false, error: 'Must change item not found' };

  // Verify SSE access
  const sectionCode = (item as any).workshop_sections?.section_code;
  const access = await verifySSESectionAccess(supabase, user.id, sectionCode);
  if (!access.authorized) return { success: false, error: access.error };

  const { error } = await supabase
    .from('must_change_item_instances')
    .update({
      is_replaced: true,
      old_part_detail: parsed.data.oldPartDetail,
      new_part_detail: parsed.data.newPartDetail,
      replaced_at: new Date().toISOString(),
      replaced_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}
