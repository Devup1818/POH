import { describe, it, expect } from 'vitest';
import {
  calculateTimelineStatus,
  calculateEstimatedCompletion,
  calculateElapsedTime,
  calculateRakeEstimatedCompletion,
  getDelayDuration,
  getPercentageConsumed,
  getTimelineStatusColor,
} from './timeline';

describe('calculateTimelineStatus', () => {
  it('returns "Ahead of Schedule" when actual < target', () => {
    expect(calculateTimelineStatus(1, 3)).toBe('Ahead of Schedule');
  });

  it('returns "On Schedule" when actual === target', () => {
    expect(calculateTimelineStatus(3, 3)).toBe('On Schedule');
  });

  it('returns "Minor Delay" when actual exceeds target by 1', () => {
    expect(calculateTimelineStatus(4, 3)).toBe('Minor Delay');
  });

  it('returns "Minor Delay" when actual exceeds target by 2', () => {
    expect(calculateTimelineStatus(5, 3)).toBe('Minor Delay');
  });

  it('returns "Significant Delay" when actual exceeds target by 3+', () => {
    expect(calculateTimelineStatus(6, 3)).toBe('Significant Delay');
  });

  it('respects custom thresholds', () => {
    const thresholds = { minor: { min: 1, max: 5 }, significant: { min: 6 } };
    expect(calculateTimelineStatus(8, 3, thresholds)).toBe('Minor Delay');
    expect(calculateTimelineStatus(9, 3, thresholds)).toBe('Significant Delay');
  });
});

describe('getDelayDuration', () => {
  it('returns 0 when not delayed', () => {
    expect(getDelayDuration(2, 3)).toBe(0);
    expect(getDelayDuration(3, 3)).toBe(0);
  });

  it('returns positive delay when over target', () => {
    expect(getDelayDuration(5, 3)).toBe(2);
    expect(getDelayDuration(10, 3)).toBe(7);
  });
});

describe('getPercentageConsumed', () => {
  it('returns 0 when no time elapsed', () => {
    expect(getPercentageConsumed(0, 5)).toBe(0);
  });

  it('returns 100 when fully consumed', () => {
    expect(getPercentageConsumed(5, 5)).toBe(100);
  });

  it('returns over 100 when over target', () => {
    expect(getPercentageConsumed(10, 5)).toBe(200);
  });

  it('returns 100 when target is 0', () => {
    expect(getPercentageConsumed(3, 0)).toBe(100);
  });
});

describe('calculateElapsedTime', () => {
  it('returns days and hours from a past date', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const result = calculateElapsedTime(twoDaysAgo);
    expect(result.days).toBe(2);
    expect(result.hours).toBe(0);
  });

  it('accepts string dates', () => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const result = calculateElapsedTime(oneDayAgo);
    expect(result.days).toBe(1);
  });

  it('returns 0 for future dates', () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const result = calculateElapsedTime(tomorrow);
    expect(result.days).toBe(0);
    expect(result.hours).toBe(0);
  });
});

describe('calculateEstimatedCompletion', () => {
  it('returns a future date based on remaining stages', () => {
    const now = new Date();
    const result = calculateEstimatedCompletion([], 'Intake', now);
    // Should be at least today (remaining = 1 day for Intake + 19 for rest = ~20 days)
    expect(result.getTime()).toBeGreaterThanOrEqual(now.getTime());
  });

  it('returns closer date for later stages', () => {
    const now = new Date();
    const intakeEst = calculateEstimatedCompletion([], 'Intake', now);
    const releaseEst = calculateEstimatedCompletion([], 'Release', now);
    expect(intakeEst.getTime()).toBeGreaterThan(releaseEst.getTime());
  });
});

describe('calculateRakeEstimatedCompletion', () => {
  it('returns the latest estimated completion among coaches', () => {
    const now = new Date();
    const coaches = [
      { currentStage: 'Release' as const, stageStartDate: now, stageHistory: [] },
      { currentStage: 'Intake' as const, stageStartDate: now, stageHistory: [] },
    ];
    const result = calculateRakeEstimatedCompletion(coaches);
    // The Intake coach should have the latest estimated completion
    const intakeEst = calculateEstimatedCompletion([], 'Intake', now);
    expect(result.getTime()).toBeCloseTo(intakeEst.getTime(), -3);
  });

  it('returns current date for empty coaches array', () => {
    const result = calculateRakeEstimatedCompletion([]);
    expect(result.getTime()).toBeCloseTo(Date.now(), -3);
  });
});

describe('getTimelineStatusColor', () => {
  it('returns green for On Schedule', () => {
    const result = getTimelineStatusColor('On Schedule');
    expect(result.bg).toContain('green');
  });

  it('returns green for Ahead of Schedule', () => {
    const result = getTimelineStatusColor('Ahead of Schedule');
    expect(result.bg).toContain('green');
  });

  it('returns yellow for Minor Delay', () => {
    const result = getTimelineStatusColor('Minor Delay');
    expect(result.bg).toContain('yellow');
  });

  it('returns red for Significant Delay', () => {
    const result = getTimelineStatusColor('Significant Delay');
    expect(result.bg).toContain('red');
  });
});
