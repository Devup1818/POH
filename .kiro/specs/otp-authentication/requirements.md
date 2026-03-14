# Requirements Document

## Introduction

This document defines the requirements for adding mandatory Two-Factor Authentication (2FA) to the Railway POH Management System. Currently, the system authenticates users with email and password only via Supabase Auth. This feature adds a second authentication factor: after successful password verification, a 6-digit OTP is sent to the user's registered email. The user must verify the OTP before gaining access to the system. Every login attempt that completes OTP verification is logged with timestamp, geolocation, and IP address for audit purposes. There is no option to skip the OTP step.

## Glossary

- **Login_Page**: The authentication page at `/login` where users enter their email and password
- **OTP_Verification_Page**: The page at `/login/verify-otp` where users enter the 6-digit OTP after successful password authentication
- **Auth_Module**: The server-side authentication functions in `src/lib/supabase/auth.ts` that interact with Supabase Auth
- **OTP**: A 6-digit numeric one-time password sent to the user's registered email address as a second authentication factor
- **Supabase_Auth**: The Supabase authentication service that handles credential verification, OTP generation, delivery, and verification
- **Middleware**: The Next.js middleware at `middleware.ts` that handles session refresh, authentication redirects, and session timeout
- **Session**: The authenticated user session managed by Supabase and stored in cookies via `@supabase/ssr`
- **Login_Audit_Log**: A PostgreSQL table that records successful login events including timestamp, geolocation, and IP address
- **Two_Factor_State**: A server-side temporary state that tracks that a user has passed password verification but has not yet completed OTP verification

## Requirements

### Requirement 1: Password Authentication (Step 1 of 2FA)

**User Story:** As a railway staff member, I want to enter my email and password on the login page as the first step of authentication, so that the system can verify my identity before sending an OTP.

#### Acceptance Criteria

1. THE Login_Page SHALL display email and password input fields for the user to enter credentials
2. WHEN the user submits valid email and password credentials, THE Auth_Module SHALL verify the credentials against Supabase_Auth
3. WHEN Supabase_Auth confirms the credentials are valid, THE Auth_Module SHALL trigger OTP delivery to the user's registered email address and redirect the user to the OTP_Verification_Page
4. WHEN Supabase_Auth confirms the credentials are valid, THE Auth_Module SHALL NOT establish a full Session until OTP verification is complete
5. IF Supabase_Auth returns an authentication error for invalid credentials, THEN THE Login_Page SHALL display a user-friendly error message without revealing whether the email or password was incorrect
6. IF Supabase_Auth returns a rate-limit error, THEN THE Login_Page SHALL display a message instructing the user to wait before retrying
7. WHILE credential verification is in progress, THE Login_Page SHALL disable the submit button and display a loading indicator

### Requirement 2: OTP Delivery

**User Story:** As a railway staff member, I want to receive a 6-digit OTP on my registered email after entering correct credentials, so that I can complete the second step of authentication.

#### Acceptance Criteria

1. WHEN the user's password credentials are verified successfully, THE Auth_Module SHALL request Supabase_Auth to send a 6-digit OTP to the email address associated with the authenticated user
2. WHEN Supabase_Auth successfully sends the OTP, THE OTP_Verification_Page SHALL display a confirmation message indicating the OTP was sent to the user's email
3. IF Supabase_Auth fails to send the OTP, THEN THE OTP_Verification_Page SHALL display an error message and provide an option to resend the OTP
4. THE OTP_Verification_Page SHALL display a masked version of the user's email address (e.g., u***@example.com) to confirm the delivery destination

### Requirement 3: OTP Verification (Step 2 of 2FA)

**User Story:** As a railway staff member, I want to enter the OTP I received via email, so that I can complete two-factor authentication and access the dashboard.

#### Acceptance Criteria

1. THE OTP_Verification_Page SHALL display a 6-digit numeric input field for the user to enter the OTP
2. WHEN the user enters non-numeric characters in the OTP input, THE OTP_Verification_Page SHALL prevent the non-numeric input from being accepted
3. WHEN the user submits a valid 6-digit OTP, THE Auth_Module SHALL call Supabase_Auth to verify the OTP
4. WHEN Supabase_Auth confirms the OTP is valid, THE Auth_Module SHALL establish a full Session and redirect the user to the dashboard
5. IF the user enters an incorrect OTP, THEN THE OTP_Verification_Page SHALL display an error message indicating the OTP is invalid
6. IF the user enters an expired OTP, THEN THE OTP_Verification_Page SHALL display an error message indicating the OTP has expired and offer a resend option
7. WHILE OTP verification is in progress, THE OTP_Verification_Page SHALL disable the submit button and display a loading indicator
8. WHEN the user submits the OTP_Verification_Page with an empty or incomplete OTP (fewer than 6 digits), THE OTP_Verification_Page SHALL display a validation error and prevent submission

### Requirement 4: OTP Resend

**User Story:** As a railway staff member, I want to request a new OTP if the previous one expired or was not received, so that I can still complete login.

#### Acceptance Criteria

1. THE OTP_Verification_Page SHALL display a "Resend OTP" option
2. WHEN the user activates the "Resend OTP" option, THE Auth_Module SHALL request Supabase_Auth to send a new OTP to the same email address
3. WHILE a resend request is in progress, THE OTP_Verification_Page SHALL disable the "Resend OTP" option and display a loading indicator
4. WHEN the resend is successful, THE OTP_Verification_Page SHALL display a confirmation message indicating a new OTP was sent
5. IF Supabase_Auth returns a rate-limit error on resend, THEN THE OTP_Verification_Page SHALL display a cooldown message with the remaining wait time

### Requirement 5: Two-Factor State Protection

**User Story:** As a system administrator, I want to ensure that users cannot bypass the OTP step, so that two-factor authentication is enforced for every login.

#### Acceptance Criteria

1. THE Middleware SHALL prevent access to any protected route unless the user has completed both password verification and OTP verification
2. WHEN a user has completed password verification but not OTP verification, THE Middleware SHALL redirect the user to the OTP_Verification_Page
3. IF a user attempts to access the OTP_Verification_Page without first completing password verification, THEN THE Middleware SHALL redirect the user to the Login_Page
4. THE Auth_Module SHALL store the Two_Factor_State server-side and associate the state with the user's email and a time-limited token
5. IF the Two_Factor_State expires (after 5 minutes of inactivity), THEN THE Middleware SHALL redirect the user to the Login_Page to restart the authentication flow

### Requirement 6: Login Audit Logging

**User Story:** As a system administrator, I want every successful login to be recorded with timestamp, geolocation, and IP address, so that I can audit user access for security purposes.

#### Acceptance Criteria

1. WHEN a user completes OTP verification successfully, THE Auth_Module SHALL create a record in the Login_Audit_Log
2. THE Login_Audit_Log record SHALL contain the user's unique identifier, the login timestamp in UTC, the client IP address, and the geolocation (latitude and longitude derived from the IP address)
3. THE Login_Audit_Log table SHALL be stored in the PostgreSQL database managed by Supabase
4. IF geolocation lookup fails for a given IP address, THEN THE Auth_Module SHALL store the IP address with null geolocation values and proceed without blocking the login
5. THE Login_Audit_Log records SHALL be immutable; the system SHALL support only insert operations on the Login_Audit_Log table

### Requirement 7: OTP Verification Page Accessibility and Navigation

**User Story:** As a railway staff member, I want the OTP verification page to be accessible and allow me to go back to the login page, so that I can correct mistakes or restart the login flow.

#### Acceptance Criteria

1. THE OTP_Verification_Page SHALL include accessible labels and ARIA attributes for all input fields and interactive elements
2. THE OTP_Verification_Page SHALL provide a "Back to Login" option that redirects the user to the Login_Page and invalidates the current Two_Factor_State
3. WHEN the user navigates back to the Login_Page from the OTP_Verification_Page, THE Login_Page SHALL display the email and password form in its default state

### Requirement 8: Session Handling After 2FA Completion

**User Story:** As a system administrator, I want sessions established after 2FA to follow the same timeout and cookie policies as the existing system, so that security policies remain consistent.

#### Acceptance Criteria

1. WHEN a user completes the full 2FA flow (password + OTP), THE Middleware SHALL manage the Session using the same cookie-based mechanism as the existing authentication system
2. WHEN a 2FA-authenticated session expires due to 30 minutes of inactivity, THE Middleware SHALL redirect the user to the Login_Page with a timeout reason parameter
3. WHEN a 2FA-authenticated session expires, THE user SHALL complete the full 2FA flow (password + OTP) again to regain access
