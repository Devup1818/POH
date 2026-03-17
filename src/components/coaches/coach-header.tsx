'use client';

import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ComparisonBadge } from './comparison-badge';
import type { POHStage, POHType, TimelineStatus } from '@/types';

export interface CoachHeaderProps {
  coachNumber: string;
  coachType?: string;
  rakeId: string;
  rakeNumber: string;
  pohType: POHType;
  currentStage: POHStage;
  elapsedDaysInStage: number;
  timelineStatus: TimelineStatus;
  completionPercentage: number;
  rakeAverageProgress: number;
  prevCoachId: string | null;
  nextCoachId: string | null;
}

const timelineColors: Record<TimelineStatus, { bar: string; text: string; bg: string }> = {
  'On Schedule': { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  'Ahead of Schedule': { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  'Minor Delay': { bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
  'Significant Delay': { bar: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
};

export function CoachHeader({
  coachNumber, coachType, rakeId, rakeNumber, pohType,
  currentStage, elapsedDaysInStage, timelineStatus,
  completionPercentage, rakeAverageProgress, prevCoachId, nextCoachId,
}: CoachHeaderProps) {
  const colors = timelineColors[timelineStatus];

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {/* Thin progress accent */}
      <div className="h-1 bg-gray-100">
        <div
          className={cn('h-full transition-all duration-500 ease-out rounded-r-full', colors.bar)}
          style={{ width: `${completionPercentage}%` }}
        />
      </div>

      <div className="px-5 py-4">
        {/* Top row: breadcrumb + nav */}
        <div className="flex items-center justify-between mb-3">
          <Link
            href={`/rakes/${rakeId}`}
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Rake {rakeNumber}
          </Link>

          <div className="flex items-center gap-0.5">
            {prevCoachId ? (
              <Link
                href={`/rakes/${rakeId}/coaches/${prevCoachId}`}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"
                aria-label="Previous coach"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
            ) : (
              <span className="rounded-lg p-1.5 text-gray-200"><ChevronLeft className="h-4 w-4" /></span>
            )}
            {nextCoachId ? (
              <Link
                href={`/rakes/${rakeId}/coaches/${nextCoachId}`}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all"
                aria-label="Next coach"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="rounded-lg p-1.5 text-gray-200"><ChevronRight className="h-4 w-4" /></span>
            )}
          </div>
        </div>

        {/* Main row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900 tracking-tight">
              Coach {coachNumber}
            </h1>
            <div className="flex items-center gap-1.5">
              {coachType && (
                <span className={cn(
                  'rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  coachType === 'MC' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600',
                )}>
                  {coachType}
                </span>
              )}
              <span className="rounded-md bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">{pohType}</span>
            </div>
          </div>

          {/* Right side: stage + timing */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-xs">
              <span className={cn('rounded-full px-2.5 py-1 font-medium', colors.bg, colors.text)}>
                {currentStage}
              </span>
              <div className="flex items-center gap-1 text-gray-500">
                <Clock className="h-3.5 w-3.5" />
                <span className="tabular-nums">Day <span className="font-semibold text-gray-700">{elapsedDaysInStage}</span></span>
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <Gauge className="h-3.5 w-3.5" />
                <span className="tabular-nums font-semibold text-gray-700">{completionPercentage}%</span>
              </div>
            </div>
            <ComparisonBadge coachProgress={completionPercentage} rakeAverage={rakeAverageProgress} />
          </div>
        </div>
      </div>
    </div>
  );
}
