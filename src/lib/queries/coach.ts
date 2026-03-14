'use server';

import { createClient } from '@/lib/supabase/server';
import type { POHStage } from '@/types';

/* ── Types ───────────────────────────────────────────────── */

export interface CoachSummary {
  id: string;
  coachNumber: string;
  coachType: string;
  currentStage: POHStage;
  stageStartDate: string;
  elapsedDays: number;
  completionPct: number;
  missingPartsCount: number;
  checklistCompletionPct: number;
  timelineStatus: string | null;
  allTestsComplete: boolean;
  noteCount: number;
}

export interface RakeDetail {
  id: string;
  rakeNumber: string;
  rakeCategory?: string;
  rakeType: string;
  pohType: string;
  shedId: string;
  shedName: string;
  totalCoaches: number;
  intakeDate: string;
  status: string;
  coaches: CoachSummary[];
}

export interface StageHistoryEntry {
  id: string;
  stage: POHStage;
  startDate: string;
  completionDate: string | null;
  targetDurationDays: number;
  actualDurationDays: number | null;
  timelineStatus: string | null;
}

export interface CoachDetail {
  id: string;
  coachNumber: string;
  coachType: string;
  rakeId: string;
  rakeNumber: string;
  rakeType: string;
  pohType: string;
  currentStage: POHStage;
  stageStartDate: string;
  stageHistory: StageHistoryEntry[];
  parts: PartDetail[];
  tests: TestDetail[];
  checklistCompletionPct: number;
  totalChecklistItems: number;
  completedChecklistItems: number;
}

export interface PartDetail {
  id: string;
  partName: string;
  status: string;
  statusUpdatedAt: string;
  notes: string | null;
  expectedArrivalDate: string | null;
}

export interface TestDetail {
  id: string;
  testType: string;
  status: string;
  startDate: string | null;
  completionDate: string | null;
  completedBy: string | null;
  completedByName: string | null;
  notes: string | null;
}

/* ── Helpers ─────────────────────────────────────────────── */

const STAGE_ORDER = [
  'Intake', 'Dismantling', 'Inspection', 'Reassembly',
  'Finishing', 'Testing', 'Trial', 'Release',
];

function stageCompletionPct(stage: string): number {
  const idx = STAGE_ORDER.indexOf(stage);
  return idx === -1 ? 0 : Math.round((idx / STAGE_ORDER.length) * 100);
}

/* ── getRakeDetail ───────────────────────────────────────── */

export async function getRakeDetail(rakeId: string): Promise<RakeDetail | null> {
  const supabase = await createClient();

  const { data: rake } = await supabase
    .from('rakes')
    .select(`
      id, rake_number, rake_type, poh_type, shed_id, total_coaches,
      intake_date, status,
      sheds ( name )
    `)
    .eq('id', rakeId)
    .single();

  if (!rake) return null;

  // Fetch coaches (coach_type only exists after migration 010)
  const { data: coaches } = await supabase
    .from('coaches')
    .select('id, coach_number, current_stage, stage_start_date')
    .eq('rake_id', rakeId)
    .order('coach_number');

  const coachList = coaches ?? [];
  const coachIds = coachList.map((c) => c.id);

  // Fetch missing parts counts
  const missingMap = new Map<string, number>();
  if (coachIds.length > 0) {
    const { data: missing } = await supabase
      .from('coach_parts')
      .select('coach_id')
      .in('coach_id', coachIds)
      .eq('status', 'Missing/Pending');

    if (missing) {
      for (const m of missing) {
        missingMap.set(m.coach_id, (missingMap.get(m.coach_id) ?? 0) + 1);
      }
    }
  }

  // Fetch checklist completion
  const checklistMap = new Map<string, { total: number; completed: number }>();
  if (coachIds.length > 0) {
    const { data: checklistItems } = await supabase
      .from('coach_checklist_items')
      .select('coach_id, status')
      .in('coach_id', coachIds);

    if (checklistItems) {
      for (const item of checklistItems) {
        const entry = checklistMap.get(item.coach_id) ?? { total: 0, completed: 0 };
        entry.total++;
        if (item.status === 'Completed') entry.completed++;
        checklistMap.set(item.coach_id, entry);
      }
    }
  }

  // Fetch timeline statuses
  const timelineMap = new Map<string, string>();
  if (coachIds.length > 0) {
    const { data: history } = await supabase
      .from('coach_stage_history')
      .select('coach_id, timeline_status')
      .in('coach_id', coachIds)
      .not('timeline_status', 'is', null)
      .order('start_date', { ascending: false });

    if (history) {
      for (const h of history) {
        if (!timelineMap.has(h.coach_id)) {
          timelineMap.set(h.coach_id, h.timeline_status);
        }
      }
    }
  }

  // Fetch testing completion data for coaches in Testing stage
  const testingCompleteMap = new Map<string, boolean>();
  const coachesInTesting = coachList.filter((c) => c.current_stage === 'Testing').map((c) => c.id);
  if (coachesInTesting.length > 0) {
    const { data: testData } = await supabase
      .from('coach_tests')
      .select('coach_id, status')
      .in('coach_id', coachesInTesting);

    if (testData) {
      // Group by coach_id
      const testsByCoach = new Map<string, string[]>();
      for (const t of testData) {
        const statuses = testsByCoach.get(t.coach_id) ?? [];
        statuses.push(t.status);
        testsByCoach.set(t.coach_id, statuses);
      }
      for (const [cId, statuses] of testsByCoach) {
        testingCompleteMap.set(
          cId,
          statuses.length === 3 && statuses.every((s) => s === 'Completed'),
        );
      }
    }
  }

  // Fetch note counts per coach
  const noteCountMap = new Map<string, number>();
  if (coachIds.length > 0) {
    const { data: noteCounts } = await supabase
      .from('notes')
      .select('coach_id')
      .in('coach_id', coachIds);

    if (noteCounts) {
      for (const n of noteCounts) {
        noteCountMap.set(n.coach_id, (noteCountMap.get(n.coach_id) ?? 0) + 1);
      }
    }
  }

  const now = Date.now();
  const coachSummaries: CoachSummary[] = coachList.map((c) => {
    const cl = checklistMap.get(c.id);
    return {
      id: c.id,
      coachNumber: c.coach_number,
      coachType: (c as any).coach_type ?? 'MC',
      currentStage: c.current_stage as POHStage,
      stageStartDate: c.stage_start_date,
      elapsedDays: Math.ceil(
        (now - new Date(c.stage_start_date).getTime()) / (1000 * 60 * 60 * 24),
      ),
      completionPct: stageCompletionPct(c.current_stage),
      missingPartsCount: missingMap.get(c.id) ?? 0,
      checklistCompletionPct: cl && cl.total > 0
        ? Math.round((cl.completed / cl.total) * 100)
        : 0,
      timelineStatus: timelineMap.get(c.id) ?? null,
      allTestsComplete: testingCompleteMap.get(c.id) ?? false,
      noteCount: noteCountMap.get(c.id) ?? 0,
    };
  });

  const shedName = (rake.sheds as unknown as { name: string })?.name ?? 'Unknown';

  return {
    id: rake.id,
    rakeNumber: rake.rake_number,
    rakeCategory: (rake as any).rake_category ?? rake.rake_type ?? 'EMU',
    rakeType: rake.rake_type,
    pohType: rake.poh_type,
    shedId: rake.shed_id,
    shedName,
    totalCoaches: rake.total_coaches,
    intakeDate: rake.intake_date,
    status: rake.status,
    coaches: coachSummaries,
  };
}

/* ── getCoachDetail ──────────────────────────────────────── */

export async function getCoachDetail(coachId: string): Promise<CoachDetail | null> {
  const supabase = await createClient();

  // Fetch coach with parent rake info (coach_type only exists after migration 010)
  const { data: coach } = await supabase
    .from('coaches')
    .select(`
      id, coach_number, rake_id, current_stage, stage_start_date,
      rakes ( rake_number, rake_type, poh_type )
    `)
    .eq('id', coachId)
    .single();

  if (!coach) return null;

  const rake = coach.rakes as unknown as {
    rake_number: string;
    rake_type: string;
    poh_type: string;
  };

  // Fetch stage history
  const { data: history } = await supabase
    .from('coach_stage_history')
    .select('id, stage, start_date, completion_date, target_duration_days, actual_duration_days, timeline_status')
    .eq('coach_id', coachId)
    .order('start_date');

  const stageHistory: StageHistoryEntry[] = (history ?? []).map((h) => ({
    id: h.id,
    stage: h.stage as POHStage,
    startDate: h.start_date,
    completionDate: h.completion_date,
    targetDurationDays: h.target_duration_days,
    actualDurationDays: h.actual_duration_days,
    timelineStatus: h.timeline_status,
  }));

  // Fetch parts
  const { data: partsData } = await supabase
    .from('coach_parts')
    .select('id, part_name, status, status_updated_at, notes, expected_arrival_date')
    .eq('coach_id', coachId)
    .order('part_name');

  const parts: PartDetail[] = (partsData ?? []).map((p) => ({
    id: p.id,
    partName: p.part_name,
    status: p.status,
    statusUpdatedAt: p.status_updated_at,
    notes: p.notes,
    expectedArrivalDate: p.expected_arrival_date,
  }));

  // Fetch tests
  const { data: testsData } = await supabase
    .from('coach_tests')
    .select('id, test_type, status, start_date, completion_date, completed_by, notes, completer:completed_by ( full_name )')
    .eq('coach_id', coachId)
    .order('test_type');

  const tests: TestDetail[] = (testsData ?? []).map((t) => ({
    id: t.id,
    testType: t.test_type,
    status: t.status,
    startDate: t.start_date,
    completionDate: t.completion_date,
    completedBy: t.completed_by,
    completedByName: (t.completer as unknown as { full_name: string } | null)?.full_name ?? null,
    notes: t.notes,
  }));

  // Fetch checklist completion
  const { data: checklistData } = await supabase
    .from('coach_checklist_items')
    .select('id, status')
    .eq('coach_id', coachId);

  const checklistItems = checklistData ?? [];
  const totalChecklistItems = checklistItems.length;
  const completedChecklistItems = checklistItems.filter((i) => i.status === 'Completed').length;
  const checklistCompletionPct =
    totalChecklistItems > 0
      ? Math.round((completedChecklistItems / totalChecklistItems) * 100)
      : 0;

  return {
    id: coach.id,
    coachNumber: coach.coach_number,
    coachType: (coach as any).coach_type ?? 'MC',
    rakeId: coach.rake_id,
    rakeNumber: rake?.rake_number ?? '',
    rakeType: rake?.rake_type ?? '',
    pohType: rake?.poh_type ?? '',
    currentStage: coach.current_stage as POHStage,
    stageStartDate: coach.stage_start_date,
    stageHistory,
    parts,
    tests,
    checklistCompletionPct,
    totalChecklistItems,
    completedChecklistItems,
  };
}

/* ── getCoachChecklistItems ──────────────────────────────── */

export interface ChecklistItemDetail {
  id: string;
  itemCode: string;
  description: string;
  category: string;
  rdsoSmiReference: string;
  isMandatory: boolean;
  executionOrder: number;
  status: string;
  completionDate: string | null;
  notes: string | null;
}

export async function getCoachChecklistItems(coachId: string): Promise<ChecklistItemDetail[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('coach_checklist_items')
    .select(`
      id, status, completion_date, notes,
      template:template_id (
        item_code, description, category,
        rdso_smi_reference, is_mandatory, execution_order
      )
    `)
    .eq('coach_id', coachId)
    .order('created_at');

  if (!data) return [];

  return data.map((item) => {
    const t = item.template as unknown as {
      item_code: string;
      description: string;
      category: string;
      rdso_smi_reference: string;
      is_mandatory: boolean;
      execution_order: number;
    } | null;

    return {
      id: item.id,
      itemCode: t?.item_code ?? '',
      description: t?.description ?? '',
      category: t?.category ?? '',
      rdsoSmiReference: t?.rdso_smi_reference ?? '',
      isMandatory: t?.is_mandatory ?? false,
      executionOrder: t?.execution_order ?? 0,
      status: item.status,
      completionDate: item.completion_date,
      notes: item.notes ?? null,
    };
  }).sort((a, b) => a.executionOrder - b.executionOrder);
}

/* ── getCoachNotes ───────────────────────────────────────── */

export interface NoteDetail {
  id: string;
  coachId: string;
  noteType: string;
  content: string;
  isImportant: boolean;
  relatedStage: string | null;
  relatedPart: string | null;
  createdBy: string;
  createdAt: string;
}

export async function getCoachNotes(coachId: string): Promise<NoteDetail[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('notes')
    .select(`
      id, coach_id, note_type, content, is_important,
      related_stage, related_part, created_at,
      author:created_by ( full_name )
    `)
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false });

  if (!data) return [];

  return data.map((n) => ({
    id: n.id,
    coachId: n.coach_id,
    noteType: n.note_type,
    content: n.content,
    isImportant: n.is_important,
    relatedStage: n.related_stage,
    relatedPart: n.related_part,
    createdBy: (n.author as unknown as { full_name: string } | null)?.full_name ?? 'Unknown',
    createdAt: n.created_at,
  }));
}

/* ── getCoachSiblings (for prev/next navigation) ─────────── */

export async function getCoachSiblings(
  rakeId: string,
  coachId: string,
): Promise<{ prevCoachId: string | null; nextCoachId: string | null; rakeAvgProgress: number }> {
  const supabase = await createClient();

  const { data: coaches } = await supabase
    .from('coaches')
    .select('id, current_stage')
    .eq('rake_id', rakeId)
    .order('coach_number');

  if (!coaches || coaches.length === 0) {
    return { prevCoachId: null, nextCoachId: null, rakeAvgProgress: 0 };
  }

  const idx = coaches.findIndex((c) => c.id === coachId);
  const prevCoachId = idx > 0 ? coaches[idx - 1].id : null;
  const nextCoachId = idx < coaches.length - 1 ? coaches[idx + 1].id : null;

  const rakeAvgProgress =
    coaches.length > 0
      ? Math.round(
          coaches.reduce((sum, c) => sum + stageCompletionPct(c.current_stage), 0) / coaches.length,
        )
      : 0;

  return { prevCoachId, nextCoachId, rakeAvgProgress };
}
