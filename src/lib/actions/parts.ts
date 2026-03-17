'use server';

import { createClient } from '@/lib/supabase/server';
import type { PartStatus, POHStage, Result } from '@/types';
import { PART_STATUS_ORDER, PART_STATUS_TO_COMPLETED_STAGE, POH_STAGE_ORDER, TARGET_DURATIONS } from '@/lib/constants';

/* ── Types ───────────────────────────────────────────────── */

export interface MissingPartEntry {
  partId: string;
  partName: string;
  status: string;
  notes: string | null;
  expectedArrivalDate: string | null;
  statusUpdatedAt: string;
  coachId: string;
  coachNumber: string;
  rakeId: string;
  rakeNumber: string;
  rakeType: string;
  pohType: string;
}

export interface MissingPartsFilters {
  partName?: string;
  sortBy?: 'expected_arrival_date' | 'status_updated_at' | 'part_name';
  sortOrder?: 'asc' | 'desc';
}

/* ── updatePartStatus ────────────────────────────────────── */

/**
 * Update a coach part's status.
 * When marking as Missing/Pending, notes and expectedArrivalDate are required.
 */
export async function updatePartStatus(
  partId: string,
  status: PartStatus,
  notes?: string,
  expectedArrivalDate?: string,
): Promise<Result<void>> {
  if (status === 'Missing/Pending') {
    if (!notes || notes.trim().length === 0) {
      return { success: false, error: 'Notes are required when marking a part as Missing/Pending' };
    }
    if (!expectedArrivalDate) {
      return { success: false, error: 'Expected arrival date is required when marking a part as Missing/Pending' };
    }
    if (new Date(expectedArrivalDate) <= new Date()) {
      return { success: false, error: 'Expected arrival date must be in the future' };
    }
  }

  const supabase = await createClient();

  // Fetch current status for sequential validation
  const { data: currentPart, error: fetchErr } = await supabase
    .from('coach_parts')
    .select('status')
    .eq('id', partId)
    .single();

  if (fetchErr || !currentPart) {
    return { success: false, error: 'Part not found' };
  }

  const currentStatus = currentPart.status as PartStatus;

  // Allow returning from Missing/Pending to Not Started
  if (currentStatus === 'Missing/Pending' && status === 'Not Started') {
    // valid — re-entering the flow
  } else if (status !== 'Missing/Pending') {
    // Validate sequential progression
    const currentIdx = PART_STATUS_ORDER.indexOf(currentStatus);
    const newIdx = PART_STATUS_ORDER.indexOf(status);

    if (currentStatus === 'Missing/Pending') {
      return { success: false, error: 'Part is Missing/Pending. Set it back to Not Started first.' };
    }

    if (newIdx !== currentIdx + 1 && newIdx !== currentIdx) {
      return { success: false, error: `Cannot skip stages. Current: ${currentStatus}, next valid: ${PART_STATUS_ORDER[currentIdx + 1] ?? 'none'}` };
    }
  }

  const { error } = await supabase
    .from('coach_parts')
    .update({
      status,
      notes: notes ?? null,
      expected_arrival_date: status === 'Missing/Pending' ? expectedArrivalDate : null,
      status_updated_at: new Date().toISOString(),
    })
    .eq('id', partId);

  if (error) return { success: false, error: error.message };

  return { success: true, data: undefined };
}

/* ── autoAdvanceCoachStage ────────────────────────────────── */

/**
 * After a part status update, check if all parts for the coach have reached
 * a threshold that completes stages beyond the current one. If so, advance
 * the coach through each intermediate stage, creating proper history entries.
 */
async function autoAdvanceCoachStage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  partId: string,
) {
  try {
    // Get the coach for this part
    const { data: part } = await supabase
      .from('coach_parts')
      .select('coach_id')
      .eq('id', partId)
      .single();
    if (!part) return;

    const coachId = part.coach_id;

    // Get all parts for this coach
    const { data: allParts } = await supabase
      .from('coach_parts')
      .select('status')
      .eq('coach_id', coachId);
    if (!allParts || allParts.length === 0) return;

    // Compute which stages are completed based on all parts
    const statuses = allParts.map((p) => p.status as PartStatus);
    const completedStages: POHStage[] = [];
    for (const [statusThreshold, stage] of Object.entries(PART_STATUS_TO_COMPLETED_STAGE) as [PartStatus, POHStage][]) {
      const thresholdIdx = PART_STATUS_ORDER.indexOf(statusThreshold);
      const allAtOrBeyond = statuses.every((s) => {
        if (s === 'Missing/Pending') return false;
        return PART_STATUS_ORDER.indexOf(s) >= thresholdIdx;
      });
      if (allAtOrBeyond) completedStages.push(stage);
    }

    if (completedStages.length === 0) return;

    // Find the highest completed stage
    let highestCompletedIdx = -1;
    for (const stage of completedStages) {
      const idx = POH_STAGE_ORDER.indexOf(stage);
      if (idx > highestCompletedIdx) highestCompletedIdx = idx;
    }

    // Get current coach stage
    const { data: coach } = await supabase
      .from('coaches')
      .select('current_stage, stage_start_date')
      .eq('id', coachId)
      .single();
    if (!coach) return;

    const currentStageIdx = POH_STAGE_ORDER.indexOf(coach.current_stage as POHStage);

    // The coach should be at the stage AFTER the highest completed stage
    const targetStageIdx = Math.min(highestCompletedIdx + 1, POH_STAGE_ORDER.length - 1);

    if (targetStageIdx <= currentStageIdx) return; // Already at or beyond target

    // Advance through each intermediate stage
    const now = new Date().toISOString();
    let stageStartDate = coach.stage_start_date;

    for (let i = currentStageIdx; i < targetStageIdx; i++) {
      const fromStage = POH_STAGE_ORDER[i];
      const toStage = POH_STAGE_ORDER[i + 1];

      // Calculate actual duration for the stage being completed
      const startDate = new Date(stageStartDate);
      const actualDays = Math.max(1, Math.ceil((Date.now() - startDate.getTime()) / 86_400_000));
      const targetDays = TARGET_DURATIONS[fromStage];

      let timelineStatus: string;
      if (actualDays < targetDays) timelineStatus = 'Ahead of Schedule';
      else if (actualDays <= targetDays) timelineStatus = 'On Schedule';
      else if (actualDays <= targetDays + 2) timelineStatus = 'Minor Delay';
      else timelineStatus = 'Significant Delay';

      // Complete current stage history entry
      await supabase
        .from('coach_stage_history')
        .update({
          completion_date: now,
          actual_duration_days: actualDays,
          timeline_status: timelineStatus,
        })
        .eq('coach_id', coachId)
        .eq('stage', fromStage)
        .is('completion_date', null);

      // Create new stage history entry for next stage
      await supabase.from('coach_stage_history').insert({
        coach_id: coachId,
        stage: toStage,
        start_date: now,
        target_duration_days: TARGET_DURATIONS[toStage],
      });

      stageStartDate = now;
    }

    // Update coach record to the target stage
    await supabase
      .from('coaches')
      .update({
        current_stage: POH_STAGE_ORDER[targetStageIdx],
        stage_start_date: now,
      })
      .eq('id', coachId);
  } catch {
    // Auto-advance failures should not break the part update
  }
}

/* ── getMissingPartsReport ───────────────────────────────── */

/**
 * Query all Missing/Pending parts across coaches at a given shed.
 * Returns coach numbers, rake info, notes, and expected arrival dates.
 */
export async function getMissingPartsReport(
  shedId: string,
  filters?: MissingPartsFilters,
): Promise<Result<MissingPartEntry[]>> {
  const supabase = await createClient();

  // Build query: join coach_parts → coaches → rakes (→ filter by shed)
  let query = supabase
    .from('coach_parts')
    .select(`
      id, part_name, status, notes, expected_arrival_date, status_updated_at,
      coaches!inner (
        id, coach_number, rake_id,
        rakes!inner (
          id, rake_number, rake_type, poh_type, shed_id, status
        )
      )
    `)
    .eq('status', 'Missing/Pending')
    .eq('coaches.rakes.status', 'Active');

  // Filter by shed if not "all"
  if (shedId && shedId !== 'all') {
    query = query.eq('coaches.rakes.shed_id', shedId);
  }

  // Filter by part name
  if (filters?.partName) {
    query = query.eq('part_name', filters.partName);
  }

  // Sort
  const sortBy = filters?.sortBy ?? 'expected_arrival_date';
  const sortOrder = filters?.sortOrder ?? 'asc';
  const ascending = sortOrder === 'asc';

  if (sortBy === 'expected_arrival_date') {
    query = query.order('expected_arrival_date', { ascending, nullsFirst: false });
  } else if (sortBy === 'status_updated_at') {
    query = query.order('status_updated_at', { ascending });
  } else {
    query = query.order('part_name', { ascending });
  }

  const { data, error } = await query;

  if (error) {
    return { success: false, error: error.message };
  }

  const entries: MissingPartEntry[] = (data ?? []).map((row) => {
    const coach = row.coaches as unknown as {
      id: string;
      coach_number: string;
      rake_id: string;
      rakes: {
        id: string;
        rake_number: string;
        rake_type: string;
        poh_type: string;
        shed_id: string;
      };
    };

    return {
      partId: row.id,
      partName: row.part_name,
      status: row.status,
      notes: row.notes,
      expectedArrivalDate: row.expected_arrival_date,
      statusUpdatedAt: row.status_updated_at,
      coachId: coach.id,
      coachNumber: coach.coach_number,
      rakeId: coach.rakes.id,
      rakeNumber: coach.rakes.rake_number,
      rakeType: coach.rakes.rake_type,
      pohType: coach.rakes.poh_type,
    };
  });

  return { success: true, data: entries };
}
