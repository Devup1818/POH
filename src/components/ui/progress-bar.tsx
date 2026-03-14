import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  value: number; // 0-100
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'yellow' | 'red';
  className?: string;
}

const heightStyles = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
} as const;

const barColors = {
  blue: 'bg-blue-600',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
} as const;

export function ProgressBar({
  value,
  showLabel = false,
  size = 'md',
  color = 'blue',
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('w-full overflow-hidden rounded-full bg-gray-200', heightStyles[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-300', barColors[color])}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-gray-600 tabular-nums">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}
