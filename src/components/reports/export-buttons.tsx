'use client';

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, FileDown, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  exportReport,
  getDefaultColumns,
  type ExportFormat,
  type ReportType,
  type ExportColumn,
  type ExportOptions,
} from '@/lib/utils/export';

interface ExportButtonsProps {
  data: unknown[];
  reportType: ReportType;
  title?: string;
  filename?: string;
  disabled?: boolean;
}

const FORMAT_CONFIG: { format: ExportFormat; label: string; icon: typeof FileText }[] = [
  { format: 'pdf', label: 'PDF', icon: FileText },
  { format: 'excel', label: 'Excel', icon: FileSpreadsheet },
  { format: 'csv', label: 'CSV', icon: FileDown },
];

export function ExportButtons({ data, reportType, title, filename, disabled }: ExportButtonsProps) {
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [columns, setColumns] = useState<ExportColumn[]>(() => getDefaultColumns(reportType));
  const [exporting, setExporting] = useState(false);

  const toggleColumn = (key: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.key === key ? { ...c, selected: !c.selected } : c)),
    );
  };

  const handleExport = async (format: ExportFormat) => {
    if (!data.length || exporting) return;
    setExporting(true);
    try {
      const options: ExportOptions = { title, filename, columns };
      exportReport(data, reportType, format, options);
    } finally {
      setTimeout(() => setExporting(false), 500);
    }
  };

  const hasData = data.length > 0;

  return (
    <div className="relative flex flex-wrap items-center gap-2">
      {FORMAT_CONFIG.map(({ format, label, icon: Icon }) => (
        <Button
          key={format}
          variant="secondary"
          size="sm"
          disabled={disabled || !hasData || exporting}
          onClick={() => handleExport(format)}
          className="gap-1.5"
        >
          <Icon className="h-3.5 w-3.5" />
          {label}
        </Button>
      ))}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowFieldPicker(!showFieldPicker)}
        disabled={disabled || !hasData}
        className="gap-1"
      >
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFieldPicker ? 'rotate-180' : ''}`} />
        Fields
      </Button>

      {showFieldPicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowFieldPicker(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            <p className="px-3 py-1.5 text-xs font-medium text-gray-500">Include in export:</p>
            {columns.map((col) => (
              <button
                key={col.key}
                onClick={() => toggleColumn(col.key)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded border ${
                    col.selected !== false
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-300'
                  }`}
                >
                  {col.selected !== false && <Check className="h-3 w-3" />}
                </span>
                {col.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
