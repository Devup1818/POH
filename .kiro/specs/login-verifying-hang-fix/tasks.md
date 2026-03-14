# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** — Login Flow Loading State Hang
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: Some quick fixes are already applied in the codebase. The exploration test should be written to validate the expected behavior (loading resets, errors caught, sha256 fallback works). If the fixes are correctly applied, the test will PASS immediately — this confirms the fixes are correct.
  - **GOAL**: Surface counterexamples that demonstrate the bugs exist (or confirm fixes are already correct)
  - **Scoped PBT Approach**: Scope properties to the four concrete bug conditions:
    1. `handleOtpVerify` with successful verification — assert `loading` is reset to `false` after completion
    2. `handleCredentialsSubmit` when `generateOtp` throws — assert `loading` is reset to `false` and error message is set
    3. `sha256()` when `crypto.subtle` is `undefined` — assert it returns a valid hex string without throwing
    4. OTP step UI — assert a visible dev-mode hint about browser console is present
  - Install test framework (vitest + @testing-library/react + jsdom + fast-check) as devDependencies
  - Create `src/__tests__/login-bugfix.test.tsx` with tests for all four fault conditions
  - Test `handleOtpVerify`: mock `verifyOtp` to return `true`, call handler, assert `loading === false` after await
  - Test `handleCredentialsSubmit`: mock `generateOtp` to throw, call handler, assert `loading === false` and `error` is set
  - Test `sha256` fallback: delete `crypto.subtle`, call `sha256('test')`, assert returns hex string without throwing
  - Test OTP step UI: render OTP verification step, assert visible hint text about browser console (F12)
  - Run tests — if fixes are correct, tests PASS (confirming fixes work); if any test FAILS, document the counterexample
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4_

- [x] 2. Write preservation property tests (BEFORE implementing any remaining fixes)
  - **Property 2: Preservation** — Existing Login Flow Behavior Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on current code for non-buggy inputs:
    - Incorrect credentials (wrong username) → error "User not found..." and loading reset
    - Incorrect credentials (wrong password) → error "Incorrect password" and loading reset
    - Invalid OTP (wrong 6-digit code) → error "Invalid or expired OTP..." and loading reset
    - Resend OTP → `resending` state toggles, new OTP generated
    - Back navigation → step returns to 'credentials', error and OTP cleared
    - Successful full flow → redirect to `/`
  - Write property-based tests in `src/__tests__/login-preservation.test.tsx` using fast-check:
    - For all arbitrary username strings not matching any seed user, `loginByName` returns `{ success: false }` with error
    - For all seed users with wrong password strings, `loginByName` returns `{ success: false, error: 'Incorrect password' }`
    - For all arbitrary 6-digit OTP strings that don't match the stored hash, `verifyOtp` returns `false`
    - `sha256` is deterministic: for all arbitrary strings, `sha256(x) === sha256(x)` (same input → same output)
    - `sha256` with `crypto.subtle` available produces consistent results across calls
  - Write unit tests for UI preservation:
    - Back button clears error and OTP, returns to credentials step
    - Resend OTP triggers `generateOtp` and toggles resending state
    - Successful OTP verification redirects to `/`
  - Run tests on current code — **EXPECTED OUTCOME**: All tests PASS (confirms baseline behavior)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix for login flow verifying hang and missing OTP hint

  - [x] 3.1 Add dev-mode OTP hint to OTP verification step UI
    - In `src/app/(auth)/login/page.tsx`, within the `step === 'verify-otp'` block, add a visible amber-colored hint box
    - Text: "Dev mode: Check browser console (F12) for the simulated OTP"
    - Place it after the "Encrypted OTP sent to..." info box and before the OTP input
    - Style consistently with the existing demo credentials hint (amber border, amber background, amber text)
    - _Bug_Condition: isBugCondition(input) where input.event == 'otp_step_displayed' AND visibleOtpHint NOT present_
    - _Expected_Behavior: OTP step UI includes visible hint about browser console_
    - _Preservation: All existing OTP step UI elements and behavior unchanged_
    - _Requirements: 1.3, 2.3_

  - [x] 3.2 Review and verify existing quick fixes are correct
    - Verify `handleOtpVerify` resets `loading` to `false` before `router.push('/')` (Bug 1 fix — already applied)
    - Verify `handleCredentialsSubmit` has try/catch around `generateOtp()` with error message and loading reset (Bug 2 fix — already applied)
    - Verify `sha256` guards `crypto.subtle` and falls back to simple hash (Bug 4 fix — already applied)
    - Ensure fallback hash is deterministic (same input → same output)
    - Ensure error message in catch block is user-friendly: "Failed to generate OTP. Please try again."
    - _Bug_Condition: All four bug conditions from design_
    - _Expected_Behavior: loading always resets, errors caught and surfaced, sha256 fallback works_
    - _Preservation: No changes to non-buggy code paths_
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** — Login Flow Loading State Hang
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 encodes the expected behavior for all four bug conditions
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms all four bugs are fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** — Existing Login Flow Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after the OTP hint addition (no regressions)

- [x] 4. Checkpoint — Ensure all tests pass
  - Run full test suite: `npx vitest --run`
  - Ensure all exploration tests pass (fault conditions resolved)
  - Ensure all preservation tests pass (no regressions)
  - Ensure all property-based tests pass (determinism, consistency)
  - Ask the user if questions arise
