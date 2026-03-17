'use client';

import { cn } from '@/lib/utils';

export interface DashboardMetric {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor: string;
  accent: string;
}

interface MetricsCardsProps {
  metrics: DashboardMetric[];
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {metrics.map((metric, index) => (
        <div
          key={metric.label}
          className="animate-card-in"
          style={{ animationDelay: `${index * 40}ms` }}
        >
          <div
            className={cn(
              'relative overflow-hidden rounded-xl bg-white/70 backdrop-blur-sm p-4',
              'border border-gray-100/60',
              'transition-all duration-200 hover:bg-white/90 hover:shadow-sm',
            )}
          >
            <div className={cn('absolute top-0 left-0 h-full w-[2px]', metric.accent)} />
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  {metric.label}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900 tabular-nums">
                  {metric.value}
                </p>
              </div>
              <div className={cn('rounded-lg bg-gray-50/80 p-1.5', metric.iconColor)}>
                {metric.icon}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
