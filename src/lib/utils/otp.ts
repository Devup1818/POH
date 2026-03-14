/**
 * OTP utility functions for two-factor authentication.
 * Pure functions with no server dependencies.
 */

/**
 * Masks an email address for display, preserving the first character
 * of the local part and the full domain.
 *
 * Example: "rajesh@example.com" → "r***@example.com"
 */
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return email;
  return `${localPart[0]}***@${domain}`;
}

/**
 * Returns true for strings that are 6 to 8 numeric digits.
 * Supabase email OTP tokens can vary in length.
 */
export function isValidOtp(value: string): boolean {
  return /^\d{6,8}$/.test(value);
}

/**
 * Strips all non-numeric characters from the input,
 * preserving digit order.
 */
export function sanitizeOtpInput(value: string): string {
  return value.replace(/\D/g, '');
}
