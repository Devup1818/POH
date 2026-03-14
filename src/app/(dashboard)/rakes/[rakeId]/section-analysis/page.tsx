import Link from 'next/link';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { getRakeSectionAnalysis } from '@/lib/queries/section-analysis';
import { SECTION_CODES } from '@/lib/constants';
import type { SectionCode } from '@/types';

interface SectionAnalysisPageProps {
  params: Promise<{ rakeId: string }>;
}

/** Section display labels */
const SECTION_LABELS: Record<SectionCode, string> = {
  M2: 'M2',
  M3: 'M3',
  M4: 'M4',
  M5: 'M5',
  M6: 'M6',
  M8: 'M8',
  Painting: 'Painting',
  E2: 'E2',
  E3: 'E3',
  E5: 'E5',
};

/** Color-code a cell based on progress and applicability */
function getCellClasses(progressPct: number, isApplicable: boolean): string {
  if (!isApplicable) return 'bg-gray-50 text-gray-400';
  if (progressPct >= 100) return 'bg-green-100 text-green-800';
  if (progressPct > 50) return 'bg-blue-100 text-blue-800';
  if (progressPct > 0) return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-500';
}

export default async function SectionAnalysisPage({ params }: SectionAnalysisPageProps) {
  const { rakeId } = await params;
  const data = await getRakeSectionAnalysis(rakeId);

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-gray-400">Section analysis data not found.</p>
      </div>
    );
  }

  const { rakeNumber, coaches, averages } = data;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <Link
          href={`/rakes/${rakeId}`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Rake {rakeNumber}
        </Link>
        <h1 className="text-xl font-bold text-gray-900">
          Section Analysis — Rake {rakeNumber}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Section-wise progress across all coaches
        </p>
      </div>

      {/* Matrix table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2.5 text-left font-semibold text-gray-700 whitespace-nowrap">
                  Coach
                </th>
                {SECTION_CODES.map((code) => (
                  <th
                    key={code}
                    className="px-3 py-2.5 text-center font-semibold text-gray-700 whitespace-nowrap"
                  >
                    {SECTION_LABELS[code]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coaches.map((coach) => (
                <tr key={coach.coachId} className="hover:bg-gray-50/50">
                  <td className="sticky left-0 z-10 bg-white px-3 py-2 font-medium text-gray-900 whitespace-nowrap">
                    <span>{coach.coachNumber}</span>
                    <span className="ml-1.5 text-xs text-gray-400">({coach.coachType})</span>
                  </td>
                  {SECTION_CODES.map((code) => {
                    const cell = coach.sections[code];
                    if (!cell.isApplicable) {
                      return (
                        <td
                          key={code}
                          className="px-3 py-2 text-center"
                        >
                          <span className="inline-block rounded px-2 py-0.5 text-xs bg-gray-50 text-gray-400">
                            N/A
                          </span>
                        </td>
                      );
                    }
                    return (
                      <td key={code} className="px-3 py-2 text-center">
                        <Link
                          href={`/rakes/${rakeId}/coaches/${coach.coachId}/sections/${code}`}
                          className={`inline-block rounded px-2 py-0.5 text-xs font-medium transition-opacity hover:opacity-80 ${getCellClasses(cell.progressPct, true)}`}
                        >
                          {cell.progressPct}%
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Average row */}
              <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                <td className="sticky left-0 z-10 bg-gray-50 px-3 py-2.5 text-gray-700 whitespace-nowrap">
                  Average
                </td>
                {SECTION_CODES.map((code) => {
                  const avg = averages[code];
                  const isWarning = avg < 50;
                  return (
                    <td key={code} className="px-3 py-2.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold ${
                          isWarning
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-200 text-gray-800'
                        }`}
                      >
                        {isWarning && <AlertTriangle className="h-3 w-3" />}
                        {avg}%
                      </span>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-green-100 border border-green-300" />
          100% (Complete)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-blue-100 border border-blue-300" />
          &gt;50%
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-yellow-100 border border-yellow-300" />
          ≤50%
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-gray-100 border border-gray-300" />
          0% (Not Started)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-gray-50 border border-gray-200" />
          N/A
        </div>
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="h-3 w-3 text-red-500" />
          Average &lt; 50%
        </div>
      </div>
    </div>
  );
}
