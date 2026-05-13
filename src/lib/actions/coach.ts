'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { POHStage, Result } from '@/types';
import { POH_STAGE_ORDER, TARGET_DURATIONS } from '@/lib/constants';
import { createNotificationForShed } from '@/lib/actions/notifications';

function nextStage(current: POHStage): POHStage | null {
  const idx = POH_STAGE_ORDER.indexOf(current);
  if (idx === -1 || idx >= POH_STAGE_ORDER.length - 1) return null;
  return POH_STAGE_ORDER[idx + 1];
}

/**
 * Advance a coach to the next POH stage.
 * Validates: current stage complete, mandatory checklist items done,
 * all tests complete if leaving Testing stage.
 */
export async function advanceCoachStage(
  coachId: string,
): Promise<Result<{ newStage: POHStage }>> {
  const supabase = await createClient();

  // Get current coach info with rake details
  const { data: coach, error: coachErr } = await supabase
    .from('coaches')
    .select('id, rake_id, current_stage, stage_start_date, coach_number, coach_type, rakes!inner(rake_type, poh_type)')
    .eq('id', coachId)
    .single();

  if (coachErr || !coach) {
    return { success: false, error: 'Coach not found' };
  }

  const currentStage = coach.current_stage as POHStage;
  const next = nextStage(currentStage);
  const rakeData = coach.rakes as unknown as { rake_type: string; poh_type: string };

  if (!next) {
    return { success: false, error: 'Coach is already at the final stage (Release)' };
  }

  // If leaving Testing stage, verify all 3 tests are complete
  if (currentStage === 'Testing') {
    const { data: tests } = await supabase
      .from('coach_tests')
      .select('test_type, status')
      .eq('coach_id', coachId);

    const testStatuses = tests ?? [];
    const allComplete =
      testStatuses.length === 3 &&
      testStatuses.every((t) => t.status === 'Completed');

    if (!allComplete) {
      return {
        success: false,
        error: 'All three tests (Electrical, Mechanical, Pneumatic) must be completed before advancing from Testing',
      };
    }
  }

  // Mandatory checklist validation only applies from Finishing stage onwards
  if (POH_STAGE_ORDER.indexOf(currentStage) >= POH_STAGE_ORDER.indexOf('Finishing')) {
    const { data: incompleteItems } = await supabase
      .from('coach_checklist_items')
      .select('id, template:template_id(is_mandatory)')
      .eq('coach_id', coachId)
      .neq('status', 'Completed');

    if (incompleteItems) {
      const incompleteMandatory = incompleteItems.filter((item) => {
        const template = item.template as unknown as { is_mandatory: boolean } | null;
        return template?.is_mandatory === true;
      });

      if (incompleteMandatory.length > 0) {
        return {
          success: false,
          error: `${incompleteMandatory.length} mandatory checklist item(s) must be completed before advancing`,
        };
      }
    }
  }

  const now = new Date().toISOString();

  // Calculate actual duration for current stage
  const startDate = new Date(coach.stage_start_date);
  const actualDays = Math.ceil(
    (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const targetDays = TARGET_DURATIONS[currentStage];

  // Determine timeline status
  let timelineStatus: string;
  if (actualDays < targetDays) {
    timelineStatus = 'Ahead of Schedule';
  } else if (actualDays <= targetDays) {
    timelineStatus = 'On Schedule';
  } else if (actualDays <= targetDays + 2) {
    timelineStatus = 'Minor Delay';
  } else {
    timelineStatus = 'Significant Delay';
  }

  // Update current stage history — mark as complete
  await supabase
    .from('coach_stage_history')
    .update({
      completion_date: now,
      actual_duration_days: actualDays,
      timeline_status: timelineStatus,
    })
    .eq('coach_id', coachId)
    .eq('stage', currentStage)
    .is('completion_date', null);

  // Create new stage history entry
  const nextTargetDays = TARGET_DURATIONS[next];
  await supabase.from('coach_stage_history').insert({
    coach_id: coachId,
    stage: next,
    start_date: now,
    target_duration_days: nextTargetDays,
  });

  // Update coach record
  const { error: updateErr } = await supabase
    .from('coaches')
    .update({
      current_stage: next,
      stage_start_date: now,
    })
    .eq('id', coachId);

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  // Auto-generate job card when coach enters Dismantling
  if (next === 'Dismantling') {
    try {
      const adminClient = createAdminClient();
      await adminClient.rpc('generate_job_card', {
        p_coach_id: coachId,
        p_rake_type: rakeData.rake_type,
        p_coach_type: coach.coach_type ?? 'MC',
        p_poh_cycle: rakeData.poh_type,
      });
    } catch {
      // Job card generation failure should not block stage advancement
    }
  }

  // --- Notification: Check if all coaches in the rake completed the same stage ---
  try {
    const { data: rake } = await supabase
      .from('rakes')
      .select('id, rake_number, shed_id, total_coaches')
      .eq('id', coach.rake_id)
      .single();

    if (rake) {
      // Count coaches still at the old stage or earlier
      const { count: coachesAtOrBefore } = await supabase
        .from('coaches')
        .select('*', { count: 'exact', head: true })
        .eq('rake_id', rake.id)
        .in('current_stage', POH_STAGE_ORDER.slice(0, POH_STAGE_ORDER.indexOf(currentStage) + 1));

      // If no coaches are at or before the old stage, all have advanced past it
      if (coachesAtOrBefore === 0) {
        await createNotificationForShed(
          rake.shed_id,
          'stage_completion',
          `All coaches completed ${currentStage}`,
          `All ${rake.total_coaches} coaches in rake ${rake.rake_number} have completed the ${currentStage} stage and are ready to progress.`,
          'rake',
          rake.id,
        );
      }

      // Notification: If the coach entered a significantly delayed state
      if (timelineStatus === 'Significant Delay') {
        const { data: coachInfo } = await supabase
          .from('coaches')
          .select('coach_number')
          .eq('id', coachId)
          .single();

        await createNotificationForShed(
          rake.shed_id,
          'significant_delay',
          `Coach ${coachInfo?.coach_number ?? coachId} significantly delayed`,
          `Coach ${coachInfo?.coach_number ?? coachId} in rake ${rake.rake_number} completed ${currentStage} with a significant delay of ${actualDays - targetDays} days over target.`,
          'coach',
          coachId,
        );
      }
    }
  } catch {
    // Notification failures should not break stage advancement
  }

  return { success: true, data: { newStage: next } };
}


/**
 * Update a coach's type (MC/TC). Restricted to Admin users.
 * Requires migration 010 (coach_type column).
 */
export async function updateCoachType(
  coachId: string,
  coachType: 'MC' | 'TC',
): Promise<Result<void>> {
  const supabase = await createClient();

  // Verify admin
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return { success: false, error: 'Unauthorized' };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .single();

  if (!profile || profile.role !== 'Admin') {
    return { success: false, error: 'Only Admin can change coach type' };
  }

  const { error } = await supabase
    .from('coaches')
    .update({ coach_type: coachType })
    .eq('id', coachId);

  if (error) {
    // If coach_type column doesn't exist yet (pre-migration), return a helpful message
    if (error.message?.includes('coach_type') || error.code === '42703') {
      return { success: false, error: 'Coach type column not available. Please run migration 010_safe_apply.sql first.' };
    }
    return { success: false, error: error.message };
  }

  return { success: true, data: undefined };
}
