'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { getSectionColor } from '@/lib/constants';
import type { SectionProgressSummary } from '@/types';

interface SectionCardProps {
  section: SectionProgressSummary;
  coachId: string;
  rakeId: string;
  isEditable: boolean;
  isAssignedToCurrentSSE: boolean;
}

const colorStyles: Record<string, { border: string; bg: string; bar: string }> = {
  green: { border: 'border-green-400', bg: 'bg-green-50', bar: 'bg-green-500' },
  blue: { border: 'border-blue-400', bg: 'bg-blue-50', bar: 'bg-blue-500' },
  yellow: { border: 'border-yellow-400', bg: 'bg-yellow-50', bar: 'bg-yellow-500' },
  grey: { border: 'border-gray-300', bg: 'bg-gray-50', bar: 'bg-gray-400' },
};

export function SectionCard({
  section,
  coachId,
  rakeId,
  isEditable,
  isAssignedToCurrentSSE,
}: SectionCardProps) {
  const {
    sectionCode,
    nameHindi,
    nameEnglish,
    progressPct,
    totalWorkItems,
    completedWorkItems,
    mustChangeTotal,
    mustChangeReplaced,
    testsTotal,
    testsPassed,
    testsFailed,
    isApplicable,
  } = section;

  // N/A sections
  if (!isApplicable) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 opacity-60">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-500">{sectionCode}</span>
          <Badge variant="gray" size="sm">N/A</Badge>
        </div>
        <p className="mt-1 text-xs text-gray-400">{nameEnglish}</p>
      </div>
    );
  }

  const allCompleted =
    totalWorkItems > 0 &&
    completedWorkItems === totalWorkItems &&
    mustChangeReplaced === mustChangeTotal &&
    testsFailed === 0 &&
    testsPassed === testsTotal;

  const color = getSectionColor(progressPct, totalWorkItems, allCompleted);
  const styles = colorStyles[color] ?? colorStyles.grey;

  const href = `/rakes/${rakeId}/coaches/${coachId}/sections/${sectionCode}`;

  return (
    <Link
      href={href}
      className={`block rounded-lg border-2 ${styles.border} ${styles.bg} p-4 transition-shadow hover:shadow-md ${
        isAssignedToCurrentSSE ? 'ring-2 ring-blue-500 ring-offset-1' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-gray-900">{sectionCode}</span>
        <div className="flex items-center gap-1.5">
          {isAssignedToCurrentSSE && (
            <Badge variant="info" size="sm">Your Section</Badge>
          )}
          {isEditable ? (
            <Badge variant="blue" size="sm">Edit</Badge>
          ) : (
            <Badge variant="gray" size="sm">View</Badge>
          )}
        </div>
      </div>

      {/* Name */}
      <p className="mt-1 text-xs font-medium text-gray-700">{nameEnglish}</p>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Progress</span>
          <span className="font-semibold">{progressPct}%</span>
        </div>
        <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
          <div
            className={`h-2 rounded-full ${styles.bar} transition-all`}
            style={{ width: `${Math.min(progressPct, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <p className="text-gray-500">Work Items</p>
          <p className="font-semibold text-gray-800">
            {completedWorkItems}/{totalWorkItems}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Must Change</p>
          <p className="font-semibold text-gray-800">
            {mustChangeReplaced}/{mustChangeTotal}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Tests</p>
          <p className={`font-semibold ${testsFailed > 0 ? 'text-red-600' : 'text-gray-800'}`}>
            {testsPassed}/{testsTotal}
            {testsFailed > 0 && <span className="text-red-500"> ({testsFailed}✗)</span>}
          </p>
        </div>
      </div>
    </Link>
  );
}
