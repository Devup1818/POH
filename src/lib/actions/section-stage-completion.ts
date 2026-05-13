'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { POHStage, Result } from '@/types';
import { POH_STAGE_ORDER, TARGET_DURATIONS } from '@/lib/constants';

export async function markSectionStageComplete(
  coachId: string,
  sectionCode: string,
  notes?: string,
): Promise<Result<{ advanced: boolean; newStage?: POHStage }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Get coach info
  const { data: coach, error: coachErr } = await supabase
    .from('coaches')
    .select('id, current_stage, stage_start_date, rake_id')
    .eq('id', coachId)
    .single();

  if (coachErr || !coach) return { success: false, error: 'Coach not found' };

  const currentStage = coach.current_stage as POHStage;

  // Get section ID
  const { data: section } = await supabase
    .from('workshop_sections')
    .select('id, section_type')
    .eq('section_code', sectionCode)
    .single();

  if (!section) return { success: false, error: 'Section not found' };

  // Verify access: Admin or assigned SSE
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'Admin';

  if (!isAdmin) {
    const { data: assignment } = await supabase
      .from('user_section_assignments')
      .select('id')
      .eq('user_id', user.id)
      .eq('sub_section', sectionCode)
      .limit(1)
      .single();

    if (!assignment) return { success: false, error: 'Not authorized for this section' };
  }

  // Upsert completion record
  // Use admin client to upsert in case the user is SSE (who might not have write access to this table)
  const admin = createAdminClient();
  const { error: upsertErr } = await admin
    .from('section_stage_completions')
    .upsert({
      coach_id: coachId,
      section_id: section.id,
      stage: currentStage,
      completed_by: user.id,
      completed_at: new Date().toISOString(),
      notes: notes ?? null,
    }, { onConflict: 'coach_id, section_id, stage', ignoreDuplicates: false });

  if (upsertErr) return { success: false, error: upsertErr.message };

  // Check if ALL non-placeholder sections have completed this stage
  const { data: allSections } = await supabase
    .from('workshop_sections')
    .select('id, section_code, section_type')
    .eq('is_active', true);

  if (!allSections || allSections.length === 0) return { success: true, data: { advanced: false } };

  // Only require non-placeholder sections (skip Painting)
  const requiredSections = allSections.filter(s => s.section_type !== 'placeholder');
  const requiredIds = requiredSections.map(s => s.id);

  const { data: completions } = await supabase
    .from('section_stage_completions')
    .select('section_id')
    .eq('coach_id', coachId)
    .eq('stage', currentStage)
    .in('section_id', requiredIds);

  const completedIds = new Set(completions?.map(c => c.section_id) ?? []);
  const allDone = requiredIds.every(id => completedIds.has(id));

  if (!allDone) return { success: true, data: { advanced: false } };

  // All sections done — auto-advance coach to next stage
  const stageIdx = POH_STAGE_ORDER.indexOf(currentStage);
  if (stageIdx === -1 || stageIdx >= POH_STAGE_ORDER.length - 1) {
    return { success: true, data: { advanced: false } };
  }

  const nextStage = POH_STAGE_ORDER[stageIdx + 1];
  const now = new Date().toISOString();

  // Calculate duration for current stage
  const { data: stageHistory } = await supabase
    .from('coach_stage_history')
    .select('start_date')
    .eq('coach_id', coachId)
    .eq('stage', currentStage)
    .is('completion_date', null)
    .single();

  const startDate = stageHistory?.start_date
    ? new Date(stageHistory.start_date)
    : new Date(coach.stage_start_date);

  const actualDays = Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const targetDays = TARGET_DURATIONS[currentStage];
  const timelineStatus = actualDays <= targetDays
    ? 'On Schedule'
    : actualDays <= targetDays + 2
      ? 'Minor Delay'
      : 'Significant Delay';

  // Complete current stage history
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

  // Create next stage history
  await supabase.from('coach_stage_history').insert({
    coach_id: coachId,
    stage: nextStage,
    start_date: now,
    target_duration_days: TARGET_DURATIONS[nextStage],
  });

  // Update coach record
  await supabase
    .from('coaches')
    .update({ current_stage: nextStage, stage_start_date: now })
    .eq('id', coachId);

  // Auto-generate job card when entering Dismantling
  if (nextStage === 'Dismantling') {
    try {
      const { data: coachInfo } = await supabase
        .from('coaches')
        .select('coach_type, rakes!inner(rake_type, poh_type)')
        .eq('id', coachId)
        .single();

      if (coachInfo) {
        const rakeData = coachInfo.rakes as unknown as { rake_type: string; poh_type: string };
        const coachType = (coachInfo as any).coach_type ?? 'MC';
        await admin.rpc('generate_job_card', {
          p_coach_id: coachId,
          p_rake_type: rakeData.rake_type,
          p_coach_type: coachType,
          p_poh_cycle: rakeData.poh_type,
        });
      }
    } catch {
      // Non-blocking
    }
  }

  return { success: true, data: { advanced: true, newStage: nextStage as POHStage } };
}

export async function getSectionStageCompletion(
  coachId: string,
  sectionCode: string,
  stage: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data: section } = await supabase
    .from('workshop_sections')
    .select('id')
    .eq('section_code', sectionCode)
    .single();
  if (!section) return false;

  const { data } = await supabase
    .from('section_stage_completions')
    .select('id')
    .eq('coach_id', coachId)
    .eq('section_id', section.id)
    .eq('stage', stage)
    .limit(1)
    .single();

  return !!data;
}
