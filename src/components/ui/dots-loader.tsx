'use client';

import { cn } from '@/lib/utils';

interface DotsLoaderProps {
  className?: string;
  /** Dot size — defaults to 'md' */
  size?: 'sm' | 'md' | 'lg';
  /** Dot color — defaults to gray */
  color?: 'gray' | 'blue' | 'white';
}

const SIZE_MAP = {
  sm: 'h-1 w-1',
  md: 'h-1.5 w-1.5',
  lg: 'h-2 w-2',
};

const COLOR_MAP = {
  gray: 'bg-gray-400',
  blue: 'bg-blue-500',
  white: 'bg-white',
};

export function DotsLoader({ className, size = 'md', color = 'gray' }: DotsLoaderProps) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)} role="status" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn('rounded-full animate-bounce', SIZE_MAP[size], COLOR_MAP[color])}
          style={{ animationDelay: `${i * 150}ms`, animationDuration: '600ms' }}
        />
      ))}
    </span>
  );
}

/** Full-page centered dots loader for page loading states */
export function PageLoader({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <DotsLoader size="lg" color="blue" />
      {message && <p className="text-xs text-gray-400">{message}</p>}
    </div>
  );
}
