'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { WarningIndicator } from '@/components/ui/warning-indicator';
import { Tooltip } from '@/components/ui/tooltip';
import { MessageSquare } from 'lucide-react';
import { StageIcon } from '@/components/coaches/stage-icons';
import { getDelayDuration } from '@/lib/utils/timeline';
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
  targetDaysInStage?: number;
}

export interface CoachGridProps {
  rakeId: string;
  coaches: CoachCardData[];
  selectedCoachIds?: Set<string>;
  onToggleSelect?: (coachId: string) => void;
  selectionEnabled?: boolean;
  allowCoachTypeEdit?: boolean;
  onCoachTypeChange?: (coachId: string, newType: 'MC' | 'TC') => void;
}

const STATUS_ACCENT: Record<TimelineStatus, string> = {
  'On Schedule': 'bg-emerald-400',
  'Ahead of Schedule': 'bg-emerald-400',
  'Minor Delay': 'bg-amber-400',
  'Significant Delay': 'bg-red-400',
};

const STAGE_BADGE_VARIANT: Record<POHStage, 'default' | 'info' | 'warning' | 'success' | 'purple' | 'blue' | 'gray'> = {
  Intake: 'gray',
  Dismantling: 'warning',
  Inspection: 'default',
  Overhaul: 'info',
  Reassembly: 'info',
  Finishing: 'purple',
  Testing: 'blue',
  Trial: 'info',
  Release: 'success',
};

export function CoachGrid({
  rakeId, coaches, selectedCoachIds, onToggleSelect,
  selectionEnabled = false, allowCoachTypeEdit = false, onCoachTypeChange,
}: CoachGridProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-gray-800">
        Coaches <span className="text-gray-400 font-normal">({coaches.length})</span>
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {coaches.map((coach, index) => (
          <div key={coach.id} className="animate-card-in" style={{ animationDelay: `${index * 25}ms` }}>
            <CoachCard
              rakeId={rakeId} coach={coach}
              isSelected={selectedCoachIds?.has(coach.id) ?? false}
              onToggleSelect={onToggleSelect} selectionEnabled={selectionEnabled}
              allowCoachTypeEdit={allowCoachTypeEdit} onCoachTypeChange={onCoachTypeChange}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function CoachCard({
  rakeId, coach, isSelected, onToggleSelect, selectionEnabled, allowCoachTypeEdit, onCoachTypeChange,
}: {
  rakeId: string; coach: CoachCardData; isSelected: boolean;
  onToggleSelect?: (coachId: string) => void; selectionEnabled: boolean;
  allowCoachTypeEdit?: boolean; onCoachTypeChange?: (coachId: string, newType: 'MC' | 'TC') => void;
}) {
  const hasMissing = coach.missingPartsCount > 0;
  const delayDays = coach.targetDaysInStage ? getDelayDuration(coach.elapsedDaysInStage, coach.targetDaysInStage) : 0;
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
    e.preventDefault(); e.stopPropagation();
    onToggleSelect?.(coach.id);
  };

  return (
    <Tooltip content={tooltipContent} position="top">
      <div className="relative">
        {selectionEnabled && (
          <button onClick={handleCheckboxChange}
            className={cn(
              'absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-md border transition-all duration-150',
              isSelected ? 'border-blue-500 bg-blue-500 text-white shadow-sm' : 'border-gray-200 bg-white/90 hover:border-blue-300',
            )}
            aria-label={`Select coach ${coach.coachNumber}`}>
            {isSelected && (
              <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
                <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        )}

        <Link
          href={`/rakes/${rakeId}/coaches/${coach.id}`}
          className={cn(
            'group flex flex-col rounded-xl border bg-[var(--background)] overflow-hidden',
            'transition-all duration-200 hover:shadow-md',
            isSelected
              ? 'border-blue-200 ring-1 ring-blue-100'
              : 'border-gray-100 hover:border-gray-200',
            selectionEnabled && 'pl-8',
          )}
        >
          {/* Status accent line */}
          <div className={cn('h-0.5 w-full', STATUS_ACCENT[coach.timelineStatus])} />

          <div className="px-3 pt-2.5 pb-2.5">
            {/* Coach number + type + stage icon */}
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 transition-colors">
                  {coach.coachNumber}
                </span>
                {coach.coachType && (
                  allowCoachTypeEdit && onCoachTypeChange ? (
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCoachTypeChange(coach.id, coach.coachType === 'MC' ? 'TC' : 'MC'); }}
                      className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-medium cursor-pointer transition-colors',
                        coach.coachType === 'MC' ? 'bg-blue-50 text-blue-500 hover:bg-blue-100' : 'bg-amber-50 text-amber-500 hover:bg-amber-100')}
                      title={`Click to change to ${coach.coachType === 'MC' ? 'TC' : 'MC'}`}>
                      {coach.coachType}
                    </button>
                  ) : (
                    <span className={cn('rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                      coach.coachType === 'MC' ? 'bg-blue-50/80 text-blue-400' : 'bg-amber-50/80 text-amber-400')}>
                      {coach.coachType}
                    </span>
                  )
                )}
              </div>
              <StageIcon stage={coach.currentStage} className="h-3.5 w-3.5 text-gray-300 group-hover:text-gray-400 transition-colors" />
            </div>

            {/* Stage badge */}
            <div className="mt-1.5">
              <Badge variant={STAGE_BADGE_VARIANT[coach.currentStage]} size="sm">{coach.currentStage}</Badge>
            </div>

            {/* Progress bar */}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-gray-400">Checklist</span>
                <span className={cn('text-[10px] font-medium tabular-nums',
                  coach.checklistCompletion >= 80 ? 'text-emerald-500' : coach.checklistCompletion >= 40 ? 'text-blue-500' : 'text-gray-400')}>
                  {coach.checklistCompletion}%
                </span>
              </div>
              <div className="h-1 w-full rounded-full bg-gray-100 overflow-hidden">
                <div className={cn('h-full rounded-full transition-all duration-700 ease-out',
                  coach.checklistCompletion >= 80 ? 'bg-emerald-300' : coach.checklistCompletion >= 40 ? 'bg-blue-300' : 'bg-gray-250')}
                  style={{ width: `${coach.checklistCompletion}%` }} />
              </div>
            </div>

            {/* Bottom row: indicators (only render if there's something to show) */}
            {(hasMissing || (isDelayed && delayDays > 0) || (coach.noteCount ?? 0) > 0) && (
              <div className="mt-2 flex items-center gap-2">
                {hasMissing && <WarningIndicator type="missing-parts" count={coach.missingPartsCount} tooltip={`${coach.missingPartsCount} missing part(s)`} />}
                {isDelayed && delayDays > 0 && (
                  <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-medium',
                    coach.timelineStatus === 'Significant Delay' ? 'bg-red-50 text-red-400' : 'bg-amber-50 text-amber-400')}>
                    +{delayDays}d
                  </span>
                )}
                {(coach.noteCount ?? 0) > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-gray-300">
                    <MessageSquare className="h-2.5 w-2.5" /> {coach.noteCount}
                  </span>
                )}
              </div>
            )}
          </div>
        </Link>
      </div>
    </Tooltip>
  );
}
