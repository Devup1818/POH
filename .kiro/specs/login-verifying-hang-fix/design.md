# Login Verifying Hang Fix — Bugfix Design

## Overview

The login flow has four interrelated defects that cause the UI to hang indefinitely on "Verifying..." or "Verifying OTP..." states, and leave developers unable to locate the simulated OTP. The root causes are: missing `loading` state resets, missing error handling around async calls, absence of a visible dev-mode OTP hint, and a `crypto.subtle` unavailability crash in non-secure (HTTP) contexts. The fix strategy is to harden the async control flow in both `handleCredentialsSubmit()` and `handleOtpVerify()`, add a `sha256` fallback for HTTP contexts, and surface a dev-mode UI hint for the OTP.

## Glossary

- **Bug_Condition (C)**: Any of the four conditions that trigger the defective behavior — successful OTP verify without loading reset, uncaught `generateOtp` error, missing dev-mode OTP hint, or `crypto.subtle` being undefined
- **Property (P)**: The `loading` state is always reset after async operations complete (success or failure), errors are caught and surfaced, dev-mode OTP location is visible, and hashing works in non-secure contexts
- **Preservation**: All existing login behaviors (incorrect credentials error, invalid OTP error, resend OTP, back navigation, successful redirect) must remain unchanged
- **handleCredentialsSubmit()**: The function in `src/app/(auth)/login/page.tsx` that validates credentials and triggers OTP generation
- **handleOtpVerify()**: The function in `src/app/(auth)/login/page.tsx` that verifies the entered OTP and navigates to the dashboard
- **sha256()**: The hashing utility in `src/lib/auth-context.tsx` used to hash OTPs before storage and comparison
- **generateOtp()**: The function in `src/lib/auth-context.tsx` that creates a 6-digit OTP, hashes it, and dispatches it via the simulated SMS gateway

## Bug Details

### Fault Condition

The bugs manifest across four scenarios in the login flow. The common thread is that async operations in the login page either fail to reset UI state or crash due to environment limitations.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type LoginFlowEvent
  OUTPUT: boolean

  // Bug 1: Successful OTP verification leaves loading=true
  IF input.event == 'otp_verify'
     AND verifyOtp(input.userId, input.otp) == true
     AND loading is not reset after router.push()
  THEN RETURN true

  // Bug 2: generateOtp throws and no catch exists
  IF input.event == 'credentials_submit'
     AND loginByName(input.username, input.password).success == true
     AND generateOtp(input.userId) THROWS error
     AND error is not caught
  THEN RETURN true

  // Bug 3: No visible dev-mode OTP hint
  IF input.event == 'otp_step_displayed'
     AND environment == 'development'
     AND visibleOtpHint NOT present in UI
  THEN RETURN true

  // Bug 4: crypto.subtle unavailable in non-secure context
  IF input.event == 'sha256_call'
     AND typeof crypto.subtle == 'undefined'
     AND no fallback hash implementation exists
  THEN RETURN true

  RETURN false
END FUNCTION
```

### Examples

- **Bug 1**: User enters correct credentials → receives OTP → enters correct OTP → `verifyOtp` returns `true` → `router.push('/')` is called → `loading` stays `true` → UI shows "Verifying OTP..." indefinitely, especially if navigation is slow or the component re-renders before unmounting
- **Bug 2**: User enters correct credentials → `generateOtp()` throws (e.g., crypto failure) → no try/catch → `loading` stays `true` → UI shows "Verifying..." with no error message and no way to retry
- **Bug 3**: User reaches OTP step → looks at the UI for where to find the OTP → no visible hint → user is confused, doesn't know to open browser console (F12)
- **Bug 4**: App served over HTTP (not localhost) → `crypto.subtle` is `undefined` → `sha256()` calls `crypto.subtle.digest()` → `TypeError: Cannot read properties of undefined` → this error propagates up to `generateOtp()` → cascades into Bug 2

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Incorrect credentials (wrong username or password) must continue to show the appropriate error message and reset loading state
- Invalid or expired OTP must continue to show "Invalid or expired OTP" and reset loading state
- "Resend OTP" must continue to regenerate and send a new OTP with "Sending new OTP..." feedback
- "Back" button from OTP step must continue to return to credentials step with cleared error and OTP fields
- Successful OTP verification must continue to redirect the user to the dashboard at `/`

**Scope:**
All inputs that do NOT involve the four bug conditions should be completely unaffected by this fix. This includes:
- Normal credential validation error flows
- Normal OTP validation error flows
- Resend OTP flow
- Back navigation from OTP step
- Create user modal flow
- All UI rendering and step indicator behavior

## Hypothesized Root Cause

Based on the bug description and code analysis, the root causes are:

1. **Missing loading reset after successful OTP verification (Bug 1)**: In `handleOtpVerify()`, when `verifyOtp` returns `true`, the function calls `router.push('/')` but never resets `loading` to `false`. If the component doesn't unmount immediately (e.g., slow navigation, React concurrent mode), the user sees "Verifying OTP..." indefinitely. The fix is to reset `loading` to `false` before calling `router.push()`, or use a `finally` block.

2. **Missing try/catch around generateOtp (Bug 2)**: In `handleCredentialsSubmit()`, the call to `await generateOtp(result.userId!)` is not wrapped in a try/catch. If `generateOtp` throws (for any reason, including Bug 4), the error propagates unhandled, and `setLoading(false)` is never reached. The fix is to wrap the call in try/catch, display an error message, and reset loading.

3. **No visible dev-mode OTP hint (Bug 3)**: The OTP is logged to the browser console via `sendSmsToPhone()`, but the OTP verification step UI provides no indication of where to find it. Developers unfamiliar with the codebase waste time looking for the OTP. The fix is to add a visible hint in the OTP step UI (in dev mode or always for this simulated setup) pointing users to the browser console.

4. **crypto.subtle undefined in non-secure contexts (Bug 4)**: The `sha256()` function directly calls `crypto.subtle.digest()` without checking whether `crypto.subtle` exists. In non-secure contexts (HTTP, not HTTPS, and not localhost in some browsers), `crypto.subtle` is `undefined`. The fix is to add a guard check and fall back to a simple hash implementation for development use.

## Correctness Properties

Property 1: Fault Condition — Loading State Always Resets After Async Operations

_For any_ login flow event where an async operation completes (OTP verification success/failure, OTP generation success/failure), the `loading` state SHALL be reset to `false`, ensuring the UI never hangs indefinitely on "Verifying..." or "Verifying OTP...".

**Validates: Requirements 2.1, 2.2**

Property 2: Fault Condition — Errors Are Caught and Surfaced

_For any_ login flow event where `generateOtp()` throws an error (including `crypto.subtle` unavailability), the error SHALL be caught, `loading` SHALL be reset to `false`, and an appropriate error message SHALL be displayed to the user.

**Validates: Requirements 2.2, 2.4**

Property 3: Fault Condition — Dev-Mode OTP Hint Is Visible

_For any_ state where the OTP verification step is displayed, the UI SHALL include a visible hint indicating that the simulated OTP can be found in the browser console (F12).

**Validates: Requirements 2.3**

Property 4: Fault Condition — sha256 Works in Non-Secure Contexts

_For any_ call to `sha256(message)` where `crypto.subtle` is `undefined`, the function SHALL fall back to a simple hash implementation and return a consistent hex string, rather than throwing a TypeError.

**Validates: Requirements 2.4**

Property 5: Preservation — Existing Error Flows Unchanged

_For any_ login flow event where the bug conditions do NOT hold (incorrect credentials, invalid OTP, resend OTP, back navigation), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing error handling, state transitions, and UI feedback.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `src/app/(auth)/login/page.tsx`

**Function**: `handleOtpVerify`

**Specific Changes**:
1. **Reset loading after successful verification**: Add `setLoading(false)` before `router.push('/')`, or restructure to use a finally block, so that loading is always reset regardless of navigation timing.

**Function**: `handleCredentialsSubmit`

**Specific Changes**:
2. **Wrap generateOtp in try/catch**: Surround the `await generateOtp(result.userId!)` call with try/catch. In the catch block, call `setError('Failed to generate OTP. Please try again.')` and `setLoading(false)`, then return early.

**OTP Step UI**:
3. **Add dev-mode OTP hint**: In the OTP verification step (`step === 'verify-otp'`), add a small info box or text hint (e.g., amber-colored) indicating: "Dev mode: OTP is logged to the browser console (F12)". This can be shown unconditionally since the entire SMS gateway is simulated.

---

**File**: `src/lib/auth-context.tsx`

**Function**: `sha256`

**Specific Changes**:
4. **Guard crypto.subtle access**: Before calling `crypto.subtle.digest()`, check `typeof crypto !== 'undefined' && crypto.subtle`. If unavailable, fall back to a simple deterministic hash (e.g., a basic string hash converted to hex). This fallback is acceptable for development only and should be clearly commented as not production-safe.

5. **Consistent fallback behavior**: Ensure the fallback hash is deterministic — the same input always produces the same output — so that OTP generation and verification still work correctly (the generated OTP hash matches the verification hash).

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bugs on unfixed code, then verify the fixes work correctly and preserve existing behavior.

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the bugs BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write unit tests that exercise each of the four bug scenarios against the unfixed code to observe failures and confirm root causes.

**Test Cases**:
1. **Loading hang after OTP success**: Call `handleOtpVerify()` with a valid OTP, assert that `loading` is `false` after the function completes (will fail on unfixed code — loading stays true)
2. **Uncaught generateOtp error**: Mock `generateOtp` to throw, call `handleCredentialsSubmit()`, assert that `loading` is `false` and an error message is displayed (will fail on unfixed code — unhandled rejection)
3. **Missing OTP hint**: Render the OTP step, assert that a visible element contains text about the browser console (will fail on unfixed code — no such element)
4. **crypto.subtle crash**: Call `sha256()` with `crypto.subtle` set to `undefined`, assert it returns a string without throwing (will fail on unfixed code — TypeError)

**Expected Counterexamples**:
- `handleOtpVerify` leaves `loading === true` after successful verification
- `handleCredentialsSubmit` throws unhandled rejection when `generateOtp` fails
- OTP step UI contains no hint about console
- `sha256` throws `TypeError: Cannot read properties of undefined (reading 'digest')`

### Fix Checking

**Goal**: Verify that for all inputs where the bug conditions hold, the fixed functions produce the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := fixedFunction(input)
  ASSERT loading == false after completion
  ASSERT error message displayed if applicable
  ASSERT sha256 returns valid hex string
  ASSERT OTP hint is visible in UI
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug conditions do NOT hold, the fixed functions produce the same result as the original functions.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT handleCredentialsSubmit_fixed(input) == handleCredentialsSubmit_original(input)
  ASSERT handleOtpVerify_fixed(input) == handleOtpVerify_original(input)
  ASSERT sha256_fixed(input) == sha256_original(input)  // when crypto.subtle IS available
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for normal login flows (wrong credentials, invalid OTP, resend, back), then write property-based tests capturing that behavior.

**Test Cases**:
1. **Incorrect credentials preservation**: Verify that wrong username/password continues to show error and reset loading
2. **Invalid OTP preservation**: Verify that wrong OTP continues to show "Invalid or expired OTP" and reset loading
3. **Resend OTP preservation**: Verify that resend flow continues to work with "Sending new OTP..." feedback
4. **Back navigation preservation**: Verify that back button continues to clear error/OTP and return to credentials step
5. **sha256 consistency when crypto.subtle available**: Verify that `sha256_fixed(x) === sha256_original(x)` for all inputs when `crypto.subtle` is available

### Unit Tests

- Test `handleOtpVerify` resets loading to false on both success and failure paths
- Test `handleCredentialsSubmit` catches `generateOtp` errors, resets loading, and shows error message
- Test `sha256` returns a valid hex string when `crypto.subtle` is undefined
- Test `sha256` returns the same result as the original when `crypto.subtle` is available
- Test OTP step renders a visible dev-mode hint about the browser console

### Property-Based Tests

- Generate random OTP strings and verify `sha256` fallback is deterministic (same input → same output)
- Generate random login flow sequences (valid/invalid credentials, valid/invalid OTPs) and verify `loading` is always `false` after each operation completes
- Generate random inputs to `sha256` and verify the fallback produces the same output for the same input across multiple calls

### Integration Tests

- Test full login flow: correct credentials → OTP generation → correct OTP → redirect, verifying loading resets at each step
- Test error recovery flow: correct credentials → generateOtp fails → error shown → retry → success
- Test that the dev-mode OTP hint is visible during the OTP step and does not interfere with the verification flow
