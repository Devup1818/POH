import { differenceInDays, differenceInHours, addDays } from 'date-fns';
import type { POHStage, TimelineStatus } from '@/types';
import { TARGET_DURATIONS, POH_STAGE_ORDER, DELAY_THRESHOLDS } from '@/lib/constants';

/**
 * Classify timeline status based on actual vs target days.
 *
 * - actual < target  → 'Ahead of Schedule'
 * - actual === target → 'On Schedule'
 * - actual <= target + 2 → 'Minor Delay'
 * - actual > target + 2 → 'Significant Delay'
 */
export function calculateTimelineStatus(
  actualDays: number,
  targetDays: number,
  thresholds?: { minor: { min: number; max: number }; significant: { min: number } },
): TimelineStatus {
  const t = thresholds ?? DELAY_THRESHOLDS;
  const diff = actualDays - targetDays;

  if (diff < 0) return 'Ahead of Schedule';
  if (diff === 0) return 'On Schedule';
  if (diff <= t.minor.max) return 'Minor Delay';
  return 'Significant Delay';
}

export interface StageHistoryEntry {
  stage: POHStage;
  startDate: string;
  completionDate: string | null;
  targetDurationDays: number;
  actualDurationDays: number | null;
}

/**
 * Calculate estimated completion date for a coach based on current stage,
 * elapsed time in current stage, and remaining stage target durations.
 */
export function calculateEstimatedCompletion(
  stageHistory: StageHistoryEntry[],
  currentStage: POHStage,
  stageStartDate: Date | string,
  targetDurations: Record<POHStage, number> = TARGET_DURATIONS,
): Date {
  const now = new Date();
  const start = typeof stageStartDate === 'string' ? new Date(stageStartDate) : stageStartDate;

  // Days elapsed in current stage
  const elapsedInCurrent = Math.max(0, differenceInDays(now, start));

  // Remaining days in current stage (at least 0)
  const targetForCurrent = targetDurations[currentStage];
  const remainingInCurrent = Math.max(0, targetForCurrent - elapsedInCurrent);

  // Sum target durations for all stages after current
  const currentIdx = POH_STAGE_ORDER.indexOf(currentStage);
  let remainingAfterCurrent = 0;
  for (let i = currentIdx + 1; i < POH_STAGE_ORDER.length; i++) {
    remainingAfterCurrent += targetDurations[POH_STAGE_ORDER[i]];
  }

  return addDays(now, remainingInCurrent + remainingAfterCurrent);
}

/**
 * Calculate elapsed time since a start date.
 * Returns days and hours.
 */
export function calculateElapsedTime(
  startDate: Date | string,
): { days: number; hours: number } {
  const now = new Date();
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const totalHours = Math.max(0, differenceInHours(now, start));
  return {
    days: Math.floor(totalHours / 24),
    hours: totalHours % 24,
  };
}

/**
 * Calculate rake-level estimated completion as the latest estimated
 * completion date among all coaches.
 */
export function calculateRakeEstimatedCompletion(
  coaches: Array<{
    currentStage: POHStage;
    stageStartDate: Date | string;
    stageHistory: StageHistoryEntry[];
  }>,
  targetDurations: Record<POHStage, number> = TARGET_DURATIONS,
): Date {
  if (coaches.length === 0) return new Date();

  let latest = new Date(0);
  for (const coach of coaches) {
    const est = calculateEstimatedCompletion(
      coach.stageHistory,
      coach.currentStage,
      coach.stageStartDate,
      targetDurations,
    );
    if (est > latest) latest = est;
  }
  return latest;
}

/**
 * Get delay duration in days (0 if not delayed).
 */
export function getDelayDuration(actualDays: number, targetDays: number): number {
  return Math.max(0, actualDays - targetDays);
}

/**
 * Get percentage of target duration consumed.
 */
export function getPercentageConsumed(elapsedDays: number, targetDays: number): number {
  if (targetDays <= 0) return 100;
  return Math.round((elapsedDays / targetDays) * 100);
}

/**
 * Get the color class for a timeline status (Tailwind).
 */
export function getTimelineStatusColor(status: TimelineStatus): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'On Schedule':
    case 'Ahead of Schedule':
      return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-400' };
    case 'Minor Delay':
      return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-400' };
    case 'Significant Delay':
      return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-400' };
  }
}
