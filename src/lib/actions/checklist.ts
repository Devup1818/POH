'use server';

import { createClient } from '@/lib/supabase/server';
import type { ChecklistStatus, Result } from '@/types';

/* ── Types ───────────────────────────────────────────────── */

export interface ChecklistItemForCoach {
  id: string;
  coachId: string;
  templateId: string;
  itemCode: string;
  description: string;
  category: string;
  rdsoSmiReference: string;
  isMandatory: boolean;
  executionOrder: number;
  status: ChecklistStatus;
  completionDate: string | null;
  completedBy: string | null;
  notes: string | null;
}

export interface ChecklistComplianceEntry {
  shedId: string;
  shedName: string;
  rakeId: string;
  rakeNumber: string;
  pohType: string;
  coachId: string;
  coachNumber: string;
  totalItems: number;
  completedItems: number;
  inProgressItems: number;
  notStartedItems: number;
  mandatoryTotal: number;
  mandatoryCompleted: number;
  completionPct: number;
  mandatoryCompliancePct: number;
}

export interface ComplianceFilters {
  pohType?: string;
  rakeType?: string;
  dateFrom?: string;
  dateTo?: string;
}

/* ── updateChecklistItem ─────────────────────────────────── */

const VALID_TRANSITIONS: Record<ChecklistStatus, ChecklistStatus[]> = {
  'Not Started': ['In Progress', 'Completed'],
  'In Progress': ['Not Started', 'Completed'],
  'Completed': ['Not Started', 'In Progress'],
};

/**
 * Update a checklist item's status for a specific coach.
 * Records completion timestamp and user when status is Completed.
 * Validates status transition.
 */
export async function updateChecklistItem(
  itemId: string,
  coachId: string,
  status: ChecklistStatus,
  notes?: string,
): Promise<Result<void>> {
  const supabase = await createClient();

  // Verify the item belongs to the coach
  const { data: existing, error: fetchError } = await supabase
    .from('coach_checklist_items')
    .select('id, status, coach_id')
    .eq('id', itemId)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: 'Checklist item not found' };
  }

  if (existing.coach_id !== coachId) {
    return { success: false, error: 'Checklist item does not belong to this coach' };
  }

  // Validate status transition
  const currentStatus = existing.status as ChecklistStatus;
  const allowed = VALID_TRANSITIONS[currentStatus];
  if (!allowed?.includes(status)) {
    return {
      success: false,
      error: `Cannot transition from "${currentStatus}" to "${status}"`,
    };
  }

  const { data: { user } } = await supabase.auth.getUser();

  const update: Record<string, unknown> = {
    status,
  };

  // Only update notes if provided (allow clearing with empty string)
  if (notes !== undefined) {
    update.notes = notes || null;
  }

  if (status === 'Completed') {
    update.completion_date = new Date().toISOString();
    update.completed_by = user?.id ?? null;
  } else {
    update.completion_date = null;
    update.completed_by = null;
  }

  const { error } = await supabase
    .from('coach_checklist_items')
    .update(update)
    .eq('id', itemId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

/* ── bulkMarkChecklistComplete ────────────────────────────── */

/**
 * Mark all incomplete checklist items for a coach as Completed in a single query.
 */
export async function bulkMarkChecklistComplete(
  coachId: string,
): Promise<Result<{ updatedCount: number }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('coach_checklist_items')
    .update({
      status: 'Completed',
      completion_date: now,
      completed_by: user?.id ?? null,
    })
    .eq('coach_id', coachId)
    .neq('status', 'Completed')
    .select('id');

  if (error) return { success: false, error: error.message };
  return { success: true, data: { updatedCount: data?.length ?? 0 } };
}

/* ── updateChecklistItemNotes ────────────────────────────── */

/**
 * Update only the notes field of a checklist item.
 */
export async function updateChecklistItemNotes(
  itemId: string,
  coachId: string,
  notes: string,
): Promise<Result<void>> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('coach_checklist_items')
    .update({ notes: notes || null })
    .eq('id', itemId)
    .eq('coach_id', coachId);

  if (error) return { success: false, error: error.message };
  return { success: true, data: undefined };
}

/* ── getChecklistForCoach ────────────────────────────────── */

/**
 * Fetch all checklist items for a coach with template details
 * (description, category, RDSO reference, mandatory flag).
 */
export async function getChecklistForCoach(
  coachId: string,
): Promise<Result<ChecklistItemForCoach[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('coach_checklist_items')
    .select(`
      id, coach_id, template_id, status, completion_date, completed_by, notes,
      template:template_id (
        item_code, description, category,
        rdso_smi_reference, is_mandatory, execution_order
      )
    `)
    .eq('coach_id', coachId)
    .order('created_at');

  if (error) return { success: false, error: error.message };

  const items: ChecklistItemForCoach[] = (data ?? []).map((item) => {
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
      coachId: item.coach_id,
      templateId: item.template_id,
      itemCode: t?.item_code ?? '',
      description: t?.description ?? '',
      category: t?.category ?? '',
      rdsoSmiReference: t?.rdso_smi_reference ?? '',
      isMandatory: t?.is_mandatory ?? false,
      executionOrder: t?.execution_order ?? 0,
      status: item.status as ChecklistStatus,
      completionDate: item.completion_date,
      completedBy: item.completed_by,
      notes: item.notes,
    };
  }).sort((a, b) => a.executionOrder - b.executionOrder);

  return { success: true, data: items };
}

/* ── getChecklistTemplatesByPohType ──────────────────────── */

/**
 * Fetch checklist templates for a given POH type (reference/read-only mode).
 */
export async function getChecklistTemplatesByPohType(
  pohType: string,
): Promise<Result<{
  items: {
    id: string;
    itemCode: string;
    description: string;
    category: string;
    rdsoSmiReference: string;
    isMandatory: boolean;
    executionOrder: number;
  }[];
}>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('checklist_templates')
    .select('id, item_code, description, category, rdso_smi_reference, is_mandatory, execution_order')
    .eq('poh_type', pohType)
    .order('execution_order');

  if (error) return { success: false, error: error.message };

  const items = (data ?? []).map((t) => ({
    id: t.id,
    itemCode: t.item_code,
    description: t.description,
    category: t.category,
    rdsoSmiReference: t.rdso_smi_reference,
    isMandatory: t.is_mandatory,
    executionOrder: t.execution_order,
  }));

  return { success: true, data: { items } };
}

/* ── getChecklistComplianceReport ────────────────────────── */

/**
 * Aggregate checklist completion stats across coaches at a shed.
 */
export async function getChecklistComplianceReport(
  shedId: string,
  filters?: ComplianceFilters,
): Promise<Result<ChecklistComplianceEntry[]>> {
  const supabase = await createClient();

  // Build query for active rakes at the shed
  let rakeQuery = supabase
    .from('rakes')
    .select('id, rake_number, rake_type, poh_type, shed_id, sheds!inner(name)')
    .eq('status', 'Active');

  if (shedId && shedId !== 'all') {
    rakeQuery = rakeQuery.eq('shed_id', shedId);
  }
  if (filters?.pohType) {
    rakeQuery = rakeQuery.eq('poh_type', filters.pohType);
  }
  if (filters?.rakeType) {
    rakeQuery = rakeQuery.eq('rake_type', filters.rakeType);
  }

  const { data: rakes, error: rakeError } = await rakeQuery;
  if (rakeError) return { success: false, error: rakeError.message };
  if (!rakes || rakes.length === 0) return { success: true, data: [] };

  const rakeIds = rakes.map((r) => r.id);

  // Fetch coaches for these rakes
  const { data: coaches, error: coachError } = await supabase
    .from('coaches')
    .select('id, coach_number, rake_id')
    .in('rake_id', rakeIds);

  if (coachError) return { success: false, error: coachError.message };
  if (!coaches || coaches.length === 0) return { success: true, data: [] };

  const coachIds = coaches.map((c) => c.id);

  // Fetch all checklist items for these coaches with mandatory flag
  const { data: checklistData, error: clError } = await supabase
    .from('coach_checklist_items')
    .select(`
      id, coach_id, status,
      template:template_id ( is_mandatory )
    `)
    .in('coach_id', coachIds);

  if (clError) return { success: false, error: clError.message };

  // Build a map of rake info
  const rakeMap = new Map(rakes.map((r) => [
    r.id,
    {
      rakeNumber: r.rake_number,
      pohType: r.poh_type,
      shedId: r.shed_id,
      shedName: (r.sheds as unknown as { name: string })?.name ?? '',
    },
  ]));

  // Build a map of coach → rake
  const coachRakeMap = new Map(coaches.map((c) => [c.id, { coachNumber: c.coach_number, rakeId: c.rake_id }]));

  // Aggregate per coach
  const coachStats = new Map<string, {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    mandatoryTotal: number;
    mandatoryCompleted: number;
  }>();

  for (const item of checklistData ?? []) {
    const stats = coachStats.get(item.coach_id) ?? {
      total: 0, completed: 0, inProgress: 0, notStarted: 0,
      mandatoryTotal: 0, mandatoryCompleted: 0,
    };

    stats.total++;
    if (item.status === 'Completed') stats.completed++;
    else if (item.status === 'In Progress') stats.inProgress++;
    else stats.notStarted++;

    const tmpl = item.template as unknown as { is_mandatory: boolean } | null;
    if (tmpl?.is_mandatory) {
      stats.mandatoryTotal++;
      if (item.status === 'Completed') stats.mandatoryCompleted++;
    }

    coachStats.set(item.coach_id, stats);
  }

  // Build result entries
  const entries: ChecklistComplianceEntry[] = [];
  for (const [coachId, stats] of coachStats) {
    const coachInfo = coachRakeMap.get(coachId);
    if (!coachInfo) continue;
    const rakeInfo = rakeMap.get(coachInfo.rakeId);
    if (!rakeInfo) continue;

    entries.push({
      shedId: rakeInfo.shedId,
      shedName: rakeInfo.shedName,
      rakeId: coachInfo.rakeId,
      rakeNumber: rakeInfo.rakeNumber,
      pohType: rakeInfo.pohType,
      coachId,
      coachNumber: coachInfo.coachNumber,
      totalItems: stats.total,
      completedItems: stats.completed,
      inProgressItems: stats.inProgress,
      notStartedItems: stats.notStarted,
      mandatoryTotal: stats.mandatoryTotal,
      mandatoryCompleted: stats.mandatoryCompleted,
      completionPct: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      mandatoryCompliancePct: stats.mandatoryTotal > 0
        ? Math.round((stats.mandatoryCompleted / stats.mandatoryTotal) * 100)
        : 100,
    });
  }

  // Sort by completion percentage ascending (least complete first)
  entries.sort((a, b) => a.completionPct - b.completionPct);

  return { success: true, data: entries };
}
