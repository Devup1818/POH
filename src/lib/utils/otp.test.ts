import { describe, it, expect } from 'vitest';
import { maskEmail, isValidOtp, sanitizeOtpInput } from './otp';

describe('maskEmail', () => {
  it('masks a standard email', () => {
    expect(maskEmail('rajesh@example.com')).toBe('r***@example.com');
  });

  it('masks a single-character local part', () => {
    expect(maskEmail('a@example.com')).toBe('a***@example.com');
  });

  it('preserves the full domain', () => {
    expect(maskEmail('user@sub.domain.co.in')).toBe('u***@sub.domain.co.in');
  });

  it('returns the original string if no @ is present', () => {
    expect(maskEmail('invalid-email')).toBe('invalid-email');
  });
});

describe('isValidOtp', () => {
  it('returns true for exactly 6 digits', () => {
    expect(isValidOtp('123456')).toBe(true);
    expect(isValidOtp('000000')).toBe(true);
  });

  it('returns false for fewer than 6 digits', () => {
    expect(isValidOtp('12345')).toBe(false);
    expect(isValidOtp('')).toBe(false);
  });

  it('returns false for more than 8 digits', () => {
    expect(isValidOtp('123456789')).toBe(false);
  });

  it('returns true for 7 or 8 digit codes', () => {
    expect(isValidOtp('1234567')).toBe(true);
    expect(isValidOtp('12345678')).toBe(true);
  });

  it('returns false for non-numeric strings', () => {
    expect(isValidOtp('abcdef')).toBe(false);
    expect(isValidOtp('12345a')).toBe(false);
    expect(isValidOtp('12 345')).toBe(false);
  });
});

describe('sanitizeOtpInput', () => {
  it('strips non-numeric characters', () => {
    expect(sanitizeOtpInput('1a2b3c')).toBe('123');
  });

  it('preserves digit order', () => {
    expect(sanitizeOtpInput('abc123def456')).toBe('123456');
  });

  it('returns empty string for no digits', () => {
    expect(sanitizeOtpInput('abcdef')).toBe('');
  });

  it('returns the same string if all digits', () => {
    expect(sanitizeOtpInput('123456')).toBe('123456');
  });

  it('handles empty input', () => {
    expect(sanitizeOtpInput('')).toBe('');
  });
});
