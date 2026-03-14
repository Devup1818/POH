'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { WarningIndicator } from '@/components/ui/warning-indicator';
import { Tooltip } from '@/components/ui/tooltip';
import { MessageSquare } from 'lucide-react';
import { getDelayDuration, getTimelineStatusColor } from '@/lib/utils/timeline';
import type { POHStage, TimelineStatus } from '@/types';

export interface CoachCardData {
  id: string;
  coachNumber: string;
  coachType?: string;
  currentStage: POHStage;
  timelineStatus: TimelineStatus;
  missingPartsCount: number;
  checklistCompletion: number;
  elapsedDaysInStage: number;
  completionPercentage: number;
  noteCount?: number;
  /** Target days for current stage, used to compute delay duration */
  targetDaysInStage?: number;
}

export interface CoachGridProps {
  rakeId: string;
  coaches: CoachCardData[];
  selectedCoachIds?: Set<string>;
  onToggleSelect?: (coachId: string) => void;
  selectionEnabled?: boolean;
  /** If true, Admin can click coach type badge to toggle MC/TC */
  allowCoachTypeEdit?: boolean;
  onCoachTypeChange?: (coachId: string, newType: 'MC' | 'TC') => void;
}

const BORDER_COLORS: Record<TimelineStatus, string> = {
  'On Schedule': 'border-l-green-400',
  'Ahead of Schedule': 'border-l-green-400',
  'Minor Delay': 'border-l-yellow-400',
  'Significant Delay': 'border-l-red-400',
};

const STAGE_BADGE_VARIANT: Record<POHStage, 'default' | 'info' | 'warning' | 'success' | 'purple' | 'blue' | 'gray'> = {
  Intake: 'gray',
  Dismantling: 'warning',
  Inspection: 'default',
  Reassembly: 'info',
  Finishing: 'purple',
  Testing: 'blue',
  Trial: 'info',
  Release: 'success',
};

export function CoachGrid({
  rakeId,
  coaches,
  selectedCoachIds,
  onToggleSelect,
  selectionEnabled = false,
  allowCoachTypeEdit = false,
  onCoachTypeChange,
}: CoachGridProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-gray-800">
        Coaches ({coaches.length})
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {coaches.map((coach) => (
          <CoachCard
            key={coach.id}
            rakeId={rakeId}
            coach={coach}
            isSelected={selectedCoachIds?.has(coach.id) ?? false}
            onToggleSelect={onToggleSelect}
            selectionEnabled={selectionEnabled}
            allowCoachTypeEdit={allowCoachTypeEdit}
            onCoachTypeChange={onCoachTypeChange}
          />
        ))}
      </div>
    </div>
  );
}

function CoachCard({
  rakeId,
  coach,
  isSelected,
  onToggleSelect,
  selectionEnabled,
  allowCoachTypeEdit,
  onCoachTypeChange,
}: {
  rakeId: string;
  coach: CoachCardData;
  isSelected: boolean;
  onToggleSelect?: (coachId: string) => void;
  selectionEnabled: boolean;
  allowCoachTypeEdit?: boolean;
  onCoachTypeChange?: (coachId: string, newType: 'MC' | 'TC') => void;
}) {
  const hasMissing = coach.missingPartsCount > 0;
  const delayDays = coach.targetDaysInStage
    ? getDelayDuration(coach.elapsedDaysInStage, coach.targetDaysInStage)
    : 0;
  const isDelayed = coach.timelineStatus === 'Minor Delay' || coach.timelineStatus === 'Significant Delay';

  const tooltipContent = (
    <div className="space-y-1 text-left">
      <p className="font-semibold">Coach {coach.coachNumber}</p>
      <p>Stage: {coach.currentStage}</p>
      <p>Elapsed: {coach.elapsedDaysInStage} day(s) in stage</p>
      <p>Status: {coach.timelineStatus}</p>
      <p>Missing Parts: {coach.missingPartsCount}</p>
      <p>Checklist: {coach.checklistCompletion}%</p>
      <p>Notes: {coach.noteCount ?? 0}</p>
    </div>
  );

  const handleCheckboxChange = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleSelect?.(coach.id);
  };

  return (
    <Tooltip content={tooltipContent} position="top">
      <div className="relative">
        {/* Checkbox overlay */}
        {selectionEnabled && (
          <button
            onClick={handleCheckboxChange}
            className={cn(
              'absolute left-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded border transition-colors',
              isSelected
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-gray-300 bg-white hover:border-blue-400',
            )}
            aria-label={`Select coach ${coach.coachNumber}`}
          >
            {isSelected && (
              <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6L5 9L10 3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        )}

        <Link
          href={`/rakes/${rakeId}/coaches/${coach.id}`}
          className={cn(
            'group flex flex-col rounded-lg border border-gray-100 border-l-[3px] bg-white p-3',
            'shadow-sm transition-all duration-150 hover:shadow-md hover:border-gray-200',
            BORDER_COLORS[coach.timelineStatus],
            selectionEnabled && 'pl-8',
            isSelected && 'ring-2 ring-blue-500 ring-offset-1',
          )}
        >
          {/* Coach number + type + warnings */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-gray-800">
                {coach.coachNumber}
              </span>
              {coach.coachType && (
                allowCoachTypeEdit && onCoachTypeChange ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onCoachTypeChange(coach.id, coach.coachType === 'MC' ? 'TC' : 'MC');
                    }}
                    className={cn(
                      'rounded px-1 py-0.5 text-[10px] font-medium cursor-pointer transition-colors',
                      coach.coachType === 'MC'
                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        : 'bg-amber-50 text-amber-600 hover:bg-amber-100',
                    )}
                    title={`Click to change to ${coach.coachType === 'MC' ? 'TC' : 'MC'}`}
                  >
                    {coach.coachType}
                  </button>
                ) : (
                  <span className={cn(
                    'rounded px-1 py-0.5 text-[10px] font-medium',
                    coach.coachType === 'MC'
                      ? 'bg-blue-50 text-blue-600'
                      : 'bg-amber-50 text-amber-600',
                  )}>
                    {coach.coachType}
                  </span>
                )
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {hasMissing && (
                <WarningIndicator
                  type="missing-parts"
                  count={coach.missingPartsCount}
                  tooltip={`${coach.missingPartsCount} missing part(s)`}
                />
              )}
            </div>
          </div>

          {/* Stage badge */}
          <div className="mt-2">
            <Badge variant={STAGE_BADGE_VARIANT[coach.currentStage]} size="sm">
              {coach.currentStage}
            </Badge>
          </div>

          {/* Checklist completion */}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] text-gray-400">Checklist</span>
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                coach.checklistCompletion >= 80
                  ? 'bg-green-50 text-green-700'
                  : coach.checklistCompletion >= 40
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-gray-50 text-gray-600',
              )}
            >
              {coach.checklistCompletion}%
            </span>
          </div>

          {/* Delay duration indicator */}
          {isDelayed && delayDays > 0 && (
            <div className={cn(
              'mt-1.5 rounded px-1.5 py-0.5 text-[10px] font-medium',
              coach.timelineStatus === 'Significant Delay'
                ? 'bg-red-50 text-red-600'
                : 'bg-yellow-50 text-yellow-600',
            )}>
              +{delayDays}d delay
            </div>
          )}

          {/* Note count indicator */}
          {(coach.noteCount ?? 0) > 0 && (
            <div className="mt-1.5 flex items-center gap-1 text-[10px] text-gray-400">
              <MessageSquare className="h-3 w-3" />
              <span>{coach.noteCount} note{coach.noteCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </Link>
      </div>
    </Tooltip>
  );
}
