'use client';

import { Filter } from 'lucide-react';
import { Select } from '@/components/ui/select';
import { useShed } from '@/lib/shed-context';
import type { ReportFilters } from '@/lib/queries/reports';

interface ReportFiltersBarProps {
  filters: ReportFilters;
  onChange: (filters: ReportFilters) => void;
  showDateRange?: boolean;
}

const rakeTypeOptions = [
  { value: 'all', label: 'All Rake Types' },
  { value: 'EMU', label: 'EMU' },
  { value: 'MEMU', label: 'MEMU' },
];

const pohTypeOptions = [
  { value: 'all', label: 'All POH Types' },
  { value: '1st POH', label: '1st POH' },
  { value: '2nd POH', label: '2nd POH' },
  { value: '3rd POH', label: '3rd POH' },
  { value: '4th POH', label: '4th POH' },
];

export function ReportFiltersBar({ filters, onChange, showDateRange = true }: ReportFiltersBarProps) {
  const { sheds } = useShed();

  const shedOptions = [
    { value: 'all', label: 'All Sheds' },
    ...sheds.map((s) => ({ value: s.id, label: s.name })),
  ];

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="flex items-center gap-1.5 text-sm text-gray-500">
        <Filter className="h-4 w-4" />
        <span>Filters:</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
      <Select
        options={shedOptions}
        value={filters.shedId}
        onChange={(e) => onChange({ ...filters, shedId: e.target.value })}
        className="w-full sm:w-44 text-sm"
      />
      <Select
        options={rakeTypeOptions}
        value={filters.rakeType ?? 'all'}
        onChange={(e) => onChange({ ...filters, rakeType: e.target.value as ReportFilters['rakeType'] })}
        className="w-full sm:w-36 text-sm"
      />
      <Select
        options={pohTypeOptions}
        value={filters.pohType ?? 'all'}
        onChange={(e) => onChange({ ...filters, pohType: e.target.value as ReportFilters['pohType'] })}
        className="w-full sm:w-36 text-sm"
      />
      {showDateRange && (
        <>
          <input
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={(e) => onChange({ ...filters, dateFrom: e.target.value || undefined })}
            className="rounded-md border border-gray-300 px-2.5 py-1.5 text-sm min-h-[44px] sm:min-h-0"
            placeholder="From"
          />
          <input
            type="date"
            value={filters.dateTo ?? ''}
            onChange={(e) => onChange({ ...filters, dateTo: e.target.value || undefined })}
            className="rounded-md border border-gray-300 px-2.5 py-1.5 text-sm min-h-[44px] sm:min-h-0"
            placeholder="To"
          />
        </>
      )}
      </div>
    </div>
  );
}
