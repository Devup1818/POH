'use server';

import { createClient } from '@/lib/supabase/server';
import type { PartStatus, Result } from '@/types';

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
