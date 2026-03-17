'use client';

import { Search, X } from 'lucide-react';
import type { POHStage, POHType, RakeType, TimelineStatus } from '@/types';
import { POH_STAGE_ORDER } from '@/lib/constants';

export interface DashboardFilterValues {
  rakeType: RakeType | 'all';
  pohType: POHType | 'all';
  stage: POHStage | 'all';
  timelineStatus: TimelineStatus | 'all';
  sortBy: 'intake' | 'completion' | 'elapsed' | 'delayed';
  search: string;
}

interface DashboardFiltersProps {
  filters: DashboardFilterValues;
  onChange: (filters: DashboardFilterValues) => void;
}

const selectClass =
  'rounded-lg border border-gray-200/60 bg-white/60 px-3 py-2 text-xs text-gray-600 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 min-h-[44px] sm:min-h-0 transition-colors duration-150';

export function DashboardFilters({ filters, onChange }: DashboardFiltersProps) {
  const update = (partial: Partial<DashboardFilterValues>) =>
    onChange({ ...filters, ...partial });

  const hasActiveFilters =
    filters.rakeType !== 'all' ||
    filters.pohType !== 'all' ||
    filters.stage !== 'all' ||
    filters.timelineStatus !== 'all' ||
    filters.search !== '';

  const clearAll = () =>
    onChange({ rakeType: 'all', pohType: 'all', stage: 'all', timelineStatus: 'all', sortBy: filters.sortBy, search: '' });

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      {/* Search */}
      <div className="relative w-full sm:min-w-[200px] sm:max-w-xs sm:flex-1">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search rake or coach..."
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
          className="w-full rounded-lg border border-gray-200/60 bg-white/60 py-2 pl-9 pr-3 text-xs text-gray-700 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20 min-h-[44px] sm:min-h-0 transition-colors duration-150"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
        <select value={filters.rakeType} onChange={(e) => update({ rakeType: e.target.value as RakeType | 'all' })} className={selectClass} aria-label="Filter by rake type">
          <option value="all">All Types</option>
          <option value="EMU">EMU</option>
          <option value="MEMU">MEMU</option>
          <option value="3-Phase Rake">3-Phase Rake</option>
          <option value="Conventional Rake">Conventional Rake</option>
        </select>

        <select value={filters.pohType} onChange={(e) => update({ pohType: e.target.value as POHType | 'all' })} className={selectClass} aria-label="Filter by POH type">
          <option value="all">All POH</option>
          <option value="1st POH">1st POH</option>
          <option value="2nd POH">2nd POH</option>
          <option value="3rd POH">3rd POH</option>
          <option value="4th POH">4th POH</option>
        </select>

        <select value={filters.stage} onChange={(e) => update({ stage: e.target.value as POHStage | 'all' })} className={selectClass} aria-label="Filter by stage">
          <option value="all">All Stages</option>
          {POH_STAGE_ORDER.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select value={filters.timelineStatus} onChange={(e) => update({ timelineStatus: e.target.value as TimelineStatus | 'all' })} className={selectClass} aria-label="Filter by timeline status">
          <option value="all">All Status</option>
          <option value="On Schedule">On Schedule</option>
          <option value="Minor Delay">Minor Delay</option>
          <option value="Significant Delay">Significant Delay</option>
          <option value="Ahead of Schedule">Ahead</option>
        </select>

        <select value={filters.sortBy} onChange={(e) => update({ sortBy: e.target.value as DashboardFilterValues['sortBy'] })} className={selectClass} aria-label="Sort by">
          <option value="intake">Sort: Intake Date</option>
          <option value="completion">Sort: Completion</option>
          <option value="elapsed">Sort: Elapsed</option>
          <option value="delayed">Sort: Delayed</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-[11px] font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100/60 transition-colors duration-150 min-h-[44px] sm:min-h-0"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
