'use client';

import { useEffect, useState, useTransition } from 'react';
import { Package, AlertTriangle } from 'lucide-react';
import { useShed } from '@/lib/shed-context';
import { getPartsManagementReport, type PartsReportEntry, type ReportFilters } from '@/lib/queries/reports';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { PerformanceChart } from '@/components/reports/performance-chart';
import { ReportFiltersBar } from '@/components/reports/report-filters';
import { ExportButtons } from '@/components/reports/export-buttons';

export default function PartsManagementPage() {
  const { selectedShedId } = useShed();
  const [data, setData] = useState<PartsReportEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState<ReportFilters>({ shedId: selectedShedId });

  useEffect(() => {
    setFilters((f) => ({ ...f, shedId: selectedShedId }));
  }, [selectedShedId]);

  useEffect(() => {
    setLoading(true);
    startTransition(async () => {
      const result = await getPartsManagementReport(filters);
      setData(result);
      setLoading(false);
    });
  }, [filters]);

  const isLoading = loading || isPending;

  const chartData = data.map((d) => ({
    label: d.partName,
    value: d.missingCount,
  }));

  const totalMissing = data.reduce((s, d) => s + d.missingCount, 0);
  const totalAffected = data.reduce((s, d) => s + d.affectedCoaches, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Parts Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Most frequently missing parts and delay impact
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ReportFiltersBar filters={filters} onChange={setFilters} showDateRange={false} />
        <ExportButtons data={data} reportType="parts-management" disabled={isLoading} />
      </div>

      {isLoading && (
        <div className="flex h-40 items-center justify-center">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      )}

      {!isLoading && data.length === 0 && (
        <Card>
          <CardBody className="flex flex-col items-center py-12 text-center">
            <Package className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">No missing parts found</p>
            <p className="mt-1 text-xs text-gray-400">All parts across active rakes are accounted for</p>
          </CardBody>
        </Card>
      )}

      {!isLoading && data.length > 0 && (
        <>
          {/* Summary */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Card>
              <CardBody className="flex items-center gap-3 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100">
                  <Package className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Missing</p>
                  <p className="text-lg font-bold text-gray-900">{totalMissing}</p>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="flex items-center gap-3 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Coaches Affected</p>
                  <p className="text-lg font-bold text-gray-900">{totalAffected}</p>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="flex items-center gap-3 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Part Types Missing</p>
                  <p className="text-lg font-bold text-gray-900">{data.length}</p>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900">Missing Parts by Type</h3>
            </CardHeader>
            <CardBody>
              <PerformanceChart
                data={chartData}
                type="bar"
                valueLabel="Missing Count"
                valueColor="#ef4444"
                showLegend={false}
              />
            </CardBody>
          </Card>

          {/* Table */}
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900">Parts Detail</h3>
            </CardHeader>
            <CardBody className="overflow-x-auto p-0">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-500">Part Name</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500">Missing Count</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500">Coaches Affected</th>
                    <th className="px-4 py-2.5 text-right font-medium text-gray-500">Avg Days Missing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.map((d) => (
                    <tr key={d.partName}>
                      <td className="px-4 py-2 font-medium text-gray-900">{d.partName}</td>
                      <td className="px-4 py-2 text-right text-red-600 font-medium">{d.missingCount}</td>
                      <td className="px-4 py-2 text-right text-gray-700">{d.affectedCoaches}</td>
                      <td className="px-4 py-2 text-right text-gray-700">{d.avgDelayDays}</td>
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
