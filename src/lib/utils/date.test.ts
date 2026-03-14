import { describe, it, expect } from 'vitest';
import { toIST, formatDateIST, formatTimeIST, formatDateTimeIST, getElapsedDays } from './date';

describe('toIST', () => {
  it('converts a UTC midnight date to IST (05:30)', () => {
    // 2025-01-15 00:00 UTC → 2025-01-15 05:30 IST
    const utcDate = new Date('2025-01-15T00:00:00.000Z');
    const ist = toIST(utcDate);
    expect(ist.getHours()).toBe(5);
    expect(ist.getMinutes()).toBe(30);
    expect(ist.getDate()).toBe(15);
  });

  it('handles date string input', () => {
    const ist = toIST('2025-06-20T18:30:00.000Z');
    // 18:30 UTC → 00:00 IST next day
    expect(ist.getHours()).toBe(0);
    expect(ist.getMinutes()).toBe(0);
    expect(ist.getDate()).toBe(21);
  });
});

describe('formatDateIST', () => {
  it('returns DD/MM/YYYY in IST', () => {
    // 2025-03-05 00:00 UTC → 05:30 IST same day
    const result = formatDateIST('2025-03-05T00:00:00.000Z');
    expect(result).toBe('05/03/2025');
  });

  it('handles date crossing midnight into next day in IST', () => {
    // 2025-12-31 20:00 UTC → 2026-01-01 01:30 IST
    const result = formatDateIST('2025-12-31T20:00:00.000Z');
    expect(result).toBe('01/01/2026');
  });

  it('returns dash for null/undefined', () => {
    expect(formatDateIST(null)).toBe('—');
    expect(formatDateIST(undefined)).toBe('—');
  });
});

describe('formatTimeIST', () => {
  it('returns HH:MM in 24-hour format in IST', () => {
    // 14:00 UTC → 19:30 IST
    const result = formatTimeIST('2025-06-15T14:00:00.000Z');
    expect(result).toBe('19:30');
  });

  it('pads single-digit hours and minutes', () => {
    // 00:00 UTC → 05:30 IST
    const result = formatTimeIST('2025-01-01T00:00:00.000Z');
    expect(result).toBe('05:30');
  });

  it('returns dash for null/undefined', () => {
    expect(formatTimeIST(null)).toBe('—');
    expect(formatTimeIST(undefined)).toBe('—');
  });
});

describe('formatDateTimeIST', () => {
  it('returns DD/MM/YYYY HH:MM IST', () => {
    const result = formatDateTimeIST('2025-06-15T14:00:00.000Z');
    expect(result).toBe('15/06/2025 19:30 IST');
  });

  it('returns dash for null/undefined', () => {
    expect(formatDateTimeIST(null)).toBe('—');
    expect(formatDateTimeIST(undefined)).toBe('—');
  });
});

describe('getElapsedDays', () => {
  it('returns 0 for a date in the future', () => {
    const futureDate = new Date(Date.now() + 86_400_000);
    expect(getElapsedDays(futureDate)).toBe(0);
  });

  it('returns positive number for a past date', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 86_400_000);
    const elapsed = getElapsedDays(fiveDaysAgo);
    expect(elapsed).toBeGreaterThanOrEqual(4);
    expect(elapsed).toBeLessThanOrEqual(6);
  });

  it('accepts string dates', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000).toISOString();
    const elapsed = getElapsedDays(twoDaysAgo);
    expect(elapsed).toBeGreaterThanOrEqual(1);
    expect(elapsed).toBeLessThanOrEqual(3);
  });
});
