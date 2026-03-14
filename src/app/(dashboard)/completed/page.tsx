'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Search,
  Calendar,
  Train,
  Clock,
  Users,
  Filter,
  ChevronDown,
  ChevronUp,
  BarChart3,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExportButtons } from '@/components/reports/export-buttons';
import { useShed } from '@/lib/shed-context';
import {
  getCompletedRakes,
  getCompletedRakeDetail,
  type CompletedRakeRow,
  type CompletedRakeFilters,
  type CompletedRakeDetail,
} from '@/lib/actions/rake-completion';
import { TARGET_DURATIONS } from '@/lib/constants';
import { formatDateIST } from '@/lib/utils/date';

export default function CompletedRakesPage() {
  const { selectedShedId, sheds } = useShed();
  const [rakes, setRakes] = useState<CompletedRakeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<CompletedRakeFilters>({});
  const [expandedRakeId, setExpandedRakeId] = useState<string | null>(null);
  const [rakeDetail, setRakeDetail] = useState<CompletedRakeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchRakes = useCallback(async () => {
    setLoading(true);
    const data = await getCompletedRakes(selectedShedId, {
      ...filters,
      search: search || undefined,
    });
    setRakes(data);
    setLoading(false);
  }, [selectedShedId, filters, search]);

  useEffect(() => {
    fetchRakes();
  }, [fetchRakes]);

  const handleSearch = () => {
    fetchRakes();
  };

  const handleExpandRake = async (rakeId: string) => {
    if (expandedRakeId === rakeId) {
      setExpandedRakeId(null);
      setRakeDetail(null);
      return;
    }
    setExpandedRakeId(rakeId);
    setDetailLoading(true);
    const detail = await getCompletedRakeDetail(rakeId);
    setRakeDetail(detail);
    setDetailLoading(false);
  };

  const clearFilters = () => {
    setFilters({});
    setSearch('');
  };

  const hasActiveFilters = filters.rakeType || filters.pohType || filters.dateFrom || filters.dateTo || filters.shedId;

  // Prepare export data
  const exportData = rakes.map((r) => ({
    rakeNumber: r.rakeNumber,
    rakeType: r.rakeType,
    pohType: r.pohType,
    shed: r.shedName,
    intakeDate: formatDateIST(r.intakeDate),
    completionDate: formatDateIST(r.completionDate),
    totalDurationDays: r.totalDurationDays,
    totalCoaches: r.totalCoaches,
  }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Completed Rakes</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Historical POH records — {rakes.length} completed rake{rakes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <ExportButtons
          data={exportData}
          reportType="rake-detail"
          title="Completed Rakes Report"
          filename="completed-rakes"
          disabled={rakes.length === 0}
        />
      </div>

      {/* Search & Filter Bar */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by rake number or coach number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">
                !
              </span>
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-gray-500">
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-3 grid grid-cols-1 gap-3 border-t border-gray-100 pt-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Completion Date From</label>
              <input
                type="date"
                value={filters.dateFrom ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value || undefined }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Completion Date To</label>
              <input
                type="date"
                value={filters.dateTo ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value || undefined }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Rake Type</label>
              <select
                value={filters.rakeType ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, rakeType: e.target.value || undefined }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">All Types</option>
                <option value="EMU">EMU</option>
                <option value="MEMU">MEMU</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">POH Type</label>
              <select
                value={filters.pohType ?? ''}
                onChange={(e) => setFilters((f) => ({ ...f, pohType: e.target.value || undefined }))}
                className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">All POH Types</option>
                <option value="1st POH">1st POH</option>
                <option value="2nd POH">2nd POH</option>
                <option value="3rd POH">3rd POH</option>
                <option value="4th POH">4th POH</option>
              </select>
            </div>
            {selectedShedId === 'all' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">Shed Location</label>
                <select
                  value={filters.shedId ?? ''}
                  onChange={(e) => setFilters((f) => ({ ...f, shedId: e.target.value || undefined }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">All Sheds</option>
                  {sheds.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rakes List */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : rakes.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50">
          <CheckCircle2 className="mb-2 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-400">No completed rakes found</p>
          {hasActiveFilters && (
            <button onClick={clearFilters} className="mt-1 text-xs text-blue-500 hover:underline">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {rakes.map((rake) => (
            <div key={rake.id} className="rounded-lg border border-gray-200 bg-white">
              {/* Rake Row */}
              <button
                onClick={() => handleExpandRake(rake.id)}
                className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-gray-900">{rake.rakeNumber}</span>
                    <Badge variant="gray" className="text-xs">{rake.rakeType}</Badge>
                    <Badge variant="gray" className="text-xs">{rake.pohType}</Badge>
                    <span className="text-xs text-gray-400">{rake.shedName}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Intake: {formatDateIST(rake.intakeDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      Completed: {formatDateIST(rake.completionDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {rake.totalDurationDays} days
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {rake.totalCoaches} coaches
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/rakes/${rake.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-md px-2 py-1 text-xs text-blue-600 hover:bg-blue-50"
                  >
                    View Detail
                  </Link>
                  {expandedRakeId === rake.id ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Expanded Comparison View */}
              {expandedRakeId === rake.id && (
                <div className="border-t border-gray-100 px-4 py-3">
                  {detailLoading ? (
                    <div className="flex h-20 items-center justify-center">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    </div>
                  ) : rakeDetail ? (
                    <ComparisonView detail={rakeDetail} />
                  ) : (
                    <p className="text-sm text-gray-400">Unable to load details</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


/* ── Comparison View: Actual vs Target Timelines ─────────── */

function ComparisonView({ detail }: { detail: CompletedRakeDetail }) {
  const stages = ['Intake', 'Dismantling', 'Inspection', 'Reassembly', 'Finishing', 'Testing', 'Trial', 'Release'] as const;

  // Calculate average actual duration per stage across all coaches
  const stageAverages = stages.map((stage) => {
    const durations: number[] = [];
    detail.coaches.forEach((coach) => {
      const entry = coach.stageHistory.find((h) => h.stage === stage);
      if (entry?.actualDurationDays != null) {
        durations.push(entry.actualDurationDays);
      }
    });
    const avg = durations.length > 0
      ? Math.round((durations.reduce((s, d) => s + d, 0) / durations.length) * 10) / 10
      : null;
    const target = TARGET_DURATIONS[stage];
    return { stage, avg, target };
  });

  const totalTarget = Object.values(TARGET_DURATIONS).reduce((s, d) => s + d, 0);
  const maxDuration = Math.max(
    ...stageAverages.map((s) => Math.max(s.avg ?? 0, s.target)),
    1,
  );

  const statusColor = (actual: number | null, target: number) => {
    if (actual == null) return 'bg-gray-200';
    if (actual <= target) return 'bg-green-500';
    if (actual <= target + 2) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-gray-500" />
        <h3 className="text-sm font-medium text-gray-700">Actual vs Target Timeline</h3>
        <span className="text-xs text-gray-400">
          (Target: {totalTarget} days | Actual: {detail.totalDurationDays} days)
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-blue-200" /> Target
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-green-500" /> On Schedule
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-yellow-500" /> Minor Delay
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-500" /> Significant Delay
        </span>
      </div>

      {/* Bar Chart */}
      <div className="space-y-2">
        {stageAverages.map(({ stage, avg, target }) => (
          <div key={stage} className="flex items-center gap-3">
            <span className="w-24 text-right text-xs text-gray-600 flex-shrink-0">{stage}</span>
            <div className="flex-1 space-y-0.5">
              {/* Target bar */}
              <div className="flex items-center gap-2">
                <div
                  className="h-3 rounded-sm bg-blue-200"
                  style={{ width: `${(target / maxDuration) * 100}%`, minWidth: '4px' }}
                />
                <span className="text-[10px] text-gray-400">{target}d</span>
              </div>
              {/* Actual bar */}
              <div className="flex items-center gap-2">
                {avg != null ? (
                  <>
                    <div
                      className={`h-3 rounded-sm ${statusColor(avg, target)}`}
                      style={{ width: `${(avg / maxDuration) * 100}%`, minWidth: '4px' }}
                    />
                    <span className="text-[10px] text-gray-600 font-medium">{avg}d</span>
                  </>
                ) : (
                  <span className="text-[10px] text-gray-300">—</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Coach-level summary table */}
      <div className="mt-4">
        <h4 className="mb-2 text-xs font-medium text-gray-500">Coach Summary</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-1.5 pr-3 text-left font-medium text-gray-500">Coach</th>
                {stages.map((s) => (
                  <th key={s} className="px-2 py-1.5 text-center font-medium text-gray-500">
                    {s.slice(0, 3)}
                  </th>
                ))}
                <th className="pl-3 py-1.5 text-right font-medium text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody>
              {detail.coaches.map((coach) => {
                const totalActual = coach.stageHistory.reduce(
                  (s, h) => s + (h.actualDurationDays ?? 0), 0,
                );
                return (
                  <tr key={coach.id} className="border-b border-gray-50">
                    <td className="py-1.5 pr-3 font-mono text-gray-700">{coach.coachNumber}</td>
                    {stages.map((stage) => {
                      const entry = coach.stageHistory.find((h) => h.stage === stage);
                      const actual = entry?.actualDurationDays;
                      const target = TARGET_DURATIONS[stage];
                      let color = 'text-gray-300';
                      if (actual != null) {
                        if (actual <= target) color = 'text-green-600';
                        else if (actual <= target + 2) color = 'text-yellow-600';
                        else color = 'text-red-600';
                      }
                      return (
                        <td key={stage} className={`px-2 py-1.5 text-center ${color}`}>
                          {actual != null ? `${actual}d` : '—'}
                        </td>
                      );
                    })}
                    <td className="pl-3 py-1.5 text-right font-medium text-gray-700">
                      {totalActual}d
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
