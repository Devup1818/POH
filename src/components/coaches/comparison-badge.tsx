'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ComparisonBadgeProps {
  coachProgress: number;
  rakeAverage: number;
  className?: string;
}

export function ComparisonBadge({ coachProgress, rakeAverage, className }: ComparisonBadgeProps) {
  const diff = coachProgress - rakeAverage;
  const absDiff = Math.abs(diff);

  let label: string;
  let Icon: typeof TrendingUp;
  let colorClass: string;

  if (diff > 0) {
    label = `${absDiff}% ahead`;
    Icon = TrendingUp;
    colorClass = 'bg-green-50 text-green-700 border-green-200';
  } else if (diff < 0) {
    label = `${absDiff}% behind`;
    Icon = TrendingDown;
    colorClass = 'bg-red-50 text-red-700 border-red-200';
  } else {
    label = 'At average';
    Icon = Minus;
    colorClass = 'bg-gray-50 text-gray-600 border-gray-200';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        colorClass,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
