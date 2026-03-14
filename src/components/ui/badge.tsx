'use client';

import { cn } from '@/lib/utils';
import type { TimelineStatus } from '@/types';

const statusColors: Record<TimelineStatus, string> = {
  'On Schedule': 'bg-green-100 text-green-800',
  'Ahead of Schedule': 'bg-green-100 text-green-800',
  'Minor Delay': 'bg-yellow-100 text-yellow-800',
  'Significant Delay': 'bg-red-100 text-red-800',
};

const sizeStyles = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-2.5 py-1 text-sm',
} as const;

export interface StatusBadgeProps {
  status: TimelineStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium whitespace-nowrap',
        statusColors[status],
        sizeStyles[size],
        className,
      )}
    >
      {status}
    </span>
  );
}

const badgeVariants = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  gray: 'bg-gray-100 text-gray-600',
  outline: 'border border-gray-300 text-gray-600 bg-white',
} as const;

export interface BadgeProps {
  children: React.ReactNode;
  variant?: keyof typeof badgeVariants;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium whitespace-nowrap',
        badgeVariants[variant],
        sizeStyles[size],
        className,
      )}
    >
      {children}
    </span>
  );
}
