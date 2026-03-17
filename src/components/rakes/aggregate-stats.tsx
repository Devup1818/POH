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

interface StatRowProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  valueColor?: string;
}

function StatRow({ label, value, icon, iconBg, valueColor = 'text-gray-700' }: StatRowProps) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
        iconBg,
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-gray-400 leading-none">{label}</p>
        <p className={cn('text-sm font-semibold tabular-nums tracking-tight leading-snug', valueColor)}>
          {value}
        </p>
      </div>
    </div>
  );
}

export function AggregateStats({
  avgCompletionPercentage, totalMissingParts, avgDelayDays,
  coachesBlockingProgression, testingCompleteCount, testingTotalCount,
}: AggregateStatsProps) {
  const showTesting = testingTotalCount !== undefined && testingTotalCount > 0;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-800 mb-0.5">Quick Stats</h2>
      <div className="divide-y divide-gray-50">
        <StatRow
          label="Avg. Completion"
          value={`${avgCompletionPercentage}%`}
          icon={<BarChart3 className="h-3.5 w-3.5 text-blue-400" />}
          iconBg="bg-blue-50/80"
          valueColor={avgCompletionPercentage >= 75 ? 'text-emerald-600' : avgCompletionPercentage >= 40 ? 'text-blue-600' : 'text-gray-700'}
        />
        <StatRow
          label="Missing Parts"
          value={totalMissingParts}
          icon={<PackageX className="h-3.5 w-3.5 text-amber-400" />}
          iconBg="bg-amber-50/80"
          valueColor={totalMissingParts > 0 ? 'text-amber-600' : 'text-gray-700'}
        />
        <StatRow
          label="Avg. Delay"
          value={avgDelayDays > 0 ? `${avgDelayDays}d` : 'None'}
          icon={<Clock className="h-3.5 w-3.5 text-orange-400" />}
          iconBg="bg-orange-50/80"
          valueColor={avgDelayDays > 0 ? 'text-orange-500' : 'text-gray-700'}
        />
        <StatRow
          label="Blocking"
          value={coachesBlockingProgression}
          icon={<AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
          iconBg="bg-red-50/80"
          valueColor={coachesBlockingProgression > 0 ? 'text-red-500' : 'text-gray-700'}
        />
        {showTesting && (
          <StatRow
            label="Testing"
            value={`${testingCompleteCount ?? 0}/${testingTotalCount}`}
            icon={<FlaskConical className="h-3.5 w-3.5 text-emerald-400" />}
            iconBg="bg-emerald-50/80"
          />
        )}
      </div>
    </div>
  );
}
