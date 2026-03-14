# Implementation Plan: OTP Authentication

## Overview

Implement mandatory two-factor authentication for the Railway POH Management System. The flow adds an OTP verification step after password login, using Supabase Auth's built-in OTP methods. Every successful 2FA login is audit-logged with timestamp, IP, and geolocation. Implementation modifies existing auth functions, middleware, and login page, and adds a new OTP verification page and audit logging module.

## Tasks

- [x] 1. Create database migration for login audit logs
  - [x] 1.1 Create `supabase/migrations/004_login_audit_logs.sql`
    - Create `login_audit_logs` table with columns: `id` (UUID PK), `user_id` (UUID FK to auth.users), `login_timestamp` (TIMESTAMPTZ DEFAULT NOW()), `ip_address` (INET NOT NULL), `latitude` (DOUBLE PRECISION nullable), `longitude` (DOUBLE PRECISION nullable), `created_at` (TIMESTAMPTZ DEFAULT NOW())
    - Add indexes on `user_id` and `login_timestamp DESC`
    - Enable RLS with insert-only policy (no UPDATE or DELETE policies)
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [x] 2. Implement utility functions
  - [x] 2.1 Create `src/lib/utils/otp.ts` with `maskEmail`, `isValidOtp`, and `sanitizeOtpInput` functions
    - `maskEmail`: preserves first character of local part, replaces rest with `***`, preserves `@` and full domain
    - `isValidOtp`: returns true only for exactly 6 numeric digit strings
    - `sanitizeOtpInput`: strips all non-numeric characters, preserves digit order
    - _Requirements: 2.4, 3.2, 3.8_

  - [ ]* 2.2 Write property test for email masking (Property 3)
    - **Property 3: Email masking preserves first character and domain**
    - Generate random valid emails, verify first char preserved, `***` replaces rest of local part, domain intact
    - **Validates: Requirements 2.4**

  - [ ]* 2.3 Write property test for OTP input sanitization (Property 4)
    - **Property 4: OTP input sanitization strips non-numeric characters**
    - Generate random strings, verify only digits remain in original order
    - **Validates: Requirements 3.2**

  - [ ]* 2.4 Write property test for OTP validation (Property 5)
    - **Property 5: Incomplete OTP is rejected**
    - Generate strings of varying lengths and content, verify `isValidOtp` returns true only for exactly 6 digits
    - **Validates: Requirements 3.8**

- [x] 3. Implement auth module two-factor functions
  - [x] 3.1 Add `signInStep1` server action to `src/lib/supabase/auth.ts`
    - Call `supabase.auth.signInWithPassword()` to verify credentials
    - On success, call `supabase.auth.signOut()` to clear partial session
    - Set `poh_2fa_pending` httpOnly cookie (email, 5-min maxAge, secure in production, sameSite lax)
    - Call `supabase.auth.signInWithOtp({ email })` to trigger OTP delivery
    - Return generic error messages that do not reveal which credential failed
    - Handle rate-limit errors with appropriate user-facing message
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 5.4_

  - [ ]* 3.2 Write property test for generic error messages (Property 2)
    - **Property 2: Generic error messages hide credential specifics**
    - Generate random Supabase error strings, verify user-friendly output never contains "email was incorrect", "password was incorrect", "wrong email", or "wrong password"
    - **Validates: Requirements 1.5**

  - [x] 3.3 Add `verifyLoginOtp` server action to `src/lib/supabase/auth.ts`
    - Read email from `poh_2fa_pending` cookie
    - Call `supabase.auth.verifyOtp({ email, token, type: 'email' })` to verify OTP and establish session
    - On success, clear `poh_2fa_pending` cookie
    - Call audit logging to record the login event
    - Return distinct error messages for invalid OTP vs expired OTP
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 6.1_

  - [x] 3.4 Add `resendOtp` server action to `src/lib/supabase/auth.ts`
    - Read email from `poh_2fa_pending` cookie
    - Call `supabase.auth.signInWithOtp({ email })` to send new OTP
    - Handle rate-limit errors with cooldown message
    - _Requirements: 4.2, 4.5_

  - [x] 3.5 Add `cancelTwoFactor` server action to `src/lib/supabase/auth.ts`
    - Clear the `poh_2fa_pending` cookie
    - _Requirements: 7.2_

- [x] 4. Implement audit logging module
  - [x] 4.1 Create `src/lib/supabase/audit.ts` with `createLoginAuditLog` and `getGeolocation` functions
    - `getGeolocation`: call free IP geolocation API server-side, return `{ latitude, longitude }` or null on failure
    - `createLoginAuditLog`: insert record into `login_audit_logs` with user_id, ip_address, and geolocation (nullable)
    - Geolocation failure must not block login
    - Database insert failure must not block login (log error server-side only)
    - _Requirements: 6.1, 6.2, 6.4_

  - [ ]* 4.2 Write property test for audit log record structure (Property 7)
    - **Property 7: Audit log records contain all required fields**
    - Generate random user IDs and IP addresses, verify record contains non-null user_id, login_timestamp, ip_address, and nullable latitude/longitude
    - **Validates: Requirements 6.2**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Update middleware for two-factor state enforcement
  - [x] 6.1 Modify `middleware.ts` to handle 2FA routing
    - Add `/login/verify-otp` to route handling
    - If user has `poh_2fa_pending` cookie and accesses a protected route → redirect to `/login/verify-otp`
    - If user accesses `/login/verify-otp` without `poh_2fa_pending` cookie → redirect to `/login`
    - If user has active session and no `poh_2fa_pending` cookie → allow access to protected routes
    - If unauthenticated user accesses protected route → redirect to `/login`
    - If authenticated user with no pending 2FA accesses `/login` → redirect to dashboard
    - Preserve existing session timeout logic (30-min inactivity → redirect to `/login?reason=timeout`)
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 8.1, 8.2, 8.3_

  - [ ]* 6.2 Write property test for middleware routing (Property 6)
    - **Property 6: Middleware routes correctly based on auth state and route type**
    - Generate random combinations of auth state (no session, session + 2fa pending, session + no 2fa pending) × route type (login, verify-otp, protected), verify correct routing decision
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 7. Update login page for step 1 of 2FA
  - [x] 7.1 Modify `src/app/(auth)/login/page.tsx`
    - Update `handleSubmit` to call `signInStep1` instead of existing `signIn`
    - On success, redirect to `/login/verify-otp`
    - Display generic error messages for invalid credentials
    - Display rate-limit message when applicable
    - Show loading indicator and disable submit button during verification
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6, 1.7_

- [x] 8. Create OTP verification page
  - [x] 8.1 Create `src/app/(auth)/login/verify-otp/page.tsx`
    - 6-digit numeric input field that rejects non-numeric characters using `sanitizeOtpInput`
    - Submit button with loading state during verification
    - Call `verifyLoginOtp` on submit; on success redirect to dashboard
    - Display masked email using `maskEmail` to confirm delivery destination
    - Display error messages for invalid OTP, expired OTP
    - Prevent submission of empty or incomplete OTP (fewer than 6 digits) with validation error
    - "Resend OTP" button that calls `resendOtp` with loading state and cooldown timer
    - Display confirmation message when OTP is sent/resent successfully
    - Display rate-limit cooldown message with remaining wait time
    - "Back to Login" link that calls `cancelTwoFactor` and redirects to `/login`
    - Accessible labels and ARIA attributes on all inputs and interactive elements
    - _Requirements: 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.2, 7.3_

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Wire components and integration verification
  - [x] 10.1 Verify end-to-end 2FA flow integration
    - Ensure login page → OTP page → dashboard redirect chain works
    - Ensure "Back to Login" clears 2FA state and returns to default login form
    - Ensure middleware correctly blocks/allows routes at each auth state
    - Ensure audit log is created on successful OTP verification
    - Wire `signInStep1` → `verifyLoginOtp` → `createLoginAuditLog` pipeline
    - _Requirements: 1.3, 3.4, 6.1, 7.2, 7.3_

  - [ ]* 10.2 Write unit tests for login step 1 flow
    - Mock Supabase, verify `signInStep1` triggers OTP and sets 2FA cookie on success
    - Verify error handling for invalid credentials, rate limits, network errors
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 10.3 Write unit tests for OTP verification flow
    - Mock Supabase, verify `verifyLoginOtp` establishes session and clears 2FA cookie on success
    - Verify error handling for invalid OTP, expired OTP
    - Verify audit log creation is called
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 6.1_

  - [ ]* 10.4 Write unit tests for OTP verification page rendering
    - Verify 6-digit input, submit button, resend button, masked email, back link, ARIA attributes are present
    - _Requirements: 3.1, 4.1, 7.1, 7.2_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Supabase handles OTP generation, delivery, expiry, and rate-limiting — no custom OTP storage needed
