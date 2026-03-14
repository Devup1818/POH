'use server';

import { createClient } from '@/lib/supabase/server';
import type { Result } from '@/types';
import { POH_STAGE_ORDER, TARGET_DURATIONS } from '@/lib/constants';

/* ── Types ───────────────────────────────────────────────── */

export interface CompletedRakeRow {
  id: string;
  rakeNumber: string;
  rakeType: string;
  pohType: string;
  shedId: string;
  shedName: string;
  totalCoaches: number;
  intakeDate: string;
  completionDate: string;
  totalDurationDays: number;
}

export interface CompletedRakeFilters {
  dateFrom?: string;
  dateTo?: string;
  rakeType?: string;
  pohType?: string;
  shedId?: string;
  search?: string;
}

export interface CompletedRakeDetail extends CompletedRakeRow {
  coaches: {
    id: string;
    coachNumber: string;
    stageHistory: {
      stage: string;
      startDate: string;
      completionDate: string | null;
      targetDurationDays: number;
      actualDurationDays: number | null;
      timelineStatus: string | null;
    }[];
  }[];
}

/* ── completeRake ────────────────────────────────────────── */

export async function completeRake(rakeId: string): Promise<Result<{ completionDate: string; totalDurationDays: number }>> {
  const supabase = await createClient();

  // 1. Fetch the rake
  const { data: rake, error: rakeErr } = await supabase
    .from('rakes')
    .select('id, status, intake_date')
    .eq('id', rakeId)
    .single();

  if (rakeErr || !rake) {
    return { success: false, error: 'Rake not found' };
  }

  if (rake.status === 'Completed') {
    return { success: false, error: 'Rake is already completed' };
  }

  // 2. Verify all coaches are at Release stage
  const { data: coaches, error: coachErr } = await supabase
    .from('coaches')
    .select('id, current_stage')
    .eq('rake_id', rakeId);

  if (coachErr || !coaches || coaches.length === 0) {
    return { success: false, error: 'No coaches found for this rake' };
  }

  const notAtRelease = coaches.filter((c) => c.current_stage !== 'Release');
  if (notAtRelease.length > 0) {
    return {
      success: false,
      error: `Cannot complete rake: ${notAtRelease.length} coach(es) not at Release stage`,
    };
  }

  // 3. Record completion
  const completionDate = new Date().toISOString();
  const intakeDate = new Date(rake.intake_date);
  const totalDurationDays = Math.ceil(
    (new Date(completionDate).getTime() - intakeDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  const { error: updateErr } = await supabase
    .from('rakes')
    .update({
      status: 'Completed',
      completion_date: completionDate,
    })
    .eq('id', rakeId);

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  return {
    success: true,
    data: { completionDate, totalDurationDays },
  };
}


/* ── getCompletedRakes ───────────────────────────────────── */

export async function getCompletedRakes(
  shedId: string,
  filters?: CompletedRakeFilters,
): Promise<CompletedRakeRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from('rakes')
    .select(`
      id,
      rake_number,
      rake_type,
      poh_type,
      shed_id,
      total_coaches,
      intake_date,
      completion_date,
      sheds!inner ( name )
    `)
    .eq('status', 'Completed')
    .order('completion_date', { ascending: false });

  // Shed filter
  if (shedId && shedId !== 'all') {
    query = query.eq('shed_id', shedId);
  }

  // Additional filters
  if (filters?.shedId && filters.shedId !== 'all') {
    query = query.eq('shed_id', filters.shedId);
  }
  if (filters?.rakeType) {
    query = query.eq('rake_type', filters.rakeType);
  }
  if (filters?.pohType) {
    query = query.eq('poh_type', filters.pohType);
  }
  if (filters?.dateFrom) {
    query = query.gte('completion_date', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte('completion_date', filters.dateTo + 'T23:59:59.999Z');
  }

  // Search by rake number
  if (filters?.search) {
    query = query.ilike('rake_number', `%${filters.search}%`);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  const rows: CompletedRakeRow[] = data.map((r: any) => {
    const intake = new Date(r.intake_date);
    const completion = new Date(r.completion_date);
    const totalDurationDays = Math.ceil(
      (completion.getTime() - intake.getTime()) / (1000 * 60 * 60 * 24),
    );
    return {
      id: r.id,
      rakeNumber: r.rake_number,
      rakeType: r.rake_type,
      pohType: r.poh_type,
      shedId: r.shed_id,
      shedName: r.sheds?.name ?? '',
      totalCoaches: r.total_coaches,
      intakeDate: r.intake_date,
      completionDate: r.completion_date,
      totalDurationDays,
    };
  });

  // If searching by coach number, do a secondary search
  if (filters?.search && rows.length === 0) {
    const { data: coachMatches } = await supabase
      .from('coaches')
      .select('rake_id')
      .ilike('coach_number', `%${filters.search}%`);

    if (coachMatches && coachMatches.length > 0) {
      const rakeIds = [...new Set(coachMatches.map((c) => c.rake_id))];
      let coachQuery = supabase
        .from('rakes')
        .select(`
          id, rake_number, rake_type, poh_type, shed_id,
          total_coaches, intake_date, completion_date,
          sheds!inner ( name )
        `)
        .eq('status', 'Completed')
        .in('id', rakeIds)
        .order('completion_date', { ascending: false });

      if (shedId && shedId !== 'all') {
        coachQuery = coachQuery.eq('shed_id', shedId);
      }

      const { data: coachData } = await coachQuery;
      if (coachData) {
        return coachData.map((r: any) => {
          const intake = new Date(r.intake_date);
          const completion = new Date(r.completion_date);
          const totalDurationDays = Math.ceil(
            (completion.getTime() - intake.getTime()) / (1000 * 60 * 60 * 24),
          );
          return {
            id: r.id,
            rakeNumber: r.rake_number,
            rakeType: r.rake_type,
            pohType: r.poh_type,
            shedId: r.shed_id,
            shedName: r.sheds?.name ?? '',
            totalCoaches: r.total_coaches,
            intakeDate: r.intake_date,
            completionDate: r.completion_date,
            totalDurationDays,
          };
        });
      }
    }
  }

  return rows;
}

/* ── getCompletedRakeDetail ──────────────────────────────── */

export async function getCompletedRakeDetail(
  rakeId: string,
): Promise<CompletedRakeDetail | null> {
  const supabase = await createClient();

  const { data: rake, error: rakeErr } = await supabase
    .from('rakes')
    .select(`
      id, rake_number, rake_type, poh_type, shed_id,
      total_coaches, intake_date, completion_date,
      sheds!inner ( name )
    `)
    .eq('id', rakeId)
    .eq('status', 'Completed')
    .single();

  if (rakeErr || !rake) return null;

  // Fetch coaches with stage history
  const { data: coaches } = await supabase
    .from('coaches')
    .select(`
      id, coach_number,
      coach_stage_history (
        stage, start_date, completion_date,
        target_duration_days, actual_duration_days, timeline_status
      )
    `)
    .eq('rake_id', rakeId)
    .order('coach_number', { ascending: true });

  const intake = new Date(rake.intake_date);
  const completion = new Date(rake.completion_date);
  const totalDurationDays = Math.ceil(
    (completion.getTime() - intake.getTime()) / (1000 * 60 * 60 * 24),
  );

  return {
    id: rake.id,
    rakeNumber: rake.rake_number,
    rakeType: rake.rake_type,
    pohType: rake.poh_type,
    shedId: rake.shed_id,
    shedName: (rake.sheds as any)?.name ?? '',
    totalCoaches: rake.total_coaches,
    intakeDate: rake.intake_date,
    completionDate: rake.completion_date,
    totalDurationDays,
    coaches: (coaches ?? []).map((c: any) => ({
      id: c.id,
      coachNumber: c.coach_number,
      stageHistory: (c.coach_stage_history ?? [])
        .sort((a: any, b: any) => {
          const order = ['Intake', 'Dismantling', 'Inspection', 'Reassembly', 'Finishing', 'Testing', 'Trial', 'Release'];
          return order.indexOf(a.stage) - order.indexOf(b.stage);
        })
        .map((h: any) => ({
          stage: h.stage,
          startDate: h.start_date,
          completionDate: h.completion_date,
          targetDurationDays: h.target_duration_days,
          actualDurationDays: h.actual_duration_days,
          timelineStatus: h.timeline_status,
        })),
    })),
  };
}
