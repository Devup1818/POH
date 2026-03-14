'use client';

import { CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { TARGET_DURATIONS } from '@/lib/constants';
import { calculateTimelineStatus, calculateElapsedTime, getDelayDuration } from '@/lib/utils/timeline';
import { formatDateIST } from '@/lib/utils/date';
import type { POHStage, TimelineStatus } from '@/types';

export interface StageHistoryEntry {
  stage: POHStage;
  startDate: string;
  completionDate: string | null;
  targetDurationDays: number;
  actualDurationDays: number | null;
  timelineStatus: TimelineStatus | null;
}

export interface StageTimelineProps {
  stageHistory: StageHistoryEntry[];
  currentStage: POHStage;
}



const statusColorMap: Record<TimelineStatus, string> = {
  'On Schedule': 'bg-green-500',
  'Ahead of Schedule': 'bg-green-500',
  'Minor Delay': 'bg-yellow-500',
  'Significant Delay': 'bg-red-500',
};

const statusBorderMap: Record<TimelineStatus, string> = {
  'On Schedule': 'border-green-500',
  'Ahead of Schedule': 'border-green-500',
  'Minor Delay': 'border-yellow-500',
  'Significant Delay': 'border-red-500',
};

export function StageTimeline({ stageHistory, currentStage }: StageTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-gray-900">Stage Timeline</h3>
      </CardHeader>
      <CardBody className="px-4 py-3">
        <div className="space-y-0">
          {stageHistory.map((entry, idx) => {
            const isCompleted = entry.completionDate !== null;
            const isCurrent = entry.stage === currentStage && !isCompleted;
            const isNotStarted = !isCompleted && !isCurrent;

            const elapsedDays = isCurrent
              ? calculateElapsedTime(entry.startDate).days
              : entry.actualDurationDays;

            // Compute timeline status for current stage using real calculation
            const computedStatus = isCurrent && elapsedDays !== null
              ? calculateTimelineStatus(elapsedDays, entry.targetDurationDays)
              : entry.timelineStatus;

            const delayDays = isCurrent && elapsedDays !== null
              ? getDelayDuration(elapsedDays, entry.targetDurationDays)
              : isCompleted && entry.actualDurationDays !== null
                ? getDelayDuration(entry.actualDurationDays, entry.targetDurationDays)
                : 0;

            return (
              <div key={entry.stage} className="relative flex gap-3">
                {/* Vertical connector line */}
                {idx < stageHistory.length - 1 && (
                  <div
                    className={cn(
                      'absolute left-[11px] top-6 w-0.5 h-[calc(100%-12px)]',
                      isCompleted
                        ? (entry.timelineStatus ? statusColorMap[entry.timelineStatus] : 'bg-green-500')
                        : 'bg-gray-200',
                    )}
                  />
                )}

                {/* Icon */}
                <div className="relative z-10 flex-shrink-0 pt-0.5">
                  {isCompleted ? (
                    <CheckCircle2
                      className={cn(
                        'h-6 w-6',
                        entry.timelineStatus === 'Significant Delay'
                          ? 'text-red-500'
                          : entry.timelineStatus === 'Minor Delay'
                            ? 'text-yellow-500'
                            : 'text-green-500',
                      )}
                    />
                  ) : isCurrent ? (
                    <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                  ) : (
                    <Circle className="h-6 w-6 text-gray-300" />
                  )}
                </div>

                {/* Content */}
                <div
                  className={cn(
                    'flex-1 rounded-md border p-3 mb-3',
                    isCurrent
                      ? 'border-blue-300 bg-blue-50'
                      : isCompleted
                        ? `border-gray-200 bg-white ${entry.timelineStatus ? statusBorderMap[entry.timelineStatus] : ''} border-l-2`
                        : 'border-gray-100 bg-gray-50',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        isCurrent ? 'text-blue-700' : isCompleted ? 'text-gray-900' : 'text-gray-400',
                      )}
                    >
                      {entry.stage}
                    </span>
                    {isCompleted && entry.timelineStatus && (
                      <span
                        className={cn(
                          'text-xs font-medium px-1.5 py-0.5 rounded-full',
                          entry.timelineStatus === 'Significant Delay'
                            ? 'bg-red-100 text-red-700'
                            : entry.timelineStatus === 'Minor Delay'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700',
                        )}
                      >
                        {entry.timelineStatus}
                      </span>
                    )}
                    {isCurrent && (
                      <span className={cn(
                        'text-xs font-medium px-1.5 py-0.5 rounded-full',
                        computedStatus === 'Significant Delay'
                          ? 'bg-red-100 text-red-700'
                          : computedStatus === 'Minor Delay'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700',
                      )}>
                        {computedStatus === 'On Schedule' || computedStatus === 'Ahead of Schedule'
                          ? 'In Progress'
                          : computedStatus}
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    {entry.startDate && (
                      <span>Start: {formatDateIST(entry.startDate)}</span>
                    )}
                    {isCompleted && entry.completionDate && (
                      <span>End: {formatDateIST(entry.completionDate)}</span>
                    )}
                    <span>Target: {entry.targetDurationDays}d</span>
                    {isCompleted && entry.actualDurationDays !== null && (
                      <span>Actual: {entry.actualDurationDays}d</span>
                    )}
                    {isCurrent && elapsedDays !== null && (
                      <span className="font-medium text-blue-600">
                        Elapsed: {elapsedDays}d / {entry.targetDurationDays}d
                      </span>
                    )}
                    {isNotStarted && (
                      <span className="italic">Target: {entry.targetDurationDays}d</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
