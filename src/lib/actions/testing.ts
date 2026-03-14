'use server';

import { createClient } from '@/lib/supabase/server';
import type { TestStatus, TestType, Result } from '@/types';
import { createNotificationForShed } from '@/lib/actions/notifications';

/* ── Types ───────────────────────────────────────────────── */

export interface TestRecord {
  id: string;
  coachId: string;
  testType: TestType;
  status: TestStatus;
  startDate: string | null;
  completionDate: string | null;
  completedBy: string | null;
  completedByName: string | null;
  notes: string | null;
}

/* ── Valid status transitions ────────────────────────────── */

const VALID_TRANSITIONS: Record<TestStatus, TestStatus[]> = {
  'Not Started': ['In Progress'],
  'In Progress': ['Not Started', 'Completed'],
  Completed: ['Not Started', 'In Progress'],
};

/* ── updateTestStatus ────────────────────────────────────── */

/**
 * Update a test type's status for a coach.
 * Records start/completion timestamps and completed_by user.
 * Validates status transition.
 */
export async function updateTestStatus(
  coachId: string,
  testType: TestType,
  status: TestStatus,
  notes?: string,
): Promise<Result<void>> {
  const supabase = await createClient();

  // Fetch current test record to validate transition
  const { data: existing, error: fetchError } = await supabase
    .from('coach_tests')
    .select('id, status')
    .eq('coach_id', coachId)
    .eq('test_type', testType)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: 'Test record not found' };
  }

  // Validate status transition
  const currentStatus = existing.status as TestStatus;
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed?.includes(status)) {
    return {
      success: false,
      error: `Cannot transition from "${currentStatus}" to "${status}"`,
    };
  }

  const { data: { user } } = await supabase.auth.getUser();
  const now = new Date().toISOString();

  const update: Record<string, unknown> = {
    status,
  };

  // Only update notes if provided
  if (notes !== undefined) {
    update.notes = notes || null;
  }

  if (status === 'In Progress') {
    update.start_date = now;
    update.completion_date = null;
    update.completed_by = null;
  } else if (status === 'Completed') {
    // If no start_date was set, set it now
    if (!existing.status || existing.status === 'Not Started') {
      update.start_date = now;
    }
    update.completion_date = now;
    update.completed_by = user?.id ?? null;
  } else if (status === 'Not Started') {
    update.start_date = null;
    update.completion_date = null;
    update.completed_by = null;
  }

  const { error } = await supabase
    .from('coach_tests')
    .update(update)
    .eq('coach_id', coachId)
    .eq('test_type', testType);

  if (error) return { success: false, error: error.message };

  // Notification: Check if all 3 tests are now complete
  if (status === 'Completed') {
    try {
      const { data: allTests } = await supabase
        .from('coach_tests')
        .select('test_type, status')
        .eq('coach_id', coachId);

      const allComplete =
        allTests &&
        allTests.length === 3 &&
        allTests.every((t) => t.status === 'Completed');

      if (allComplete) {
        // Get coach and rake info for the notification
        const { data: coach } = await supabase
          .from('coaches')
          .select('coach_number, rake_id, rakes!inner(rake_number, shed_id)')
          .eq('id', coachId)
          .single();

        if (coach) {
          const rake = coach.rakes as unknown as { rake_number: string; shed_id: string };
          await createNotificationForShed(
            rake.shed_id,
            'testing_complete',
            `All tests complete for coach ${coach.coach_number}`,
            `All three tests (Electrical, Mechanical, Pneumatic) have been completed for coach ${coach.coach_number} in rake ${rake.rake_number}. The coach is ready to advance to Trial stage.`,
            'coach',
            coachId,
          );
        }
      }
    } catch {
      // Notification failures should not break test updates
    }
  }

  return { success: true, data: undefined };
}

/* ── getTestsForCoach ────────────────────────────────────── */

/**
 * Fetch all 3 test records for a coach.
 * Returns test records with completed_by user name resolved.
 */
export async function getTestsForCoach(
  coachId: string,
): Promise<Result<TestRecord[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('coach_tests')
    .select(`
      id, coach_id, test_type, status, start_date, completion_date,
      completed_by, notes,
      completer:completed_by ( full_name )
    `)
    .eq('coach_id', coachId)
    .order('test_type');

  if (error) return { success: false, error: error.message };

  const records: TestRecord[] = (data ?? []).map((t) => ({
    id: t.id,
    coachId: t.coach_id,
    testType: t.test_type as TestType,
    status: t.status as TestStatus,
    startDate: t.start_date,
    completionDate: t.completion_date,
    completedBy: t.completed_by,
    completedByName: (t.completer as unknown as { full_name: string } | null)?.full_name ?? null,
    notes: t.notes,
  }));

  return { success: true, data: records };
}
