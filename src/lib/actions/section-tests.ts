'use server';

import { createClient } from '@/lib/supabase/server';
import type { Result } from '@/types';
import { recordTestResultSchema } from '@/lib/validations/section';
import { verifySSESectionAccess } from '@/lib/auth/permissions';

export async function recordSectionTestResult(testId: string, measuredValues: string, passed: boolean, notes?: string): Promise<Result<void>> {
  const parsed = recordTestResultSchema.safeParse({ testId, measuredValues, passed, notes });
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Get the test's section
  const { data: test } = await supabase
    .from('section_test_instances')
    .select('section_id, workshop_sections(section_code)')
    .eq('id', testId)
    .single();
  if (!test) return { success: false, error: 'Test not found' };

  // Verify SSE access
  const sectionCode = (test as any).workshop_sections?.section_code;
  const access = await verifySSESectionAccess(supabase, user.id, sectionCode);
  if (!access.authorized) return { success: false, error: access.error };

  const { error } = await supabase
    .from('section_test_instances')
    .update({
      status: passed ? 'Completed' : 'Failed',
      measured_values: parsed.data.measuredValues,
      passed: parsed.data.passed,
      tested_at: new Date().toISOString(),
      tested_by: user.id,
      notes: parsed.data.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', testId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}
