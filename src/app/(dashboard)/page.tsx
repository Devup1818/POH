'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Train,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PackageX,
} from 'lucide-react';
import { MetricsCards, type DashboardMetric } from '@/components/dashboard/metrics-cards';
import {
  DashboardFilters,
  type DashboardFilterValues,
} from '@/components/dashboard/dashboard-filters';
import { RakeList } from '@/components/dashboard/rake-list';
import type { RakeCardData } from '@/components/dashboard/rake-card';
import { useShed } from '@/lib/shed-context';
import {
  getDashboardMetrics,
  getActiveRakes,
  type DashboardMetricsData,
  type RakeSummary,
} from '@/lib/queries/dashboard';
import { useDashboardRealtime } from '@/lib/supabase/realtime';

/* ── page ────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { selectedShedId, shedName } = useShed();

  const [filters, setFilters] = useState<DashboardFilterValues>({
    rakeType: 'all',
    pohType: 'all',
    stage: 'all',
    timelineStatus: 'all',
    sortBy: 'intake',
    search: '',
  });

  const [metrics, setMetrics] = useState<DashboardMetricsData>({
    activeRakeCount: 0,
    totalCoaches: 0,
    avgCompletionPct: 0,
    onTimePct: 0,
    delayedCoaches: 0,
    missingPartsCount: 0,
  });

  const [rakes, setRakes] = useState<RakeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  // Separate flag so realtime refreshes don't flash the loading spinner
  const [silentRefreshing, setSilentRefreshing] = useState(false);

  // Full fetch (shows spinner on first load / filter change)
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [metricsData, rakesData] = await Promise.all([
        getDashboardMetrics(selectedShedId),
        getActiveRakes({
          shedId: selectedShedId,
          rakeType: filters.rakeType,
          pohType: filters.pohType,
          stage: filters.stage,
          timelineStatus: filters.timelineStatus,
          sortBy: filters.sortBy,
          search: filters.search,
        }),
      ]);
      setMetrics(metricsData);
      setRakes(rakesData);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedShedId, filters]);

  // Silent refresh — used by realtime so cards update without a loading flash
  const silentFetch = useCallback(async () => {
    if (silentRefreshing) return; // debounce concurrent triggers
    setSilentRefreshing(true);
    try {
      const [metricsData, rakesData] = await Promise.all([
        getDashboardMetrics(selectedShedId),
        getActiveRakes({
          shedId: selectedShedId,
          rakeType: filters.rakeType,
          pohType: filters.pohType,
          stage: filters.stage,
          timelineStatus: filters.timelineStatus,
          sortBy: filters.sortBy,
          search: filters.search,
        }),
      ]);
      setMetrics(metricsData);
      setRakes(rakesData);
    } catch (err) {
      console.error('Realtime refresh failed:', err);
    } finally {
      setSilentRefreshing(false);
    }
  }, [selectedShedId, filters, silentRefreshing]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time: silently refresh when rakes/coaches/parts change
  useDashboardRealtime(selectedShedId, silentFetch);

  // Map RakeSummary to RakeCardData
  const rakeCards: RakeCardData[] = useMemo(
    () =>
      rakes.map((r) => ({
        id: r.id,
        rakeNumber: r.rakeNumber,
        rakeType: r.rakeType,
        pohType: r.pohType,
        shedId: r.shedId,
        shedName: r.shedName,
        currentStage: r.currentStage,
        elapsedDays: r.elapsedDays,
        totalCoaches: r.totalCoaches,
        coachStages: r.coachStages,
        delayedCoachCount: r.delayedCoachCount,
        missingPartsCoachCount: r.missingPartsCoachCount,
        avgCompletionPercentage: r.avgCompletionPct,
      })),
    [rakes],
  );

  const shedLabel = selectedShedId === 'all' ? 'all sheds' : shedName || 'your shed';

  const metricCards: DashboardMetric[] = [
    {
      label: 'Active Rakes',
      value: metrics.activeRakeCount,
      icon: <Train className="h-5 w-5" />,
      accent: 'before:bg-blue-400',
      iconColor: 'text-blue-400',
    },
    {
      label: 'Total Coaches',
      value: metrics.totalCoaches,
      icon: <Users className="h-5 w-5" />,
      accent: 'before:bg-indigo-400',
      iconColor: 'text-indigo-400',
    },
    {
      label: 'Avg. Completion',
      value: `${metrics.avgCompletionPct}%`,
      icon: <Clock className="h-5 w-5" />,
      accent: 'before:bg-cyan-400',
      iconColor: 'text-cyan-400',
    },
    {
      label: 'On-Time Rate',
      value: `${metrics.onTimePct}%`,
      icon: <CheckCircle2 className="h-5 w-5" />,
      accent: 'before:bg-emerald-400',
      iconColor: 'text-emerald-400',
    },
    {
      label: 'Delayed Coaches',
      value: metrics.delayedCoaches,
      icon: <AlertTriangle className="h-5 w-5" />,
      accent: 'before:bg-orange-400',
      iconColor: 'text-orange-400',
    },
    {
      label: 'Missing Parts',
      value: metrics.missingPartsCount,
      icon: <PackageX className="h-5 w-5" />,
      accent: 'before:bg-amber-400',
      iconColor: 'text-amber-400',
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
        <p className="mt-0.5 text-xs text-gray-400 flex items-center gap-2">
          Showing POH operations for {shedLabel}
          <span className="flex items-center gap-1 text-green-500">
            <span className={cn(
              'inline-block h-1.5 w-1.5 rounded-full bg-green-400',
              silentRefreshing && 'animate-ping',
            )} />
            {silentRefreshing ? 'Updating...' : 'Live'}
          </span>
        </p>
      </div>

      <MetricsCards metrics={metricCards} />

      <DashboardFilters filters={filters} onChange={setFilters} />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
          <span className="ml-3 text-sm text-gray-400">Loading...</span>
        </div>
      ) : (
        <RakeList rakes={rakeCards} />
      )}
    </div>
  );
}
