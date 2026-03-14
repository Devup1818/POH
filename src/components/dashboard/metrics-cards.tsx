'use client';

import { cn } from '@/lib/utils';

export interface DashboardMetric {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor: string;   // pastel icon color e.g. 'text-blue-400'
  accent: string;       // left border accent
}

interface MetricsCardsProps {
  metrics: DashboardMetric[];
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className={cn(
            'relative overflow-hidden rounded-xl border border-gray-100 bg-white p-4 shadow-sm',
            'before:absolute before:inset-y-0 before:left-0 before:w-[3px]',
            metric.accent,
          )}
        >
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                {metric.label}
              </p>
              <p className="mt-1.5 text-2xl font-semibold tracking-tight text-gray-900">
                {metric.value}
              </p>
            </div>
            <div className={cn('mt-0.5', metric.iconColor)}>{metric.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
