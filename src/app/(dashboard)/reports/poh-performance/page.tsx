'use client';

import { useEffect, useState, useTransition } from 'react';
import { BarChart3, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useShed } from '@/lib/shed-context';
import { getPOHTypePerformanceReport, type POHTypePerformanceData, type ReportFilters } from '@/lib/queries/reports';
import { TARGET_DURATIONS } from '@/lib/constants';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { PerformanceChart } from '@/components/reports/performance-chart';
import { ReportFiltersBar } from '@/components/reports/report-filters';
import { ExportButtons } from '@/components/reports/export-buttons';
import { DotsLoader } from '@/components/ui/dots-loader';

export default function POHPerformancePage() {
  const { selectedShedId } = useShed();
  const [data, setData] = useState<POHTypePerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState<ReportFilters>({ shedId: selectedShedId });

  useEffect(() => {
    setFilters((f) => ({ ...f, shedId: selectedShedId }));
  }, [selectedShedId]);

  useEffect(() => {
    setLoading(true);
    startTransition(async () => {
      const result = await getPOHTypePerformanceReport(filters);
      setData(result);
      setLoading(false);
    });
  }, [filters]);

  const isLoading = loading || isPending;

  const completionChartData = data.map((d) => ({
    label: d.pohType,
    value: d.avgCompletionDays,
    target: 20,
  }));

  const onTimeChartData = data.map((d) => ({
    label: d.pohType,
    value: d.onTimePct,
  }));

  // Stage duration comparison across POH types
  const stageDurationData = data.length > 0
    ? data[0].stageDurations.map((sd) => {
        const item: Record<string, string | number> = {
          label: sd.stage,
          target: TARGET_DURATIONS[sd.stage as keyof typeof TARGET_DURATIONS] ?? 0,
        };
        data.forEach((d) => {
          const found = d.stageDurations.find((s) => s.stage === sd.stage);
          item[d.pohType] = found?.avgDays ?? 0;
        });
        return item;
      })
    : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">POH Type Performance</h1>
        <p className="mt-1 text-sm text-gray-500">
          Average completion time, on-time rates, and stage durations per POH type
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ReportFiltersBar filters={filters} onChange={setFilters} />
        <ExportButtons data={data} reportType="poh-performance" disabled={isLoading} />
      </div>

      {isLoading && (
        <div className="flex h-40 items-center justify-center">
          <DotsLoader size="lg" color="blue" />
        </div>
      )}

      {!isLoading && data.length === 0 && (
        <Card>
          <CardBody className="flex flex-col items-center py-12 text-center">
            <BarChart3 className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">No completed rakes found for the selected filters</p>
          </CardBody>
        </Card>
      )}

      {!isLoading && data.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.map((d) => (
              <Card key={d.pohType}>
                <CardBody className="space-y-2 py-3">
                  <p className="text-xs font-medium text-gray-500">{d.pohType}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">{d.avgCompletionDays}</span>
                    <span className="text-xs text-gray-400">days avg</span>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {d.onTimePct}% on-time
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                      {d.avgDelayDays}d delay
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{d.totalRakes} rakes</p>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-gray-900">Avg Completion Time (days)</h3>
              </CardHeader>
              <CardBody>
                <PerformanceChart
                  data={completionChartData}
                  type="bar"
                  valueLabel="Actual"
                  targetLabel="Target (20d)"
                  unit=" days"
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-gray-900">On-Time Completion %</h3>
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

          {/* Stage duration table */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900">Avg Stage Duration by POH Type (days)</h3>
            </CardHeader>
            <CardBody className="overflow-x-auto p-0">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Stage</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500">Target</th>
                    {data.map((d) => (
                      <th key={d.pohType} className="px-4 py-2.5 text-right font-medium text-gray-500">
                        {d.pohType}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stageDurationData.map((row) => (
                    <tr key={row.label as string}>
                      <td className="px-4 py-2 font-medium text-gray-900">{row.label}</td>
                      <td className="px-4 py-2 text-right text-gray-500">{row.target}</td>
                      {data.map((d) => {
                        const val = row[d.pohType] as number;
                        const target = row.target as number;
                        const isOver = val > target;
                        return (
                          <td
                            key={d.pohType}
                            className={`px-4 py-2 text-right ${isOver ? 'font-medium text-red-600' : 'text-gray-700'}`}
                          >
                            {val || '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
