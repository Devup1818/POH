'use server';

import { createClient } from '@/lib/supabase/server';
import type { POHStage, POHType, RakeType, TimelineStatus } from '@/types';
import { POH_STAGE_ORDER } from '@/lib/constants';

/* ── Types ───────────────────────────────────────────────── */

export interface DashboardMetricsData {
  activeRakeCount: number;
  totalCoaches: number;
  avgCompletionPct: number;
  onTimePct: number;
  delayedCoaches: number;
  missingPartsCount: number;
}

export interface RakeSummary {
  id: string;
  rakeNumber: string;
  rakeType: RakeType;
  pohType: POHType;
  shedId: string;
  shedName: string;
  totalCoaches: number;
  intakeDate: string;
  currentStage: POHStage;
  elapsedDays: number;
  coachStages: Record<POHStage, number>;
  delayedCoachCount: number;
  missingPartsCoachCount: number;
  avgCompletionPct: number;
}

export interface DashboardFilters {
  shedId: string;
  rakeType?: RakeType | 'all';
  pohType?: POHType | 'all';
  stage?: POHStage | 'all';
  timelineStatus?: TimelineStatus | 'all';
  sortBy?: 'intake' | 'completion' | 'elapsed' | 'delayed';
  search?: string;
}

/* ── Helpers ─────────────────────────────────────────────── */

function stageIndex(stage: string): number {
  const idx = POH_STAGE_ORDER.indexOf(stage as POHStage);
  return idx === -1 ? 0 : idx;
}

/** Calculate completion % based on current stage position */
function coachCompletionPct(stage: POHStage): number {
  const idx = stageIndex(stage);
  // Each completed stage = 12.5%, current stage counts as half
  return Math.round((idx / POH_STAGE_ORDER.length) * 100);
}

/** Determine the earliest stage among a set of coaches */
function earliestStage(stages: POHStage[]): POHStage {
  if (stages.length === 0) return 'Intake';
  let earliest = stages[0];
  for (const s of stages) {
    if (stageIndex(s) < stageIndex(earliest)) earliest = s;
  }
  return earliest;
}

/* ── getDashboardMetrics ─────────────────────────────────── */

export async function getDashboardMetrics(
  shedId: string,
  sectionNames?: string[],
): Promise<DashboardMetricsData> {
  const supabase = await createClient();

  // Fetch active rakes (optionally filtered by shed)
  let rakesQuery = supabase
    .from('rakes')
    .select('id, total_coaches, shed_id')
    .eq('status', 'Active');

  if (shedId !== 'all') {
    rakesQuery = rakesQuery.eq('shed_id', shedId);
  }

  const { data: rakes } = await rakesQuery;
  if (!rakes || rakes.length === 0) {
    return {
      activeRakeCount: 0,
      totalCoaches: 0,
      avgCompletionPct: 0,
      onTimePct: 0,
      delayedCoaches: 0,
      missingPartsCount: 0,
    };
  }

  const rakeIds = rakes.map((r) => r.id);

  // Fetch all coaches for these rakes
  const { data: coaches } = await supabase
    .from('coaches')
    .select('id, rake_id, current_stage, stage_start_date')
    .in('rake_id', rakeIds);

  const coachList = coaches ?? [];
  let filteredCoachList = coachList;

  // If section filtering is active, only include coaches that have work in the given sections
  if (sectionNames && sectionNames.length > 0 && coachList.length > 0) {
    const allCoachIds = coachList.map((c) => c.id);
    const { data: sectionStatuses } = await supabase
      .from('coach_section_status')
      .select('coach_id')
      .in('coach_id', allCoachIds)
      .in('section_name', sectionNames);

    if (sectionStatuses) {
      const matchingCoachIds = new Set(sectionStatuses.map((s) => s.coach_id));
      filteredCoachList = coachList.filter((c) => matchingCoachIds.has(c.id));
    }
  }

  const coachIds = filteredCoachList.map((c) => c.id);

  // Fetch missing parts count
  let missingPartsCount = 0;
  if (coachIds.length > 0) {
    const { count } = await supabase
      .from('coach_parts')
      .select('id', { count: 'exact', head: true })
      .in('coach_id', coachIds)
      .eq('status', 'Missing/Pending');
    missingPartsCount = count ?? 0;
  }

  // Fetch stage history for timeline status
  let delayedCoaches = 0;
  let onTimeCoaches = 0;
  if (coachIds.length > 0) {
    const { data: stageHistory } = await supabase
      .from('coach_stage_history')
      .select('coach_id, timeline_status')
      .in('coach_id', coachIds)
      .not('timeline_status', 'is', null);

    if (stageHistory) {
      // Get the latest timeline status per coach
      const coachStatuses = new Map<string, string>();
      for (const sh of stageHistory) {
        coachStatuses.set(sh.coach_id, sh.timeline_status);
      }
      for (const status of coachStatuses.values()) {
        if (status === 'Minor Delay' || status === 'Significant Delay') {
          delayedCoaches++;
        } else {
          onTimeCoaches++;
        }
      }
    }
  }

  // Calculate avg completion
  const totalCoaches = filteredCoachList.length;
  const avgCompletionPct =
    totalCoaches > 0
      ? Math.round(
          filteredCoachList.reduce(
            (sum, c) => sum + coachCompletionPct(c.current_stage as POHStage),
            0,
          ) / totalCoaches,
        )
      : 0;

  const totalWithStatus = delayedCoaches + onTimeCoaches;
  const onTimePct =
    totalWithStatus > 0
      ? Math.round((onTimeCoaches / totalWithStatus) * 100)
      : totalCoaches > 0
        ? 100
        : 0;

  return {
    activeRakeCount: rakes.length,
    totalCoaches,
    avgCompletionPct,
    onTimePct,
    delayedCoaches,
    missingPartsCount,
  };
}

/* ── getActiveRakes ──────────────────────────────────────── */

export async function getActiveRakes(
  filters: DashboardFilters,
  sectionNames?: string[],
): Promise<RakeSummary[]> {
  const supabase = await createClient();

  // Fetch active rakes with shed info
  let rakesQuery = supabase
    .from('rakes')
    .select(`
      id,
      rake_number,
      rake_type,
      poh_type,
      shed_id,
      total_coaches,
      intake_date,
      sheds ( name )
    `)
    .eq('status', 'Active');

  if (filters.shedId !== 'all') {
    rakesQuery = rakesQuery.eq('shed_id', filters.shedId);
  }
  if (filters.rakeType && filters.rakeType !== 'all') {
    rakesQuery = rakesQuery.eq('rake_type', filters.rakeType);
  }
  if (filters.pohType && filters.pohType !== 'all') {
    rakesQuery = rakesQuery.eq('poh_type', filters.pohType);
  }

  const { data: rakes, error } = await rakesQuery;
  if (error || !rakes || rakes.length === 0) return [];

  const rakeIds = rakes.map((r) => r.id);

  // Fetch all coaches for these rakes
  const { data: coaches } = await supabase
    .from('coaches')
    .select('id, rake_id, coach_number, current_stage, stage_start_date')
    .in('rake_id', rakeIds);

  const coachList = coaches ?? [];

  // If section filtering is active, only include coaches with work in the given sections
  let filteredCoachIds: Set<string> | null = null;
  if (sectionNames && sectionNames.length > 0 && coachList.length > 0) {
    const allCoachIds = coachList.map((c) => c.id);
    const { data: sectionStatuses } = await supabase
      .from('coach_section_status')
      .select('coach_id')
      .in('coach_id', allCoachIds)
      .in('section_name', sectionNames);

    if (sectionStatuses) {
      filteredCoachIds = new Set(sectionStatuses.map((s) => s.coach_id));
    }
  }

  const coachIds = coachList.map((c) => c.id);

  // Fetch missing parts per coach
  const missingPartsMap = new Map<string, number>();
  if (coachIds.length > 0) {
    const { data: missingParts } = await supabase
      .from('coach_parts')
      .select('coach_id')
      .in('coach_id', coachIds)
      .eq('status', 'Missing/Pending');

    if (missingParts) {
      for (const mp of missingParts) {
        missingPartsMap.set(
          mp.coach_id,
          (missingPartsMap.get(mp.coach_id) ?? 0) + 1,
        );
      }
    }
  }

  // Fetch timeline statuses from stage history
  const delayedCoachSet = new Set<string>();
  if (coachIds.length > 0) {
    const { data: stageHistory } = await supabase
      .from('coach_stage_history')
      .select('coach_id, timeline_status')
      .in('coach_id', coachIds)
      .in('timeline_status', ['Minor Delay', 'Significant Delay']);

    if (stageHistory) {
      for (const sh of stageHistory) {
        delayedCoachSet.add(sh.coach_id);
      }
    }
  }

  // Build summaries
  const now = Date.now();
  const results: RakeSummary[] = [];

  for (const rake of rakes) {
    let rakeCoaches = coachList.filter((c) => c.rake_id === rake.id);

    // Apply section filtering if active
    if (filteredCoachIds) {
      rakeCoaches = rakeCoaches.filter((c) => filteredCoachIds!.has(c.id));
    }
    if (rakeCoaches.length === 0) continue;

    const stages = rakeCoaches.map((c) => c.current_stage as POHStage);

    // Build stage distribution
    const coachStages = {} as Record<POHStage, number>;
    POH_STAGE_ORDER.forEach((s) => (coachStages[s] = 0));
    for (const s of stages) {
      coachStages[s] = (coachStages[s] || 0) + 1;
    }

    // Count delayed and missing parts coaches for this rake
    const rakeCoachIds = new Set(rakeCoaches.map((c) => c.id));
    let delayedCount = 0;
    let missingCount = 0;
    for (const cid of rakeCoachIds) {
      if (delayedCoachSet.has(cid)) delayedCount++;
      if (missingPartsMap.has(cid)) missingCount++;
    }

    const elapsedDays = Math.ceil(
      (now - new Date(rake.intake_date).getTime()) / (1000 * 60 * 60 * 24),
    );

    const avgPct =
      rakeCoaches.length > 0
        ? Math.round(
            rakeCoaches.reduce(
              (sum, c) =>
                sum + coachCompletionPct(c.current_stage as POHStage),
              0,
            ) / rakeCoaches.length,
          )
        : 0;

    // shed name from joined data
    const shedName =
      (rake.sheds as unknown as { name: string })?.name ?? 'Unknown';

    const summary: RakeSummary = {
      id: rake.id,
      rakeNumber: rake.rake_number,
      rakeType: rake.rake_type as RakeType,
      pohType: rake.poh_type as POHType,
      shedId: rake.shed_id,
      shedName,
      totalCoaches: rake.total_coaches,
      intakeDate: rake.intake_date,
      currentStage: earliestStage(stages),
      elapsedDays,
      coachStages,
      delayedCoachCount: delayedCount,
      missingPartsCoachCount: missingCount,
      avgCompletionPct: avgPct,
    };

    results.push(summary);
  }

  // Apply client-side filters that couldn't be done in SQL
  let filtered = results;

  if (filters.stage && filters.stage !== 'all') {
    filtered = filtered.filter((r) => r.currentStage === filters.stage);
  }

  if (filters.timelineStatus && filters.timelineStatus !== 'all') {
    if (
      filters.timelineStatus === 'Minor Delay' ||
      filters.timelineStatus === 'Significant Delay'
    ) {
      filtered = filtered.filter((r) => r.delayedCoachCount > 0);
    } else if (filters.timelineStatus === 'On Schedule') {
      filtered = filtered.filter((r) => r.delayedCoachCount === 0);
    }
  }

  if (filters.search?.trim()) {
    const q = filters.search.toLowerCase();
    // For search by coach number, we need to check coaches
    const matchingRakeIds = new Set<string>();
    for (const c of coachList) {
      if (c.coach_number.includes(q)) {
        matchingRakeIds.add(c.rake_id);
      }
    }
    filtered = filtered.filter(
      (r) =>
        r.rakeNumber.toLowerCase().includes(q) || matchingRakeIds.has(r.id),
    );
  }

  // Sort
  switch (filters.sortBy) {
    case 'intake':
      filtered.sort(
        (a, b) =>
          new Date(b.intakeDate).getTime() - new Date(a.intakeDate).getTime(),
      );
      break;
    case 'elapsed':
      filtered.sort((a, b) => b.elapsedDays - a.elapsedDays);
      break;
    case 'delayed':
      filtered.sort((a, b) => b.delayedCoachCount - a.delayedCoachCount);
      break;
    case 'completion':
      filtered.sort((a, b) => {
        const remA = Math.max(0, 20 - a.elapsedDays);
        const remB = Math.max(0, 20 - b.elapsedDays);
        return remA - remB;
      });
      break;
  }

  return filtered;
}

/* ── getSheds (for shed selector) ────────────────────────── */

export async function getSheds(): Promise<
  { id: string; name: string; shed_code: string }[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('sheds')
    .select('id, name, shed_code')
    .eq('is_active', true)
    .order('name');

  return data ?? [];
}
