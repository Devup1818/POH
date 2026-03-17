'use client';

import { useEffect, useState, useTransition } from 'react';
import { ClipboardCheck, ShieldCheck } from 'lucide-react';
import { useShed } from '@/lib/shed-context';
import { getChecklistComplianceReport, type ChecklistComplianceData, type ReportFilters } from '@/lib/queries/reports';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PerformanceChart } from '@/components/reports/performance-chart';
import { ReportFiltersBar } from '@/components/reports/report-filters';
import { ExportButtons } from '@/components/reports/export-buttons';
import { DotsLoader } from '@/components/ui/dots-loader';

export default function ChecklistCompliancePage() {
  const { selectedShedId } = useShed();
  const [data, setData] = useState<ChecklistComplianceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState<ReportFilters>({ shedId: selectedShedId });

  useEffect(() => {
    setFilters((f) => ({ ...f, shedId: selectedShedId }));
  }, [selectedShedId]);

  useEffect(() => {
    setLoading(true);
    startTransition(async () => {
      const result = await getChecklistComplianceReport(filters);
      setData(result);
      setLoading(false);
    });
  }, [filters]);

  const isLoading = loading || isPending;

  const completionChartData = data.map((d) => ({
    label: d.pohType,
    value: d.avgCompletionPct,
  }));

  const mandatoryChartData = data.map((d) => ({
    label: d.pohType,
    value: d.mandatoryCompliancePct,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Checklist Compliance</h1>
        <p className="mt-1 text-sm text-gray-500">
          Checklist completion rates and mandatory item compliance per POH type
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ReportFiltersBar filters={filters} onChange={setFilters} showDateRange={false} />
        <ExportButtons data={data} reportType="checklist-compliance" disabled={isLoading} />
      </div>

      {isLoading && (
        <div className="flex h-40 items-center justify-center">
          <DotsLoader size="lg" color="blue" />
        </div>
      )}

      {!isLoading && data.length === 0 && (
        <Card>
          <CardBody className="flex flex-col items-center py-12 text-center">
            <ClipboardCheck className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">No checklist data available</p>
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
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Completion</span>
                      <span className={`text-sm font-bold ${d.avgCompletionPct >= 80 ? 'text-green-600' : d.avgCompletionPct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                        {d.avgCompletionPct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-gray-100">
                      <div
                        className={`h-1.5 rounded-full ${d.avgCompletionPct >= 80 ? 'bg-green-500' : d.avgCompletionPct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${d.avgCompletionPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-xs text-gray-500">
                      Mandatory: <span className="font-medium">{d.mandatoryCompliancePct}%</span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{d.totalCoaches} coaches</p>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-gray-900">Avg Completion % by POH Type</h3>
              </CardHeader>
              <CardBody>
                <PerformanceChart
                  data={completionChartData}
                  type="bar"
                  valueLabel="Completion %"
                  valueColor="#3b82f6"
                  unit="%"
                  showLegend={false}
                />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-sm font-semibold text-gray-900">Mandatory Items Compliance %</h3>
              </CardHeader>
              <CardBody>
                <PerformanceChart
                  data={mandatoryChartData}
                  type="bar"
                  valueLabel="Compliance %"
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
              <h3 className="text-sm font-semibold text-gray-900">Compliance Details</h3>
            </CardHeader>
            <CardBody className="overflow-x-auto p-0">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">POH Type</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500">Coaches</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500">Avg Completion</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500">Mandatory Compliance</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((d) => (
                    <tr key={d.pohType}>
                      <td className="px-4 py-2 font-medium text-gray-900">{d.pohType}</td>
                      <td className="px-4 py-2 text-right text-gray-700">{d.totalCoaches}</td>
                      <td className="px-4 py-2 text-right">
                        <span className={d.avgCompletionPct >= 80 ? 'text-green-600' : d.avgCompletionPct >= 50 ? 'text-amber-600' : 'text-red-600'}>
                          {d.avgCompletionPct}%
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className={d.mandatoryCompliancePct >= 90 ? 'text-green-600' : d.mandatoryCompliancePct >= 70 ? 'text-amber-600' : 'text-red-600'}>
                          {d.mandatoryCompliancePct}%
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Badge
                          variant={d.mandatoryCompliancePct >= 90 ? 'success' : d.mandatoryCompliancePct >= 70 ? 'warning' : 'danger'}
                          size="sm"
                        >
                          {d.mandatoryCompliancePct >= 90 ? 'Good' : d.mandatoryCompliancePct >= 70 ? 'Needs Attention' : 'Critical'}
                        </Badge>
                      </td>
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
