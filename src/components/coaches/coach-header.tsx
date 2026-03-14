'use client';

import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Badge, StatusBadge } from '@/components/ui/badge';
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

const timelineColorMap: Record<TimelineStatus, string> = {
  'On Schedule': 'border-l-green-500',
  'Ahead of Schedule': 'border-l-green-500',
  'Minor Delay': 'border-l-yellow-500',
  'Significant Delay': 'border-l-red-500',
};

export function CoachHeader({
  coachNumber,
  coachType,
  rakeId,
  rakeNumber,
  pohType,
  currentStage,
  elapsedDaysInStage,
  timelineStatus,
  completionPercentage,
  rakeAverageProgress,
  prevCoachId,
  nextCoachId,
}: CoachHeaderProps) {
  return (
    <div className={`rounded-lg border border-gray-200 border-l-4 bg-white p-4 shadow-sm ${timelineColorMap[timelineStatus]}`}>
      {/* Top row: back link + nav arrows */}
      <div className="mb-3 flex items-center justify-between">
        <Link
          href={`/rakes/${rakeId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Rake {rakeNumber}
        </Link>

        <div className="flex items-center gap-1">
          {prevCoachId ? (
            <Link
              href={`/rakes/${rakeId}/coaches/${prevCoachId}`}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              aria-label="Previous coach"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          ) : (
            <span className="rounded-md p-1.5 text-gray-200 cursor-not-allowed">
              <ChevronLeft className="h-5 w-5" />
            </span>
          )}
          {nextCoachId ? (
            <Link
              href={`/rakes/${rakeId}/coaches/${nextCoachId}`}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              aria-label="Next coach"
            >
              <ChevronRight className="h-5 w-5" />
            </Link>
          ) : (
            <span className="rounded-md p-1.5 text-gray-200 cursor-not-allowed">
              <ChevronRight className="h-5 w-5" />
            </span>
          )}
        </div>
      </div>

      {/* Main info */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Coach {coachNumber}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {coachType && (
              <Badge variant={coachType === 'MC' ? 'info' : 'warning'} size="sm">{coachType}</Badge>
            )}
            <Badge variant="blue" size="sm">{pohType}</Badge>
            <Badge variant="purple" size="sm">{currentStage}</Badge>
            <StatusBadge status={timelineStatus} size="sm" />
            <ComparisonBadge
              coachProgress={completionPercentage}
              rakeAverage={rakeAverageProgress}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>
            Day <span className="font-semibold text-gray-700">{elapsedDaysInStage}</span> in {currentStage}
          </span>
        </div>
      </div>
    </div>
  );
}
