'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Calendar,
  Filter,
  ArrowUpDown,
  Train,
  Package,
} from 'lucide-react';
import { useShed } from '@/lib/shed-context';
import { getMissingPartsReport, type MissingPartEntry, type MissingPartsFilters } from '@/lib/actions/parts';
import { PART_NAMES } from '@/lib/constants';
import { Card, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { ExportButtons } from '@/components/reports/export-buttons';
import { formatDateIST } from '@/lib/utils/date';
import { DotsLoader } from '@/components/ui/dots-loader';

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export default function MissingPartsReportPage() {
  const { selectedShedId } = useShed();
  const [entries, setEntries] = useState<MissingPartEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [partNameFilter, setPartNameFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<MissingPartsFilters['sortBy']>('expected_arrival_date');
  const [sortOrder, setSortOrder] = useState<MissingPartsFilters['sortOrder']>('asc');

  const fetchData = () => {
    startTransition(async () => {
      setError(null);
      const filters: MissingPartsFilters = {
        sortBy,
        sortOrder,
      };
      if (partNameFilter) filters.partName = partNameFilter;

      const result = await getMissingPartsReport(selectedShedId, filters);
      if (result.success) {
        setEntries(result.data);
      } else {
        setError(result.error);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShedId, partNameFilter, sortBy, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  const partNameOptions = [
    { value: '', label: 'All Parts' },
    ...PART_NAMES.map((name) => ({ value: name, label: name })),
  ];

  const sortOptions = [
    { value: 'expected_arrival_date', label: 'Expected Arrival' },
    { value: 'status_updated_at', label: 'Last Updated' },
    { value: 'part_name', label: 'Part Name' },
  ];

  const overdueCount = entries.filter((e) => isOverdue(e.expectedArrivalDate)).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Missing Parts Report</h1>
          <p className="mt-1 text-sm text-gray-500">
            All parts with Missing/Pending status across active rakes
          </p>
        </div>
        <ExportButtons
          data={entries.map((e) => ({
            coachNumber: e.coachNumber,
            rakeNumber: e.rakeNumber,
            partName: e.partName,
            notes: e.notes,
            expectedArrivalDate: e.expectedArrivalDate ? formatDateIST(e.expectedArrivalDate) : '—',
          }))}
          reportType="missing-parts"
          disabled={loading || isPending}
        />
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardBody className="flex items-center gap-3 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100">
              <Package className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Missing</p>
              <p className="text-lg font-bold text-gray-900">{entries.length}</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Overdue</p>
              <p className="text-lg font-bold text-gray-900">{overdueCount}</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
              <Train className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Rakes Affected</p>
              <p className="text-lg font-bold text-gray-900">
                {new Set(entries.map((e) => e.rakeId)).size}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="flex flex-col gap-2 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Filter className="h-4 w-4" />
            <span>Filters:</span>
          </div>
          <Select
            options={partNameOptions}
            value={partNameFilter}
            onChange={(e) => setPartNameFilter(e.target.value)}
            className="w-full sm:w-48 text-sm"
          />
          <Select
            options={sortOptions}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as MissingPartsFilters['sortBy'])}
            className="w-full sm:w-44 text-sm"
          />
          <button
            onClick={toggleSortOrder}
            className="flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-50 min-h-[44px] sm:min-h-0"
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {sortOrder === 'asc' ? 'Asc' : 'Desc'}
          </button>
        </CardBody>
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {(loading || isPending) && (
        <div className="flex h-32 items-center justify-center">
          <DotsLoader size="lg" color="blue" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !isPending && entries.length === 0 && !error && (
        <Card>
          <CardBody className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">No missing parts found</p>
            <p className="mt-1 text-xs text-gray-400">
              All parts across active rakes are accounted for
            </p>
          </CardBody>
        </Card>
      )}

      {/* Results table */}
      {!loading && !isPending && entries.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Part</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Coach</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Rake</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Notes</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Expected Arrival</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry) => {
                const overdue = isOverdue(entry.expectedArrivalDate);
                return (
                  <tr key={entry.partId} className={overdue ? 'bg-red-50/40' : ''}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-500" />
                        <span className="font-medium text-gray-900">{entry.partName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/rakes/${entry.rakeId}/coaches/${entry.coachId}`}
                        className="font-mono text-blue-600 hover:underline"
                      >
                        {entry.coachNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <Link
                          href={`/rakes/${entry.rakeId}`}
                          className="text-blue-600 hover:underline"
                        >
                          {entry.rakeNumber}
                        </Link>
                        <div className="flex gap-1">
                          <Badge variant="info" size="sm">{entry.rakeType}</Badge>
                          <Badge variant="purple" size="sm">{entry.pohType}</Badge>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <p className="truncate text-gray-600" title={entry.notes ?? ''}>
                        {entry.notes || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        <span className={overdue ? 'font-medium text-red-600' : 'text-gray-700'}>
                          {formatDateIST(entry.expectedArrivalDate)}
                        </span>
                        {overdue && (
                          <Badge variant="danger" size="sm">Overdue</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDateIST(entry.statusUpdatedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
