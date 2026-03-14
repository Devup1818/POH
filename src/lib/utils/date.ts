import { differenceInDays } from 'date-fns';

/**
 * IST offset in milliseconds: UTC+5:30 = 5.5 hours
 */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Convert any Date to IST by applying the UTC+5:30 offset.
 * Returns a new Date object representing the IST equivalent.
 */
export function toIST(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  // Get UTC time and add IST offset
  const utcMs = d.getTime() + d.getTimezoneOffset() * 60 * 1000;
  return new Date(utcMs + IST_OFFSET_MS);
}

/**
 * Format a date as DD/MM/YYYY in IST.
 */
export function formatDateIST(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const ist = toIST(date);
  const dd = String(ist.getDate()).padStart(2, '0');
  const mm = String(ist.getMonth() + 1).padStart(2, '0');
  const yyyy = ist.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Format a time as HH:MM in 24-hour format in IST.
 */
export function formatTimeIST(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const ist = toIST(date);
  const hh = String(ist.getHours()).padStart(2, '0');
  const min = String(ist.getMinutes()).padStart(2, '0');
  return `${hh}:${min}`;
}

/**
 * Format a date-time as DD/MM/YYYY HH:MM IST.
 */
export function formatDateTimeIST(date: Date | string | null | undefined): string {
  if (!date) return '—';
  return `${formatDateIST(date)} ${formatTimeIST(date)} IST`;
}

/**
 * Get elapsed days from a start date to now, calculated in IST.
 */
export function getElapsedDays(startDate: Date | string): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  return Math.max(0, differenceInDays(new Date(), start));
}
