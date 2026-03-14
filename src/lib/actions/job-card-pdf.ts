'use server';

import { createClient } from '@/lib/supabase/server';
import type { Result, CoachType } from '@/types';
import { PDF_SECTION_ORDER, SECTION_COACH_TYPE_APPLICABILITY } from '@/lib/constants';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export a complete Job Card as a PDF for a given coach.
 * Returns the PDF as a base64-encoded string.
 *
 * Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6
 */
export async function exportJobCardPDF(coachId: string): Promise<Result<string>> {
  if (!coachId) {
    return { success: false, error: 'Coach ID is required' };
  }

  const supabase = await createClient();

  // Authenticate user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // ── Fetch coach + rake metadata ──
  const { data: coach, error: coachError } = await supabase
    .from('coaches')
    .select('id, coach_number, coach_type, rake_id, rakes(rake_number, rake_type, poh_type, sheds(name))')
    .eq('id', coachId)
    .single();

  if (coachError || !coach) {
    return { success: false, error: 'Coach not found' };
  }

  const coachNumber: string = coach.coach_number;
  const coachType = ((coach as any).coach_type ?? 'MC') as CoachType;
  const rake = (coach as any).rakes;
  const rakeNumber: string = rake?.rake_number ?? 'N/A';
  const rakeType: string = rake?.rake_type ?? 'N/A';
  const pohCycle: string = rake?.poh_type ?? '1st POH';
  const shedName: string = rake?.sheds?.name ?? 'EMU Car Shed, Ghaziabad';

  // ── Fetch section progress from view ──
  const { data: progressData } = await supabase
    .from('v_coach_section_progress')
    .select('*')
    .eq('coach_id', coachId);

  const progressMap = new Map(
    (progressData ?? []).map((p: any) => [p.section_code as string, p])
  );

  // ── Fetch all workshop sections ──
  const { data: allSections } = await supabase
    .from('workshop_sections')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  const sectionIdMap = new Map(
    (allSections ?? []).map((s: any) => [s.section_code as string, s])
  );

  // ── Determine applicable sections for this coach type ──
  const applicableSections = PDF_SECTION_ORDER.filter(
    (code) => SECTION_COACH_TYPE_APPLICABILITY[code]?.includes(coachType) ?? false
  );

  // ── Fetch work items, must change items, and test instances for all applicable sections ──
  const sectionIds = applicableSections
    .map((code) => sectionIdMap.get(code)?.id)
    .filter(Boolean) as string[];

  const [workItemsRes, mustChangeRes, testsRes] = await Promise.all([
    supabase
      .from('section_work_items')
      .select('*, work_instructions(wi_number, version_number, rake_type)')
      .eq('coach_id', coachId)
      .in('section_id', sectionIds),
    supabase
      .from('must_change_item_instances')
      .select('*, must_change_item_templates(item_name, description)')
      .eq('coach_id', coachId)
      .in('section_id', sectionIds),
    supabase
      .from('section_test_instances')
      .select('*, section_test_templates(test_name, test_description)')
      .eq('coach_id', coachId)
      .in('section_id', sectionIds),
  ]);

  // Group data by section_id
  const workItemsBySection = groupBy(workItemsRes.data ?? [], 'section_id');
  const mustChangeBySection = groupBy(mustChangeRes.data ?? [], 'section_id');
  const testsBySection = groupBy(testsRes.data ?? [], 'section_id');

  // ── Generate PDF ──
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const generatedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  // ── Header Page ──
  addHeader(doc, pageWidth, margin, {
    coachNumber,
    rakeNumber,
    coachType,
    rakeType,
    pohCycle,
    shedName,
    generatedAt,
  });

  // ── Summary Page ──
  // Calculate overall completion
  let totalCompleted = 0;
  let totalItems = 0;
  const sectionSummaryRows: string[][] = [];
  let mustChangeTotal = 0;
  let mustChangeReplaced = 0;

  for (const code of applicableSections) {
    const progress = progressMap.get(code);
    const completed = progress ? Number(progress.completed_work_items) : 0;
    const total = progress ? Number(progress.total_work_items) : 0;
    const pct = progress ? Number(progress.progress_pct) : 0;
    const mcTotal = progress ? Number(progress.must_change_total) : 0;
    const mcReplaced = progress ? Number(progress.must_change_replaced) : 0;

    totalCompleted += completed;
    totalItems += total;
    mustChangeTotal += mcTotal;
    mustChangeReplaced += mcReplaced;

    const sectionMeta = sectionIdMap.get(code);
    sectionSummaryRows.push([
      code,
      sectionMeta?.name_english ?? code,
      `${pct}%`,
      `${completed}/${total}`,
      `${mcReplaced}/${mcTotal}`,
    ]);
  }

  const overallPct = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  let y = (doc as any).lastAutoTable?.finalY ?? 70;
  y += 10;
  doc.text('Summary', margin, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Overall Completion: ${overallPct}%`, margin, y);
  y += 6;
  doc.text(`Must Change Items: ${mustChangeReplaced}/${mustChangeTotal} replaced`, margin, y);
  y += 8;

  // Section-wise progress table
  autoTable(doc, {
    startY: y,
    head: [['Section', 'Name', 'Progress', 'Work Items', 'Must Change']],
    body: sectionSummaryRows,
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
  });

  // ── Section Detail Pages ──
  for (const code of applicableSections) {
    const sectionMeta = sectionIdMap.get(code);
    if (!sectionMeta) continue;

    const sectionId: string = sectionMeta.id;
    const sectionWorkItems = workItemsBySection.get(sectionId) ?? [];
    const sectionMustChange = mustChangeBySection.get(sectionId) ?? [];
    const sectionTests = testsBySection.get(sectionId) ?? [];

    // New page for each section
    doc.addPage();
    let sy = margin;

    // Section header
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(`${code} — ${sectionMeta.name_english}`, margin, sy);
    sy += 6;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(sectionMeta.name_hindi ?? '', margin, sy);
    sy += 8;

    // Work Items table
    if (sectionWorkItems.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Work Items', margin, sy);
      sy += 2;

      const wiRows = sectionWorkItems.map((wi: any) => [
        wi.work_instructions?.wi_number ?? '',
        wi.status ?? 'Not Started',
        wi.completion_date ? new Date(wi.completion_date).toLocaleDateString('en-IN') : '-',
      ]);

      autoTable(doc, {
        startY: sy,
        head: [['WI Number', 'Status', 'Completion Date']],
        body: wiRows,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8 },
        headStyles: { fillColor: [52, 152, 219] },
      });

      sy = (doc as any).lastAutoTable?.finalY ?? sy;
      sy += 6;
    }

    // Must Change Items table
    if (sectionMustChange.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Must Change Items', margin, sy);
      sy += 2;

      const mcRows = sectionMustChange.map((mc: any) => [
        mc.must_change_item_templates?.item_name ?? '',
        mc.is_replaced ? 'Yes' : 'No',
        mc.old_part_detail ?? '-',
        mc.new_part_detail ?? '-',
      ]);

      autoTable(doc, {
        startY: sy,
        head: [['Item Name', 'Replaced', 'Old Part', 'New Part']],
        body: mcRows,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8 },
        headStyles: { fillColor: [230, 126, 34] },
      });

      sy = (doc as any).lastAutoTable?.finalY ?? sy;
      sy += 6;
    }

    // Test Results table
    if (sectionTests.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Test Results', margin, sy);
      sy += 2;

      const testRows = sectionTests.map((t: any) => [
        t.section_test_templates?.test_name ?? '',
        t.status ?? 'Not Started',
        t.measured_values ?? '-',
        t.passed === true ? 'Pass' : t.passed === false ? 'Fail' : '-',
      ]);

      autoTable(doc, {
        startY: sy,
        head: [['Test Name', 'Status', 'Measured Values', 'Result']],
        body: testRows,
        margin: { left: margin, right: margin },
        styles: { fontSize: 8 },
        headStyles: { fillColor: [39, 174, 96] },
      });
    }
  }

  // Return PDF as base64
  const pdfBase64 = doc.output('datauristring').split(',')[1] ?? doc.output('datauristring');
  return { success: true, data: pdfBase64 };
}

// ── Helper: Add PDF header with coach/rake metadata ──
function addHeader(
  doc: jsPDF,
  pageWidth: number,
  margin: number,
  meta: {
    coachNumber: string;
    rakeNumber: string;
    coachType: string;
    rakeType: string;
    pohCycle: string;
    shedName: string;
    generatedAt: string;
  }
) {
  let y = margin;

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Job Card', pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(meta.shedName, pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Metadata table
  autoTable(doc, {
    startY: y,
    body: [
      ['Coach Number', meta.coachNumber, 'Rake Number', meta.rakeNumber],
      ['Coach Type', meta.coachType, 'Rake Type', meta.rakeType],
      ['POH Cycle', meta.pohCycle, 'Generated', meta.generatedAt],
    ],
    margin: { left: margin, right: margin },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35 },
      1: { cellWidth: 55 },
      2: { fontStyle: 'bold', cellWidth: 35 },
      3: { cellWidth: 55 },
    },
    theme: 'grid',
  });
}

// ── Helper: Group array by key ──
function groupBy<T extends Record<string, any>>(arr: T[], key: string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of arr) {
    const k = item[key] as string;
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(item);
  }
  return map;
}
