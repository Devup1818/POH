'use server';

import { createClient } from '@/lib/supabase/server';
import type { POHStage, PartStatus, NoteType, ChecklistStatus, Result } from '@/types';
import { POH_STAGE_ORDER, TARGET_DURATIONS } from '@/lib/constants';

/* ── Shared Types ────────────────────────────────────────── */

export interface BulkResultItem {
  coachId: string;
  coachNumber: string;
  reason: string;
}

export interface BulkResult {
  successful: string[];
  failed: BulkResultItem[];
}

export interface BulkPreviousState {
  operationType: string;
  timestamp: string;
  coachStates: Record<string, unknown>[];
}

/* ── Helpers ─────────────────────────────────────────────── */

function nextStage(current: POHStage): POHStage | null {
  const idx = POH_STAGE_ORDER.indexOf(current);
  if (idx === -1 || idx >= POH_STAGE_ORDER.length - 1) return null;
  return POH_STAGE_ORDER[idx + 1];
}

/* ── bulkAdvanceStage ────────────────────────────────────── */

/**
 * Advance multiple coaches to the next POH stage.
 * Validates each coach independently: mandatory checklist items, testing completion.
 * Records individual timestamps per coach.
 * Returns previous state for undo capability.
 */
export async function bulkAdvanceStage(
  coachIds: string[],
): Promise<Result<BulkResult & { previousState: BulkPreviousState }>> {
  if (!coachIds.length) {
    return { success: false, error: 'No coaches selected' };
  }

  const supabase = await createClient();
  const successful: string[] = [];
  const failed: BulkResultItem[] = [];
  const previousStates: Record<string, unknown>[] = [];

  // Fetch all coaches in one query
  const { data: coaches, error: fetchErr } = await supabase
    .from('coaches')
    .select('id, coach_number, current_stage, stage_start_date, rake_id')
    .in('id', coachIds);

  if (fetchErr || !coaches) {
    return { success: false, error: fetchErr?.message ?? 'Failed to fetch coaches' };
  }

  const coachMap = new Map(coaches.map((c) => [c.id, c]));

  for (const coachId of coachIds) {
    const coach = coachMap.get(coachId);
    if (!coach) {
      failed.push({ coachId, coachNumber: 'Unknown', reason: 'Coach not found' });
      continue;
    }

    const currentStage = coach.current_stage as POHStage;
    const next = nextStage(currentStage);

    if (!next) {
      failed.push({ coachId, coachNumber: coach.coach_number, reason: 'Already at final stage (Release)' });
      continue;
    }

    // Validate testing completion if leaving Testing stage
    if (currentStage === 'Testing') {
      const { data: tests } = await supabase
        .from('coach_tests')
        .select('test_type, status')
        .eq('coach_id', coachId);

      const allComplete = (tests ?? []).length === 3 && (tests ?? []).every((t) => t.status === 'Completed');
      if (!allComplete) {
        failed.push({
          coachId,
          coachNumber: coach.coach_number,
          reason: 'All 3 tests must be completed before advancing from Testing',
        });
        continue;
      }
    }

    // Validate mandatory checklist items
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
        failed.push({
          coachId,
          coachNumber: coach.coach_number,
          reason: `${incompleteMandatory.length} mandatory checklist item(s) incomplete`,
        });
        continue;
      }
    }

    // Store previous state for undo
    previousStates.push({
      coachId,
      coachNumber: coach.coach_number,
      previousStage: currentStage,
      stageStartDate: coach.stage_start_date,
    });

    // Individual timestamp for this coach
    const now = new Date().toISOString();
    const startDate = new Date(coach.stage_start_date);
    const actualDays = Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const targetDays = TARGET_DURATIONS[currentStage];

    let timelineStatus: string;
    if (actualDays < targetDays) timelineStatus = 'Ahead of Schedule';
    else if (actualDays <= targetDays) timelineStatus = 'On Schedule';
    else if (actualDays <= targetDays + 2) timelineStatus = 'Minor Delay';
    else timelineStatus = 'Significant Delay';

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

    // Create new stage history entry
    await supabase.from('coach_stage_history').insert({
      coach_id: coachId,
      stage: next,
      start_date: now,
      target_duration_days: TARGET_DURATIONS[next],
    });

    // Update coach record
    const { error: updateErr } = await supabase
      .from('coaches')
      .update({ current_stage: next, stage_start_date: now })
      .eq('id', coachId);

    if (updateErr) {
      failed.push({ coachId, coachNumber: coach.coach_number, reason: updateErr.message });
    } else {
      successful.push(coachId);
    }
  }

  return {
    success: true,
    data: {
      successful,
      failed,
      previousState: {
        operationType: 'advance-stage',
        timestamp: new Date().toISOString(),
        coachStates: previousStates,
      },
    },
  };
}


/* ── bulkUpdatePartStatus ────────────────────────────────── */

/**
 * Update a specified part for all selected coaches.
 * Validates Missing/Pending requirements (notes + expected date).
 * Records individual timestamps per coach.
 */
export async function bulkUpdatePartStatus(
  coachIds: string[],
  partName: string,
  status: PartStatus,
  notes?: string,
  expectedArrivalDate?: string,
): Promise<Result<BulkResult & { previousState: BulkPreviousState }>> {
  if (!coachIds.length) {
    return { success: false, error: 'No coaches selected' };
  }

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
  const successful: string[] = [];
  const failed: BulkResultItem[] = [];
  const previousStates: Record<string, unknown>[] = [];

  // Fetch all parts for these coaches in one query
  const { data: parts, error: fetchErr } = await supabase
    .from('coach_parts')
    .select('id, coach_id, part_name, status, notes, expected_arrival_date, status_updated_at')
    .in('coach_id', coachIds)
    .eq('part_name', partName);

  if (fetchErr) {
    return { success: false, error: fetchErr.message };
  }

  // Get coach numbers for error reporting
  const { data: coaches } = await supabase
    .from('coaches')
    .select('id, coach_number')
    .in('id', coachIds);

  const coachNumberMap = new Map((coaches ?? []).map((c) => [c.id, c.coach_number]));
  const partMap = new Map((parts ?? []).map((p) => [p.coach_id, p]));

  for (const coachId of coachIds) {
    const part = partMap.get(coachId);
    const coachNumber = coachNumberMap.get(coachId) ?? 'Unknown';

    if (!part) {
      failed.push({ coachId, coachNumber, reason: `Part "${partName}" not found for this coach` });
      continue;
    }

    // Store previous state for undo
    previousStates.push({
      coachId,
      coachNumber,
      partId: part.id,
      previousStatus: part.status,
      previousNotes: part.notes,
      previousExpectedDate: part.expected_arrival_date,
    });

    const now = new Date().toISOString();
    const { error: updateErr } = await supabase
      .from('coach_parts')
      .update({
        status,
        notes: notes ?? null,
        expected_arrival_date: status === 'Missing/Pending' ? expectedArrivalDate : null,
        status_updated_at: now,
      })
      .eq('id', part.id);

    if (updateErr) {
      failed.push({ coachId, coachNumber, reason: updateErr.message });
    } else {
      successful.push(coachId);
    }
  }

  return {
    success: true,
    data: {
      successful,
      failed,
      previousState: {
        operationType: 'update-part-status',
        timestamp: new Date().toISOString(),
        coachStates: previousStates,
      },
    },
  };
}

/* ── bulkAddNote ─────────────────────────────────────────── */

/**
 * Add the same note to all selected coaches with individual timestamps.
 */
export async function bulkAddNote(
  coachIds: string[],
  content: string,
  noteType: NoteType,
): Promise<Result<BulkResult & { previousState: BulkPreviousState }>> {
  if (!coachIds.length) {
    return { success: false, error: 'No coaches selected' };
  }
  if (!content.trim()) {
    return { success: false, error: 'Note content cannot be empty' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const successful: string[] = [];
  const failed: BulkResultItem[] = [];
  const createdNoteIds: Record<string, unknown>[] = [];

  // Get coach numbers for error reporting
  const { data: coaches } = await supabase
    .from('coaches')
    .select('id, coach_number')
    .in('id', coachIds);

  const coachNumberMap = new Map((coaches ?? []).map((c) => [c.id, c.coach_number]));

  for (const coachId of coachIds) {
    const coachNumber = coachNumberMap.get(coachId) ?? 'Unknown';

    const { data: noteData, error: insertErr } = await supabase
      .from('notes')
      .insert({
        coach_id: coachId,
        created_by: user.id,
        note_type: noteType,
        content: content.trim(),
        is_important: false,
      })
      .select('id')
      .single();

    if (insertErr) {
      failed.push({ coachId, coachNumber, reason: insertErr.message });
    } else {
      successful.push(coachId);
      createdNoteIds.push({ coachId, coachNumber, noteId: noteData.id });
    }
  }

  return {
    success: true,
    data: {
      successful,
      failed,
      previousState: {
        operationType: 'add-note',
        timestamp: new Date().toISOString(),
        coachStates: createdNoteIds,
      },
    },
  };
}

/* ── bulkUpdateChecklistItem ─────────────────────────────── */

/**
 * Update a checklist item for all selected coaches.
 * Uses template_id to find the matching coach_checklist_item per coach.
 */
export async function bulkUpdateChecklistItem(
  coachIds: string[],
  templateId: string,
  status: ChecklistStatus,
): Promise<Result<BulkResult & { previousState: BulkPreviousState }>> {
  if (!coachIds.length) {
    return { success: false, error: 'No coaches selected' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const successful: string[] = [];
  const failed: BulkResultItem[] = [];
  const previousStates: Record<string, unknown>[] = [];

  // Fetch all matching checklist items in one query
  const { data: items, error: fetchErr } = await supabase
    .from('coach_checklist_items')
    .select('id, coach_id, status, completion_date, completed_by')
    .in('coach_id', coachIds)
    .eq('template_id', templateId);

  if (fetchErr) {
    return { success: false, error: fetchErr.message };
  }

  // Get coach numbers
  const { data: coaches } = await supabase
    .from('coaches')
    .select('id, coach_number')
    .in('id', coachIds);

  const coachNumberMap = new Map((coaches ?? []).map((c) => [c.id, c.coach_number]));
  const itemMap = new Map((items ?? []).map((i) => [i.coach_id, i]));

  for (const coachId of coachIds) {
    const item = itemMap.get(coachId);
    const coachNumber = coachNumberMap.get(coachId) ?? 'Unknown';

    if (!item) {
      failed.push({ coachId, coachNumber, reason: 'Checklist item not found for this coach' });
      continue;
    }

    // Store previous state for undo
    previousStates.push({
      coachId,
      coachNumber,
      itemId: item.id,
      previousStatus: item.status,
      previousCompletionDate: item.completion_date,
      previousCompletedBy: item.completed_by,
    });

    const update: Record<string, unknown> = { status };
    if (status === 'Completed') {
      update.completion_date = new Date().toISOString();
      update.completed_by = user?.id ?? null;
    } else {
      update.completion_date = null;
      update.completed_by = null;
    }

    const { error: updateErr } = await supabase
      .from('coach_checklist_items')
      .update(update)
      .eq('id', item.id);

    if (updateErr) {
      failed.push({ coachId, coachNumber, reason: updateErr.message });
    } else {
      successful.push(coachId);
    }
  }

  return {
    success: true,
    data: {
      successful,
      failed,
      previousState: {
        operationType: 'update-checklist-item',
        timestamp: new Date().toISOString(),
        coachStates: previousStates,
      },
    },
  };
}

/* ── undoBulkOperation ───────────────────────────────────── */

/**
 * Undo a bulk operation by restoring previous state.
 * Supports: advance-stage, update-part-status, add-note, update-checklist-item.
 */
export async function undoBulkOperation(
  previousState: BulkPreviousState,
): Promise<Result<{ restoredCount: number }>> {
  const supabase = await createClient();
  let restoredCount = 0;

  switch (previousState.operationType) {
    case 'advance-stage': {
      for (const state of previousState.coachStates) {
        const s = state as { coachId: string; previousStage: string; stageStartDate: string };
        // Delete the new stage history entry and restore the old one
        const next = nextStage(s.previousStage as POHStage);
        if (next) {
          await supabase
            .from('coach_stage_history')
            .delete()
            .eq('coach_id', s.coachId)
            .eq('stage', next)
            .gte('start_date', previousState.timestamp);

          // Restore completion_date to null on previous stage history
          await supabase
            .from('coach_stage_history')
            .update({ completion_date: null, actual_duration_days: null, timeline_status: null })
            .eq('coach_id', s.coachId)
            .eq('stage', s.previousStage);
        }

        // Restore coach record
        await supabase
          .from('coaches')
          .update({ current_stage: s.previousStage, stage_start_date: s.stageStartDate })
          .eq('id', s.coachId);

        restoredCount++;
      }
      break;
    }

    case 'update-part-status': {
      for (const state of previousState.coachStates) {
        const s = state as {
          partId: string;
          previousStatus: string;
          previousNotes: string | null;
          previousExpectedDate: string | null;
        };
        await supabase
          .from('coach_parts')
          .update({
            status: s.previousStatus,
            notes: s.previousNotes,
            expected_arrival_date: s.previousExpectedDate,
            status_updated_at: new Date().toISOString(),
          })
          .eq('id', s.partId);
        restoredCount++;
      }
      break;
    }

    case 'add-note': {
      for (const state of previousState.coachStates) {
        const s = state as { noteId: string };
        await supabase.from('notes').delete().eq('id', s.noteId);
        restoredCount++;
      }
      break;
    }

    case 'update-checklist-item': {
      for (const state of previousState.coachStates) {
        const s = state as {
          itemId: string;
          previousStatus: string;
          previousCompletionDate: string | null;
          previousCompletedBy: string | null;
        };
        await supabase
          .from('coach_checklist_items')
          .update({
            status: s.previousStatus,
            completion_date: s.previousCompletionDate,
            completed_by: s.previousCompletedBy,
          })
          .eq('id', s.itemId);
        restoredCount++;
      }
      break;
    }

    default:
      return { success: false, error: `Unknown operation type: ${previousState.operationType}` };
  }

  return { success: true, data: { restoredCount } };
}
