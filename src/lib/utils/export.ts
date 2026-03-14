'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatDateIST, formatTimeIST } from '@/lib/utils/date';

/* ── Types ───────────────────────────────────────────────── */

export type ExportFormat = 'pdf' | 'excel' | 'csv';

export type ReportType =
  | 'poh-performance'
  | 'stage-performance'
  | 'parts-management'
  | 'timeline-performance'
  | 'checklist-compliance'
  | 'missing-parts'
  | 'rake-detail';

export interface ExportColumn {
  key: string;
  label: string;
  selected?: boolean;
}

export interface ExportOptions {
  title?: string;
  columns?: ExportColumn[];
  filename?: string;
}

/* ── Helpers ─────────────────────────────────────────────── */

function getFilename(reportType: ReportType, format: ExportFormat, custom?: string): string {
  const base = custom ?? reportType;
  const date = formatDateIST(new Date()).replace(/\//g, '-');
  const ext = format === 'excel' ? 'xlsx' : format;
  return `${base}_${date}.${ext}`;
}

function filterColumns(
  data: Record<string, unknown>[],
  columns?: ExportColumn[],
): { headers: string[]; keys: string[]; rows: unknown[][] } {
  if (!data.length) return { headers: [], keys: [], rows: [] };

  const selected = columns?.filter((c) => c.selected !== false);
  const keys = selected?.map((c) => c.key) ?? Object.keys(data[0]);
  const headers = selected?.map((c) => c.label) ?? keys;

  const rows = data.map((row) => keys.map((k) => row[k] ?? ''));
  return { headers, keys, rows };
}

function flattenData(data: unknown[]): Record<string, unknown>[] {
  return data.map((item) => {
    if (typeof item !== 'object' || item === null) return { value: item };
    const flat: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(item as Record<string, unknown>)) {
      if (Array.isArray(val)) {
        flat[key] = val.map((v) => (typeof v === 'object' ? JSON.stringify(v) : v)).join('; ');
      } else if (typeof val === 'object' && val !== null) {
        for (const [subKey, subVal] of Object.entries(val as Record<string, unknown>)) {
          flat[`${key}_${subKey}`] = subVal;
        }
      } else {
        flat[key] = val;
      }
    }
    return flat;
  });
}


/* ── Report title map ────────────────────────────────────── */

const REPORT_TITLES: Record<ReportType, string> = {
  'poh-performance': 'POH Type Performance Report',
  'stage-performance': 'Stage Performance Report',
  'parts-management': 'Parts Management Report',
  'timeline-performance': 'Timeline Performance Report',
  'checklist-compliance': 'Checklist Compliance Report',
  'missing-parts': 'Missing Parts Report',
  'rake-detail': 'Rake Detail Export',
};

/* ── PDF Export ───────────────────────────────────────────── */

export function exportToPDF(
  data: unknown[],
  reportType: ReportType,
  options?: ExportOptions,
): void {
  const flat = flattenData(data);
  const { headers, rows } = filterColumns(flat, options?.columns);
  const title = options?.title ?? REPORT_TITLES[reportType];

  const doc = new jsPDF({ orientation: headers.length > 5 ? 'landscape' : 'portrait' });

  // Title
  doc.setFontSize(16);
  doc.setTextColor(31, 41, 55);
  doc.text(title, 14, 18);

  // Subtitle with date
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated: ${formatDateIST(new Date())} ${formatTimeIST(new Date())} IST`, 14, 25);

  // Table
  if (rows.length > 0) {
    autoTable(doc, {
      startY: 32,
      head: [headers],
      body: rows.map((r) => r.map((v) => String(v ?? ''))),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(156, 163, 175);
    doc.text('No data available for the selected filters.', 14, 40);
  }

  // Footer
  const pageCount = (doc as any).getNumberOfPages() as number;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Railway POH Management System — Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'center' },
    );
  }

  doc.save(getFilename(reportType, 'pdf', options?.filename));
}

/* ── Excel Export ─────────────────────────────────────────── */

export function exportToExcel(
  data: unknown[],
  reportType: ReportType,
  options?: ExportOptions,
): void {
  const flat = flattenData(data);
  const { headers, rows } = filterColumns(flat, options?.columns);
  const title = options?.title ?? REPORT_TITLES[reportType];

  const wb = XLSX.utils.book_new();

  // Data sheet
  const wsData = [headers, ...rows.map((r) => r.map((v) => (v ?? '')))];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = headers.map((h) => ({
    wch: Math.max(h.length + 2, 14),
  }));

  XLSX.utils.book_append_sheet(wb, ws, title.slice(0, 31));

  XLSX.writeFile(wb, getFilename(reportType, 'excel', options?.filename));
}

/* ── CSV Export ───────────────────────────────────────────── */

export function exportToCSV(
  data: unknown[],
  reportType: ReportType,
  options?: ExportOptions,
): void {
  const flat = flattenData(data);
  const { headers, rows } = filterColumns(flat, options?.columns);

  const wb = XLSX.utils.book_new();
  const wsData = [headers, ...rows.map((r) => r.map((v) => (v ?? '')))];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Data');

  XLSX.writeFile(wb, getFilename(reportType, 'csv', options?.filename), { bookType: 'csv' });
}

/* ── Unified export function ─────────────────────────────── */

export function exportReport(
  data: unknown[],
  reportType: ReportType,
  format: ExportFormat,
  options?: ExportOptions,
): void {
  switch (format) {
    case 'pdf':
      exportToPDF(data, reportType, options);
      break;
    case 'excel':
      exportToExcel(data, reportType, options);
      break;
    case 'csv':
      exportToCSV(data, reportType, options);
      break;
  }
}

/* ── Column definitions per report type ──────────────────── */

export function getDefaultColumns(reportType: ReportType): ExportColumn[] {
  switch (reportType) {
    case 'poh-performance':
      return [
        { key: 'pohType', label: 'POH Type', selected: true },
        { key: 'avgCompletionDays', label: 'Avg Completion (days)', selected: true },
        { key: 'onTimePct', label: 'On-Time %', selected: true },
        { key: 'avgDelayDays', label: 'Avg Delay (days)', selected: true },
        { key: 'totalRakes', label: 'Total Rakes', selected: true },
        { key: 'stageDurations', label: 'Stage Durations', selected: false },
      ];
    case 'stage-performance':
      return [
        { key: 'stage', label: 'Stage', selected: true },
        { key: 'avgDuration', label: 'Avg Duration (days)', selected: true },
        { key: 'onTimePct', label: 'On-Time %', selected: true },
        { key: 'totalCompleted', label: 'Total Completed', selected: true },
      ];
    case 'parts-management':
      return [
        { key: 'partName', label: 'Part Name', selected: true },
        { key: 'missingCount', label: 'Missing Count', selected: true },
        { key: 'avgDelayDays', label: 'Avg Delay (days)', selected: true },
        { key: 'affectedCoaches', label: 'Affected Coaches', selected: true },
      ];
    case 'timeline-performance':
      return [
        { key: 'status', label: 'Status', selected: true },
        { key: 'count', label: 'Count', selected: true },
        { key: 'percentage', label: 'Percentage', selected: true },
      ];
    case 'checklist-compliance':
      return [
        { key: 'pohType', label: 'POH Type', selected: true },
        { key: 'avgCompletionPct', label: 'Avg Completion %', selected: true },
        { key: 'mandatoryCompliancePct', label: 'Mandatory Compliance %', selected: true },
        { key: 'totalCoaches', label: 'Total Coaches', selected: true },
      ];
    case 'missing-parts':
      return [
        { key: 'coachNumber', label: 'Coach Number', selected: true },
        { key: 'rakeNumber', label: 'Rake Number', selected: true },
        { key: 'partName', label: 'Part Name', selected: true },
        { key: 'notes', label: 'Notes', selected: true },
        { key: 'expectedArrivalDate', label: 'Expected Arrival', selected: true },
      ];
    case 'rake-detail':
      return [
        { key: 'coachNumber', label: 'Coach Number', selected: true },
        { key: 'currentStage', label: 'Current Stage', selected: true },
        { key: 'timelineStatus', label: 'Timeline Status', selected: true },
        { key: 'missingPartsCount', label: 'Missing Parts', selected: true },
        { key: 'checklistCompletion', label: 'Checklist %', selected: true },
        { key: 'elapsedDaysInStage', label: 'Days in Stage', selected: true },
        { key: 'completionPercentage', label: 'Completion %', selected: true },
      ];
    default:
      return [];
  }
}
