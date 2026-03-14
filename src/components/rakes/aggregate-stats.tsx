'use client';

import { BarChart3, PackageX, Clock, AlertTriangle, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AggregateStatsProps {
  avgCompletionPercentage: number;
  totalMissingParts: number;
  avgDelayDays: number;
  coachesBlockingProgression: number;
  testingCompleteCount?: number;
  testingTotalCount?: number;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor: string;
  accent: string;
}

function StatCard({ label, value, icon, iconColor, accent }: StatCardProps) {
  return (
    <div
      className={cn(
        'relative flex items-center gap-3 overflow-hidden rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm',
        'before:absolute before:inset-y-0 before:left-0 before:w-1',
        accent,
      )}
    >
      <div className={cn('shrink-0', iconColor)}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
          {label}
        </p>
        <p className="text-lg font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

export function AggregateStats({
  avgCompletionPercentage,
  totalMissingParts,
  avgDelayDays,
  coachesBlockingProgression,
  testingCompleteCount,
  testingTotalCount,
}: AggregateStatsProps) {
  const showTesting = testingTotalCount !== undefined && testingTotalCount > 0;

  return (
    <div className={cn('grid grid-cols-2 gap-3', showTesting ? 'lg:grid-cols-5' : 'lg:grid-cols-4')}>
      <StatCard
        label="Avg. Completion"
        value={`${avgCompletionPercentage}%`}
        icon={<BarChart3 className="h-5 w-5" />}
        iconColor="text-blue-400"
        accent="before:bg-blue-400"
      />
      <StatCard
        label="Missing Parts"
        value={totalMissingParts}
        icon={<PackageX className="h-5 w-5" />}
        iconColor="text-amber-400"
        accent="before:bg-amber-400"
      />
      <StatCard
        label="Avg. Delay"
        value={avgDelayDays > 0 ? `${avgDelayDays} days` : 'None'}
        icon={<Clock className="h-5 w-5" />}
        iconColor="text-orange-400"
        accent="before:bg-orange-400"
      />
      <StatCard
        label="Blocking Progression"
        value={coachesBlockingProgression}
        icon={<AlertTriangle className="h-5 w-5" />}
        iconColor="text-red-400"
        accent="before:bg-red-400"
      />
      {showTesting && (
        <StatCard
          label="Testing Complete"
          value={`${testingCompleteCount ?? 0}/${testingTotalCount}`}
          icon={<FlaskConical className="h-5 w-5" />}
          iconColor="text-green-500"
          accent="before:bg-green-500"
        />
      )}
    </div>
  );
}
