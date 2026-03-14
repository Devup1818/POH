'use server';

import { createClient } from '@/lib/supabase/server';
import type { Result } from '@/types';

const VALID_COACH_TYPES = ['MC', 'TC', 'DTC', 'DMC', 'NDTC'] as const;
const VALID_RAKE_TYPES = ['EMU', 'MEMU', '3-Phase Rake', 'Conventional Rake', '3-Phase', 'Conventional'] as const;
const VALID_POH_CYCLES = ['1st POH', '2nd POH', '3rd POH', '4th POH'] as const;

export async function generateJobCardForCoach(
  coachId: string,
  rakeType: string,
  coachType: string,
  pohCycle: string
): Promise<Result<void>> {
  // Validate inputs
  if (!coachId) {
    return { success: false, error: 'Coach ID is required' };
  }

  if (!VALID_COACH_TYPES.includes(coachType as (typeof VALID_COACH_TYPES)[number])) {
    return { success: false, error: `Invalid coach type: ${coachType}. Must be one of ${VALID_COACH_TYPES.join(', ')}` };
  }

  if (!VALID_RAKE_TYPES.includes(rakeType as (typeof VALID_RAKE_TYPES)[number])) {
    return { success: false, error: `Invalid rake type: ${rakeType}. Must be one of ${VALID_RAKE_TYPES.join(', ')}` };
  }

  if (!VALID_POH_CYCLES.includes(pohCycle as (typeof VALID_POH_CYCLES)[number])) {
    return { success: false, error: `Invalid POH cycle: ${pohCycle}. Must be one of ${VALID_POH_CYCLES.join(', ')}` };
  }

  const supabase = await createClient();

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Call the generate_job_card PostgreSQL function via RPC
  const { error } = await supabase.rpc('generate_job_card', {
    p_coach_id: coachId,
    p_rake_type: rakeType,
    p_coach_type: coachType,
    p_poh_cycle: pohCycle,
  });

  if (error) {
    // Handle gracefully — the DB function uses ON CONFLICT DO NOTHING for idempotency
    // so duplicate generation won't cause errors at the DB level,
    // but other errors should be reported
    return { success: false, error: error.message };
  }

  return { success: true, data: undefined };
}
