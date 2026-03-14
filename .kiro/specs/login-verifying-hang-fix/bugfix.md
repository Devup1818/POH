# Bugfix Requirements Document

## Introduction

The login flow in the POH Management System has three related bugs that cause the UI to hang indefinitely on "Verifying..." or "Verifying OTP..." states, and leave users unable to find the simulated OTP. These issues make the login flow unusable in certain error/edge-case scenarios and confusing in development mode.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN OTP verification succeeds in `handleOtpVerify()` and `router.push('/')` is called THEN the system leaves `loading` set to `true` indefinitely, showing "Verifying OTP..." with no way to recover if navigation is slow or fails

1.2 WHEN `generateOtp()` throws an error during `handleCredentialsSubmit()` (e.g., crypto API failure) THEN the system leaves `loading` set to `true` indefinitely because there is no try/catch around the async call, showing "Verifying..." with no way to recover

1.3 WHEN a user submits valid credentials and an OTP is generated THEN the system only logs the OTP to the browser console via `console.log` in `sendSmsToPhone()`, providing no visible UI feedback in development mode about where to find the OTP code

1.4 WHEN the `sha256()` function is called in a non-secure context (HTTP, not HTTPS) THEN `crypto.subtle` is `undefined` and the call to `crypto.subtle.digest('SHA-256', ...)` throws a `TypeError: Cannot read properties of undefined (reading 'digest')`, which crashes `generateOtp()` and cascades into defect 1.2

### Expected Behavior (Correct)

2.1 WHEN OTP verification succeeds and navigation is initiated THEN the system SHALL reset `loading` to `false` in a finally block (or equivalent) so the UI never hangs indefinitely, even if `router.push()` is slow or fails

2.2 WHEN `generateOtp()` throws an error during credential submission THEN the system SHALL catch the error, reset `loading` to `false`, and display an appropriate error message to the user

2.3 WHEN a user is on the OTP verification step in development mode THEN the system SHALL display a visible dev-mode hint in the UI indicating that the OTP can be found in the browser console (F12), so users are not left wondering where the OTP was sent

2.4 WHEN `crypto.subtle` is unavailable (non-secure context) THEN the `sha256()` function SHALL fall back to a simple hash implementation so that OTP generation and verification still work in development over HTTP

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user enters incorrect credentials (wrong username or password) THEN the system SHALL CONTINUE TO display the appropriate error message and reset the loading state

3.2 WHEN a user enters an invalid or expired OTP THEN the system SHALL CONTINUE TO display "Invalid or expired OTP" error and reset the loading state

3.3 WHEN a user clicks "Resend OTP" THEN the system SHALL CONTINUE TO regenerate and send a new OTP while showing the "Sending new OTP..." state

3.4 WHEN a user clicks "Back" from the OTP step THEN the system SHALL CONTINUE TO return to the credentials step with cleared error and OTP fields

3.5 WHEN OTP verification succeeds and navigation completes normally THEN the system SHALL CONTINUE TO redirect the user to the dashboard at `/`
