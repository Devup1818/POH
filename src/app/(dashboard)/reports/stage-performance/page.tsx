'use client';

import { useEffect, useState, useTransition } from 'react';
import { BarChart3 } from 'lucide-react';
import { useShed } from '@/lib/shed-context';
import { getStagePerformanceReport, type StagePerformanceData, type ReportFilters } from '@/lib/queries/reports';
import { TARGET_DURATIONS } from '@/lib/constants';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { PerformanceChart } from '@/components/reports/performance-chart';
import { ReportFiltersBar } from '@/components/reports/report-filters';
import { ExportButtons } from '@/components/reports/export-buttons';
import type { POHStage } from '@/types';

export default function StagePerformancePage() {
  const { selectedShedId } = useShed();
  const [data, setData] = useState<StagePerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState<ReportFilters>({ shedId: selectedShedId });

  useEffect(() => {
    setFilters((f) => ({ ...f, shedId: selectedShedId }));
  }, [selectedShedId]);

  useEffect(() => {
    setLoading(true);
    startTransition(async () => {
      const result = await getStagePerformanceReport(filters);
      setData(result);
      setLoading(false);
    });
  }, [filters]);

  const isLoading = loading || isPending;

  const durationChartData = data.map((d) => ({
    label: d.stage,
    value: d.avgDuration,
    target: TARGET_DURATIONS[d.stage as POHStage] ?? 0,
  }));

  const onTimeChartData = data.map((d) => ({
    label: d.stage,
    value: d.onTimePct,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Stage Performance</h1>
        <p className="mt-1 text-sm text-gray-500">
          Average duration and on-time rates per POH stage
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ReportFiltersBar filters={filters} onChange={setFilters} />
        <ExportButtons data={data} reportType="stage-performance" disabled={isLoading} />
      </div>

      {isLoading && (
        <div className="flex h-40 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}

      {!isLoading && data.every((d) => d.totalCompleted === 0) && (
        <Card>
          <CardBody className="flex flex-col items-center py-12 text-center">
            <BarChart3 className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">No stage completion data found</p>
          </CardBody>
        </Card>
      )}

      {!isLoading && data.some((d) => d.totalCompleted > 0) && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-gray-900">Avg Duration vs Target (days)</h3>
              </CardHeader>
              <CardBody>
                <PerformanceChart
                  data={durationChartData}
                  type="bar"
                  valueLabel="Actual"
                  targetLabel="Target"
                  unit=" days"
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-gray-900">On-Time % per Stage</h3>
              </CardHeader>
              <CardBody>
                <PerformanceChart
                  data={onTimeChartData}
                  type="bar"
                  valueLabel="On-Time %"
                  valueColor="#10b981"
                  unit="%"
                  showLegend={false}
                />
              </CardBody>
            </Card>
          </div>

          {/* Detail table */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900">Stage Details</h3>
            </CardHeader>
            <CardBody className="overflow-x-auto p-0">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Stage</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500">Target (days)</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500">Avg Actual (days)</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500">On-Time %</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((d) => {
                    const target = TARGET_DURATIONS[d.stage as POHStage] ?? 0;
                    const isOver = d.avgDuration > target;
                    return (
                      <tr key={d.stage}>
                        <td className="px-4 py-2 font-medium text-gray-900">{d.stage}</td>
                        <td className="px-4 py-2 text-right text-gray-500">{target}</td>
                        <td className={`px-4 py-2 text-right ${isOver ? 'font-medium text-red-600' : 'text-gray-700'}`}>
                          {d.avgDuration || '—'}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span className={d.onTimePct >= 80 ? 'text-green-600' : d.onTimePct >= 50 ? 'text-amber-600' : 'text-red-600'}>
                            {d.onTimePct}%
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-gray-500">{d.totalCompleted}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
