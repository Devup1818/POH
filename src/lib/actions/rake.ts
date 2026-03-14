'use server';

import { createClient } from '@/lib/supabase/server';
import { rakeDetailsSchema, coachNumberSchema, coachTypeSchema, intakeDateSchema, editRakeSchema } from '@/lib/validations/rake';
import { z } from 'zod';
import type { Result } from '@/types';
import { TARGET_DURATIONS, POH_SECTIONS } from '@/lib/constants';
import { generateJobCardForCoach } from '@/lib/actions/job-card-generation';

const createRakeSchema = rakeDetailsSchema.extend({
  coachNumbers: z.array(coachNumberSchema),
  coachTypes: z.array(coachTypeSchema),
  intakeDate: intakeDateSchema,
});

export async function createRake(input: {
  rakeNumber: string;
  rakeType: string;
  rakeCategory: string;
  pohType: string;
  shedId: string;
  totalCoaches: number;
  coachNumbers: string[];
  coachTypes: string[];
  intakeDate: string;
}): Promise<Result<{ rakeId: string }>> {
  // Validate input
  const parsed = createRakeSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(', ');
    return { success: false, error: msg };
  }

  const { rakeNumber, rakeType, rakeCategory, pohType, shedId, totalCoaches, coachNumbers, coachTypes, intakeDate } =
    parsed.data;

  // Validate coach count matches
  if (coachNumbers.length !== totalCoaches) {
    return {
      success: false,
      error: `Expected ${totalCoaches} coach numbers, got ${coachNumbers.length}`,
    };
  }

  if (coachTypes.length !== totalCoaches) {
    return {
      success: false,
      error: `Expected ${totalCoaches} coach types, got ${coachTypes.length}`,
    };
  }

  // Validate uniqueness
  if (new Set(coachNumbers).size !== coachNumbers.length) {
    return { success: false, error: 'Coach numbers must be unique within the rake' };
  }

  const supabase = await createClient();

  // Check for duplicate active rake at same shed
  const { data: existing } = await supabase
    .from('rakes')
    .select('id')
    .eq('rake_number', rakeNumber)
    .eq('shed_id', shedId)
    .eq('status', 'Active')
    .maybeSingle();

  if (existing) {
    return {
      success: false,
      error: `An active rake with number "${rakeNumber}" already exists at this shed`,
    };
  }

  // Insert rake
  // Before migration 010: rake_type only accepts EMU/MEMU, no rake_category column
  // After migration 010: rake_type accepts new values, rake_category column exists
  // We try the full payload first, fall back to legacy if it fails
  const insertPayload: Record<string, unknown> = {
    rake_number: rakeNumber,
    rake_type: rakeType,
    poh_type: pohType,
    shed_id: shedId,
    total_coaches: totalCoaches,
    status: 'Active',
    intake_date: intakeDate,
  };

  // Add rake_category if available (only works after migration 010)
  if (rakeCategory) {
    insertPayload.rake_category = rakeCategory;
  }

  let rakeResult = await supabase
    .from('rakes')
    .insert(insertPayload)
    .select('id')
    .single();

  // If insert fails (likely CHECK constraint on rake_type pre-migration), fall back to legacy
  if (rakeResult.error) {
    const legacyPayload: Record<string, unknown> = {
      rake_number: rakeNumber,
      rake_type: rakeCategory || rakeType,
      poh_type: pohType,
      shed_id: shedId,
      total_coaches: totalCoaches,
      status: 'Active',
      intake_date: intakeDate,
    };
    rakeResult = await supabase
      .from('rakes')
      .insert(legacyPayload)
      .select('id')
      .single();
  }

  const { data: rake, error: rakeError } = rakeResult;

  if (rakeError || !rake) {
    return {
      success: false,
      error: rakeError?.message ?? 'Failed to create rake record',
    };
  }

  // Insert coaches (include coach_type if migration 010 has been applied)
  const coachRows = coachNumbers.map((num, i) => {
    const row: Record<string, unknown> = {
      rake_id: rake.id,
      coach_number: num,
      current_stage: 'Intake' as const,
      stage_start_date: new Date().toISOString(),
    };
    if (coachTypes[i]) {
      row.coach_type = coachTypes[i];
    }
    return row;
  });

  let coachResult = await supabase
    .from('coaches')
    .insert(coachRows);

  // If insert fails (likely coach_type column doesn't exist), retry without coach_type
  if (coachResult.error) {
    const legacyCoachRows = coachNumbers.map((num) => ({
      rake_id: rake.id,
      coach_number: num,
      current_stage: 'Intake' as const,
      stage_start_date: new Date().toISOString(),
    }));
    coachResult = await supabase
      .from('coaches')
      .insert(legacyCoachRows);
  }

  const { error: coachError } = coachResult;

  if (coachError) {
    // Attempt cleanup
    await supabase.from('rakes').delete().eq('id', rake.id);
    return {
      success: false,
      error: coachError.message ?? 'Failed to create coach records',
    };
  }

  // Create initial stage history entries and coach_section_status rows
  const { data: coaches } = await supabase
    .from('coaches')
    .select('id, coach_type')
    .eq('rake_id', rake.id);

  if (coaches && coaches.length > 0) {
    // Get target duration for Intake from shed config or defaults
    const intakeTarget = TARGET_DURATIONS.Intake;

    const stageHistoryRows = coaches.map((c) => ({
      coach_id: c.id,
      stage: 'Intake' as const,
      start_date: new Date().toISOString(),
      target_duration_days: intakeTarget,
    }));

    await supabase.from('coach_stage_history').insert(stageHistoryRows);

    // Insert 10 coach_section_status rows per coach (one for each POH section)
    // This table only exists after migration 010 — skip gracefully if not available
    try {
      const sectionStatusRows = coaches.flatMap((c) =>
        POH_SECTIONS.map((section) => ({
          coach_id: c.id,
          section_name: section,
          status: 'Not Started' as const,
        }))
      );

      await supabase
        .from('coach_section_status')
        .insert(sectionStatusRows);
    } catch {
      // Table doesn't exist yet — skip
    }

    // Generate job cards for each coach (section-wise work items, must change items, tests)
    // Errors here should not block rake registration
    for (const coach of coaches) {
      try {
        const ct = coach.coach_type || coachTypes[coaches.indexOf(coach)] || '';
        if (ct) {
          const jobCardResult = await generateJobCardForCoach(
            coach.id,
            rakeType,
            ct,
            pohType
          );
          if (!jobCardResult.success) {
            console.error(
              `Job card generation failed for coach ${coach.id}: ${jobCardResult.error}`
            );
          }
        }
      } catch (jobCardErr) {
        console.error(`Job card generation error for coach ${coach.id}:`, jobCardErr);
      }
    }
  }

  return { success: true, data: { rakeId: rake.id } };
}

/**
 * Helper: verify the caller is an authenticated Admin user.
 * Returns the admin's user ID on success, or a Result error.
 */
async function verifyAdmin(): Promise<
  { ok: true; adminId: string } | { ok: false; result: Result<never> }
> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return { ok: false, result: { success: false, error: 'Unauthorized' } };
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .single();

  if (profileError || !profile || profile.role !== 'Admin') {
    return { ok: false, result: { success: false, error: 'Unauthorized' } };
  }

  return { ok: true, adminId: authUser.id };
}

/**
 * Deletes a rake and all associated data (cascade).
 * Restricted to Admin users. Writes an audit log entry.
 */
export async function deleteRake(rakeId: string): Promise<Result<void>> {
  try {
    const auth = await verifyAdmin();
    if (!auth.ok) return auth.result;

    const supabase = await createClient();

    // Fetch the rake to verify it exists and capture snapshot for audit
    const { data: rake, error: fetchError } = await supabase
      .from('rakes')
      .select('*')
      .eq('id', rakeId)
      .maybeSingle();

    if (fetchError) {
      console.error('Failed to fetch rake for deletion:', fetchError.message);
      return { success: false, error: fetchError.message };
    }

    if (!rake) {
      return { success: false, error: 'Rake not found' };
    }

    // Delete the rake row — DB CASCADE handles child records
    const { error: deleteError } = await supabase
      .from('rakes')
      .delete()
      .eq('id', rakeId);

    if (deleteError) {
      console.error('Failed to delete rake:', deleteError.message);
      return { success: false, error: deleteError.message };
    }

    // Audit log (non-blocking)
    try {
      await supabase.from('audit_logs').insert({
        user_id: auth.adminId,
        action: 'DELETE',
        entity_type: 'rake',
        entity_id: rakeId,
        old_values: rake,
        new_values: null,
      });
    } catch (auditErr) {
      console.error('Audit log insert failed:', auditErr);
    }

    return { success: true, data: undefined };
  } catch (err) {
    console.error('Unexpected error in deleteRake:', err);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Edits rake metadata (rake number, category, type, POH type, shed, total coaches, intake date).
 * Restricted to Admin users. Only updates the rake row — does not modify coach records.
 * Writes an audit log entry with old and new values.
 */
export async function editRake(input: {
  rakeId: string;
  rakeNumber: string;
  rakeCategory: string;
  rakeType: string;
  pohType: string;
  shedId: string;
  totalCoaches: number;
  intakeDate: string;
}): Promise<Result<void>> {
  try {
    const auth = await verifyAdmin();
    if (!auth.ok) return auth.result;

    // Validate input
    const parsed = editRakeSchema.safeParse(input);
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join(', ');
      return { success: false, error: msg };
    }

    const { rakeId, rakeNumber, rakeCategory, rakeType, pohType, shedId, totalCoaches, intakeDate } = parsed.data;

    const supabase = await createClient();

    // Fetch existing rake to verify it exists and capture old values
    const { data: existingRake, error: fetchError } = await supabase
      .from('rakes')
      .select('*')
      .eq('id', rakeId)
      .maybeSingle();

    if (fetchError) {
      console.error('Failed to fetch rake for edit:', fetchError.message);
      return { success: false, error: fetchError.message };
    }

    if (!existingRake) {
      return { success: false, error: 'Rake not found' };
    }

    // Check for duplicate rake number at same shed (exclude current rake, only active/non-completed)
    const { data: duplicate } = await supabase
      .from('rakes')
      .select('id')
      .eq('rake_number', rakeNumber)
      .eq('shed_id', shedId)
      .neq('id', rakeId)
      .in('status', ['Active'])
      .maybeSingle();

    if (duplicate) {
      return {
        success: false,
        error: `An active rake with number "${rakeNumber}" already exists at this shed`,
      };
    }

    // Update the rake record
    // Try with new schema first (rake_category + full rake_type), fall back to legacy
    const updatePayload: Record<string, unknown> = {
      rake_number: rakeNumber,
      rake_type: rakeType,
      poh_type: pohType,
      shed_id: shedId,
      total_coaches: totalCoaches,
      intake_date: intakeDate,
    };

    if (rakeCategory) {
      updatePayload.rake_category = rakeCategory;
    }

    let updateResult = await supabase
      .from('rakes')
      .update(updatePayload)
      .eq('id', rakeId);

    // If update fails (pre-migration), fall back to legacy payload
    if (updateResult.error) {
      const legacyPayload: Record<string, unknown> = {
        rake_number: rakeNumber,
        rake_type: rakeCategory || rakeType,
        poh_type: pohType,
        shed_id: shedId,
        total_coaches: totalCoaches,
        intake_date: intakeDate,
      };
      updateResult = await supabase
        .from('rakes')
        .update(legacyPayload)
        .eq('id', rakeId);
    }

    const { error: updateError } = updateResult;

    if (updateError) {
      console.error('Failed to update rake:', updateError.message);
      return { success: false, error: updateError.message };
    }

    // Audit log (non-blocking)
    try {
      await supabase.from('audit_logs').insert({
        user_id: auth.adminId,
        action: 'UPDATE',
        entity_type: 'rake',
        entity_id: rakeId,
        old_values: existingRake,
        new_values: {
          rake_number: rakeNumber,
          rake_category: rakeCategory,
          rake_type: rakeType,
          poh_type: pohType,
          shed_id: shedId,
          total_coaches: totalCoaches,
          intake_date: intakeDate,
        },
      });
    } catch (auditErr) {
      console.error('Audit log insert failed:', auditErr);
    }

    return { success: true, data: undefined };
  } catch (err) {
    console.error('Unexpected error in editRake:', err);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}


