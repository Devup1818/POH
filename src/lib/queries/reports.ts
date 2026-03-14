'use server';

import { createClient } from '@/lib/supabase/server';
import { POH_STAGE_ORDER } from '@/lib/constants';
import type { POHStage, POHType, RakeType } from '@/types';

/* ── Shared filter type ──────────────────────────────────── */

export interface ReportFilters {
  shedId: string;
  rakeType?: RakeType | 'all';
  pohType?: POHType | 'all';
  dateFrom?: string; // ISO date
  dateTo?: string;   // ISO date
}

/* ── POH Type Performance Report ─────────────────────────── */

export interface POHTypePerformanceData {
  pohType: POHType;
  avgCompletionDays: number;
  onTimePct: number;
  avgDelayDays: number;
  totalRakes: number;
  stageDurations: { stage: string; avgDays: number }[];
}

export async function getPOHTypePerformanceReport(
  filters: ReportFilters,
): Promise<POHTypePerformanceData[]> {
  const supabase = await createClient();

  // Get completed rakes with filters
  let query = supabase
    .from('rakes')
    .select('id, poh_type, intake_date, completion_date, shed_id')
    .eq('status', 'Completed');

  if (filters.shedId !== 'all') query = query.eq('shed_id', filters.shedId);
  if (filters.rakeType && filters.rakeType !== 'all') query = query.eq('rake_type', filters.rakeType);
  if (filters.pohType && filters.pohType !== 'all') query = query.eq('poh_type', filters.pohType);
  if (filters.dateFrom) query = query.gte('completion_date', filters.dateFrom);
  if (filters.dateTo) query = query.lte('completion_date', filters.dateTo);

  const { data: rakes } = await query;
  if (!rakes || rakes.length === 0) return [];

  const rakeIds = rakes.map((r) => r.id);

  // Get stage history for these rakes' coaches
  const { data: coaches } = await supabase
    .from('coaches')
    .select('id, rake_id')
    .in('rake_id', rakeIds);

  const coachList = coaches ?? [];
  const coachIds = coachList.map((c) => c.id);
  const coachRakeMap = new Map(coachList.map((c) => [c.id, c.rake_id]));

  let stageHistory: { coach_id: string; stage: string; actual_duration_days: number | null; timeline_status: string | null }[] = [];
  if (coachIds.length > 0) {
    const { data } = await supabase
      .from('coach_stage_history')
      .select('coach_id, stage, actual_duration_days, timeline_status')
      .in('coach_id', coachIds)
      .not('completion_date', 'is', null);
    stageHistory = data ?? [];
  }

  // Group by POH type
  const pohTypes: POHType[] = ['1st POH', '2nd POH', '3rd POH', '4th POH'];
  const results: POHTypePerformanceData[] = [];

  for (const pt of pohTypes) {
    const ptRakes = rakes.filter((r) => r.poh_type === pt);
    if (ptRakes.length === 0) continue;

    const ptRakeIds = new Set(ptRakes.map((r) => r.id));
    const ptCoachIds = coachList.filter((c) => ptRakeIds.has(c.rake_id)).map((c) => c.id);
    const ptHistory = stageHistory.filter((h) => ptCoachIds.includes(h.coach_id));

    // Avg completion days
    const completionDays = ptRakes
      .filter((r) => r.completion_date)
      .map((r) => {
        const diff = new Date(r.completion_date!).getTime() - new Date(r.intake_date).getTime();
        return diff / (1000 * 60 * 60 * 24);
      });
    const avgCompletionDays = completionDays.length > 0
      ? Math.round(completionDays.reduce((a, b) => a + b, 0) / completionDays.length * 10) / 10
      : 0;

    // On-time %
    const totalStages = ptHistory.length;
    const onTimeStages = ptHistory.filter(
      (h) => h.timeline_status === 'On Schedule' || h.timeline_status === 'Ahead of Schedule',
    ).length;
    const onTimePct = totalStages > 0 ? Math.round((onTimeStages / totalStages) * 100) : 0;

    // Avg delay
    const delayedStages = ptHistory.filter(
      (h) => h.actual_duration_days != null && h.timeline_status && h.timeline_status.includes('Delay'),
    );
    const avgDelayDays = delayedStages.length > 0
      ? Math.round(delayedStages.reduce((sum, h) => sum + (h.actual_duration_days ?? 0), 0) / delayedStages.length * 10) / 10
      : 0;

    // Stage durations
    const stageDurations = POH_STAGE_ORDER.map((stage) => {
      const stageEntries = ptHistory.filter((h) => h.stage === stage && h.actual_duration_days != null);
      const avg = stageEntries.length > 0
        ? Math.round(stageEntries.reduce((s, h) => s + (h.actual_duration_days ?? 0), 0) / stageEntries.length * 10) / 10
        : 0;
      return { stage, avgDays: avg };
    });

    results.push({
      pohType: pt,
      avgCompletionDays,
      onTimePct,
      avgDelayDays,
      totalRakes: ptRakes.length,
      stageDurations,
    });
  }

  return results;
}

/* ── Stage Performance Report ────────────────────────────── */

export interface StagePerformanceData {
  stage: POHStage;
  avgDuration: number;
  onTimePct: number;
  totalCompleted: number;
}

export async function getStagePerformanceReport(
  filters: ReportFilters,
): Promise<StagePerformanceData[]> {
  const supabase = await createClient();

  // Get rakes matching filters
  let query = supabase.from('rakes').select('id').eq('status', 'Completed');
  if (filters.shedId !== 'all') query = query.eq('shed_id', filters.shedId);
  if (filters.rakeType && filters.rakeType !== 'all') query = query.eq('rake_type', filters.rakeType);
  if (filters.pohType && filters.pohType !== 'all') query = query.eq('poh_type', filters.pohType);
  if (filters.dateFrom) query = query.gte('completion_date', filters.dateFrom);
  if (filters.dateTo) query = query.lte('completion_date', filters.dateTo);

  // Also include active rakes for current data
  let activeQuery = supabase.from('rakes').select('id').eq('status', 'Active');
  if (filters.shedId !== 'all') activeQuery = activeQuery.eq('shed_id', filters.shedId);
  if (filters.rakeType && filters.rakeType !== 'all') activeQuery = activeQuery.eq('rake_type', filters.rakeType);
  if (filters.pohType && filters.pohType !== 'all') activeQuery = activeQuery.eq('poh_type', filters.pohType);

  const [{ data: completedRakes }, { data: activeRakes }] = await Promise.all([query, activeQuery]);
  const allRakeIds = [...(completedRakes ?? []), ...(activeRakes ?? [])].map((r) => r.id);
  if (allRakeIds.length === 0) return [];

  const { data: coaches } = await supabase
    .from('coaches')
    .select('id')
    .in('rake_id', allRakeIds);

  const coachIds = (coaches ?? []).map((c) => c.id);
  if (coachIds.length === 0) return [];

  const { data: history } = await supabase
    .from('coach_stage_history')
    .select('stage, actual_duration_days, timeline_status')
    .in('coach_id', coachIds)
    .not('completion_date', 'is', null);

  const stageHistory = history ?? [];

  return POH_STAGE_ORDER.map((stage) => {
    const entries = stageHistory.filter((h) => h.stage === stage);
    const withDuration = entries.filter((h) => h.actual_duration_days != null);
    const avgDuration = withDuration.length > 0
      ? Math.round(withDuration.reduce((s, h) => s + (h.actual_duration_days ?? 0), 0) / withDuration.length * 10) / 10
      : 0;
    const onTime = entries.filter(
      (h) => h.timeline_status === 'On Schedule' || h.timeline_status === 'Ahead of Schedule',
    ).length;
    const onTimePct = entries.length > 0 ? Math.round((onTime / entries.length) * 100) : 0;

    return { stage, avgDuration, onTimePct, totalCompleted: entries.length };
  });
}


/* ── Parts Management Report ─────────────────────────────── */

export interface PartsReportEntry {
  partName: string;
  missingCount: number;
  avgDelayDays: number;
  affectedCoaches: number;
}

export async function getPartsManagementReport(
  filters: ReportFilters,
): Promise<PartsReportEntry[]> {
  const supabase = await createClient();

  let query = supabase.from('rakes').select('id').eq('status', 'Active');
  if (filters.shedId !== 'all') query = query.eq('shed_id', filters.shedId);
  if (filters.rakeType && filters.rakeType !== 'all') query = query.eq('rake_type', filters.rakeType);
  if (filters.pohType && filters.pohType !== 'all') query = query.eq('poh_type', filters.pohType);

  const { data: rakes } = await query;
  if (!rakes || rakes.length === 0) return [];

  const { data: coaches } = await supabase
    .from('coaches')
    .select('id')
    .in('rake_id', rakes.map((r) => r.id));

  const coachIds = (coaches ?? []).map((c) => c.id);
  if (coachIds.length === 0) return [];

  const { data: parts } = await supabase
    .from('coach_parts')
    .select('part_name, status, status_updated_at, expected_arrival_date, coach_id')
    .in('coach_id', coachIds)
    .eq('status', 'Missing/Pending');

  const missingParts = parts ?? [];

  // Group by part name
  const partMap = new Map<string, { count: number; delays: number[]; coaches: Set<string> }>();
  for (const p of missingParts) {
    const entry = partMap.get(p.part_name) ?? { count: 0, delays: [], coaches: new Set() };
    entry.count++;
    entry.coaches.add(p.coach_id);
    if (p.status_updated_at) {
      const daysSinceMissing = Math.ceil(
        (Date.now() - new Date(p.status_updated_at).getTime()) / (1000 * 60 * 60 * 24),
      );
      entry.delays.push(daysSinceMissing);
    }
    partMap.set(p.part_name, entry);
  }

  return Array.from(partMap.entries())
    .map(([partName, data]) => ({
      partName,
      missingCount: data.count,
      avgDelayDays: data.delays.length > 0
        ? Math.round(data.delays.reduce((a, b) => a + b, 0) / data.delays.length * 10) / 10
        : 0,
      affectedCoaches: data.coaches.size,
    }))
    .sort((a, b) => b.missingCount - a.missingCount);
}

/* ── Timeline Performance Report ─────────────────────────── */

export interface TimelineDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface DelayedCoachEntry {
  coachNumber: string;
  rakeNumber: string;
  currentStage: string;
  delayDays: number;
  pohType: string;
}

export interface TimelinePerformanceData {
  distribution: TimelineDistribution[];
  avgDelayDays: number;
  longestDelayed: DelayedCoachEntry[];
}

export async function getTimelinePerformanceReport(
  filters: ReportFilters,
): Promise<TimelinePerformanceData> {
  const supabase = await createClient();

  let query = supabase.from('rakes').select('id, rake_number, poh_type').eq('status', 'Active');
  if (filters.shedId !== 'all') query = query.eq('shed_id', filters.shedId);
  if (filters.rakeType && filters.rakeType !== 'all') query = query.eq('rake_type', filters.rakeType);
  if (filters.pohType && filters.pohType !== 'all') query = query.eq('poh_type', filters.pohType);

  const { data: rakes } = await query;
  if (!rakes || rakes.length === 0) {
    return { distribution: [], avgDelayDays: 0, longestDelayed: [] };
  }

  const rakeMap = new Map(rakes.map((r) => [r.id, r]));
  const rakeIds = rakes.map((r) => r.id);

  const { data: coaches } = await supabase
    .from('coaches')
    .select('id, rake_id, coach_number, current_stage')
    .in('rake_id', rakeIds);

  const coachList = coaches ?? [];
  const coachIds = coachList.map((c) => c.id);
  if (coachIds.length === 0) {
    return { distribution: [], avgDelayDays: 0, longestDelayed: [] };
  }

  const { data: history } = await supabase
    .from('coach_stage_history')
    .select('coach_id, timeline_status, actual_duration_days, target_duration_days')
    .in('coach_id', coachIds)
    .not('timeline_status', 'is', null);

  const stageHistory = history ?? [];

  // Get latest status per coach
  const coachStatusMap = new Map<string, string>();
  const coachDelayMap = new Map<string, number>();
  for (const h of stageHistory) {
    coachStatusMap.set(h.coach_id, h.timeline_status!);
    if (h.actual_duration_days != null && h.target_duration_days != null) {
      const delay = h.actual_duration_days - h.target_duration_days;
      if (delay > 0) {
        coachDelayMap.set(h.coach_id, Math.max(coachDelayMap.get(h.coach_id) ?? 0, delay));
      }
    }
  }

  // Distribution
  const statusCounts: Record<string, number> = {
    'On Schedule': 0,
    'Ahead of Schedule': 0,
    'Minor Delay': 0,
    'Significant Delay': 0,
  };
  // Coaches without history are "On Schedule"
  for (const c of coachList) {
    const status = coachStatusMap.get(c.id) ?? 'On Schedule';
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
  }

  const total = coachList.length;
  const distribution: TimelineDistribution[] = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));

  // Avg delay
  const delays = Array.from(coachDelayMap.values());
  const avgDelayDays = delays.length > 0
    ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length * 10) / 10
    : 0;

  // Longest delayed coaches
  const longestDelayed: DelayedCoachEntry[] = coachList
    .filter((c) => coachDelayMap.has(c.id))
    .map((c) => {
      const rake = rakeMap.get(c.rake_id);
      return {
        coachNumber: c.coach_number,
        rakeNumber: rake?.rake_number ?? '',
        currentStage: c.current_stage,
        delayDays: coachDelayMap.get(c.id) ?? 0,
        pohType: rake?.poh_type ?? '',
      };
    })
    .sort((a, b) => b.delayDays - a.delayDays)
    .slice(0, 10);

  return { distribution, avgDelayDays, longestDelayed };
}

/* ── Checklist Compliance Report ─────────────────────────── */

export interface ChecklistComplianceData {
  pohType: POHType;
  avgCompletionPct: number;
  mandatoryCompliancePct: number;
  totalCoaches: number;
}

export async function getChecklistComplianceReport(
  filters: ReportFilters,
): Promise<ChecklistComplianceData[]> {
  const supabase = await createClient();

  let query = supabase.from('rakes').select('id, poh_type');
  if (filters.shedId !== 'all') query = query.eq('shed_id', filters.shedId);
  if (filters.rakeType && filters.rakeType !== 'all') query = query.eq('rake_type', filters.rakeType);
  if (filters.pohType && filters.pohType !== 'all') query = query.eq('poh_type', filters.pohType);

  const { data: rakes } = await query;
  if (!rakes || rakes.length === 0) return [];

  const rakeIds = rakes.map((r) => r.id);
  const rakePohMap = new Map(rakes.map((r) => [r.id, r.poh_type]));

  const { data: coaches } = await supabase
    .from('coaches')
    .select('id, rake_id')
    .in('rake_id', rakeIds);

  const coachList = coaches ?? [];
  const coachIds = coachList.map((c) => c.id);
  if (coachIds.length === 0) return [];

  // Get checklist items with template info
  const { data: items } = await supabase
    .from('coach_checklist_items')
    .select('coach_id, status, template_id, checklist_templates(is_mandatory)')
    .in('coach_id', coachIds);

  const checklistItems = items ?? [];

  // Group coaches by POH type
  const coachPohMap = new Map<string, string>();
  for (const c of coachList) {
    coachPohMap.set(c.id, rakePohMap.get(c.rake_id) ?? '');
  }

  const pohTypes: POHType[] = ['1st POH', '2nd POH', '3rd POH', '4th POH'];
  const results: ChecklistComplianceData[] = [];

  for (const pt of pohTypes) {
    const ptCoachIds = coachList
      .filter((c) => coachPohMap.get(c.id) === pt)
      .map((c) => c.id);
    if (ptCoachIds.length === 0) continue;

    const ptCoachSet = new Set(ptCoachIds);
    const ptItems = checklistItems.filter((i) => ptCoachSet.has(i.coach_id));

    const totalItems = ptItems.length;
    const completedItems = ptItems.filter((i) => i.status === 'Completed').length;
    const avgCompletionPct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    const mandatoryItems = ptItems.filter(
      (i) => (i.checklist_templates as unknown as { is_mandatory: boolean })?.is_mandatory,
    );
    const mandatoryCompleted = mandatoryItems.filter((i) => i.status === 'Completed').length;
    const mandatoryCompliancePct = mandatoryItems.length > 0
      ? Math.round((mandatoryCompleted / mandatoryItems.length) * 100)
      : 100;

    results.push({
      pohType: pt,
      avgCompletionPct,
      mandatoryCompliancePct,
      totalCoaches: ptCoachIds.length,
    });
  }

  return results;
}
