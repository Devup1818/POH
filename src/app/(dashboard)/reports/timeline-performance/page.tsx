'use client';

import { useEffect, useState, useTransition } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { useShed } from '@/lib/shed-context';
import { getTimelinePerformanceReport, type TimelinePerformanceData, type ReportFilters } from '@/lib/queries/reports';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PerformanceChart } from '@/components/reports/performance-chart';
import { ReportFiltersBar } from '@/components/reports/report-filters';
import { ExportButtons } from '@/components/reports/export-buttons';
import { DotsLoader } from '@/components/ui/dots-loader';

const STATUS_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  'On Schedule': 'success',
  'Ahead of Schedule': 'info',
  'Minor Delay': 'warning',
  'Significant Delay': 'danger',
};

export default function TimelinePerformancePage() {
  const { selectedShedId } = useShed();
  const [data, setData] = useState<TimelinePerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState<ReportFilters>({ shedId: selectedShedId });

  useEffect(() => {
    setFilters((f) => ({ ...f, shedId: selectedShedId }));
  }, [selectedShedId]);

  useEffect(() => {
    setLoading(true);
    startTransition(async () => {
      const result = await getTimelinePerformanceReport(filters);
      setData(result);
      setLoading(false);
    });
  }, [filters]);

  const isLoading = loading || isPending;

  const pieData = data?.distribution.filter((d) => d.count > 0).map((d) => ({
    label: d.status,
    value: d.count,
  })) ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Timeline Performance</h1>
        <p className="mt-1 text-sm text-gray-500">
          Timeline status distribution and delay analysis
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ReportFiltersBar filters={filters} onChange={setFilters} showDateRange={false} />
        <ExportButtons
          data={data?.distribution ?? []}
          reportType="timeline-performance"
          disabled={isLoading}
        />
      </div>

      {isLoading && (
        <div className="flex h-40 items-center justify-center">
          <DotsLoader size="lg" color="blue" />
        </div>
      )}

      {!isLoading && (!data || data.distribution.every((d) => d.count === 0)) && (
        <Card>
          <CardBody className="flex flex-col items-center py-12 text-center">
            <Clock className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">No timeline data available</p>
          </CardBody>
        </Card>
      )}

      {!isLoading && data && data.distribution.some((d) => d.count > 0) && (
        <>
          {/* Summary cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.distribution.map((d) => (
              <Card key={d.status}>
                <CardBody className="py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">{d.status}</p>
                    <Badge variant={STATUS_VARIANT[d.status] ?? 'default'} size="sm">
                      {d.percentage}%
                    </Badge>
                  </div>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{d.count}</p>
                  <p className="text-xs text-gray-400">coaches</p>
                </CardBody>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Pie chart */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-gray-900">Status Distribution</h3>
              </CardHeader>
              <CardBody>
                <PerformanceChart data={pieData} type="pie" height={280} />
              </CardBody>
            </Card>

            {/* Delay summary */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-gray-900">Delay Summary</h3>
              </CardHeader>
              <CardBody className="flex flex-col items-center justify-center space-y-4 py-8">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
                  <AlertTriangle className="h-10 w-10 text-amber-500" />
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{data.avgDelayDays}</p>
                  <p className="text-sm text-gray-500">avg delay (days)</p>
                </div>
                <p className="text-xs text-gray-400">
                  {data.longestDelayed.length} coaches with delays
                </p>
              </CardBody>
            </Card>
          </div>

          {/* Longest delayed coaches */}
          {data.longestDelayed.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-gray-900">Longest Delayed Coaches</h3>
              </CardHeader>
              <CardBody className="overflow-x-auto p-0">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium text-gray-500">Coach</th>
                      <th className="px-4 py-2.5 text-left font-medium text-gray-500">Rake</th>
                      <th className="px-4 py-2.5 text-left font-medium text-gray-500">POH Type</th>
                      <th className="px-4 py-2.5 text-left font-medium text-gray-500">Current Stage</th>
                      <th className="px-4 py-2.5 text-right font-medium text-gray-500">Delay (days)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.longestDelayed.map((c, i) => (
                      <tr key={`${c.coachNumber}-${i}`}>
                        <td className="px-4 py-2 font-mono font-medium text-gray-900">{c.coachNumber}</td>
                        <td className="px-4 py-2 text-gray-700">{c.rakeNumber}</td>
                        <td className="px-4 py-2">
                          <Badge variant="purple" size="sm">{c.pohType}</Badge>
                        </td>
                        <td className="px-4 py-2">
                          <Badge variant="info" size="sm">{c.currentStage}</Badge>
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-red-600">+{c.delayDays}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
