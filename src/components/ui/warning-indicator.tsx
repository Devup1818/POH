'use client';

import { AlertTriangle, Clock, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from './tooltip';

const iconMap = {
  'missing-parts': Package,
  'mandatory-items': AlertTriangle,
  delay: Clock,
} as const;

const colorMap = {
  'missing-parts': 'text-orange-500',
  'mandatory-items': 'text-red-500',
  delay: 'text-yellow-600',
} as const;

export interface WarningIndicatorProps {
  type: 'missing-parts' | 'mandatory-items' | 'delay';
  count?: number;
  tooltip?: string;
  className?: string;
}

export function WarningIndicator({ type, count, tooltip, className }: WarningIndicatorProps) {
  const Icon = iconMap[type];

  const content = (
    <span className={cn('relative inline-flex items-center', colorMap[type], className)}>
      <Icon className="h-4 w-4" />
      {count !== undefined && count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </span>
  );

  if (tooltip) {
    return <Tooltip content={tooltip}>{content}</Tooltip>;
  }

  return content;
}
