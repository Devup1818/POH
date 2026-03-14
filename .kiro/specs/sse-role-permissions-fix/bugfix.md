# Bugfix Requirements Document

## Introduction

When a user with the "Senior Section Engineer" (SSE) role logs in, the dashboard displays no data — no coaches, no active POH processes, no metrics. The Admin role can see everything. The SSE role should have the same access and functionality as Admin for all operational data (dashboard, coaches, rakes, POH stages, parts, checklists, tests, notes), with the only restriction being no access to user management features.

The root cause is a combination of:
- Missing shed assignments for SSE users in the `user_shed_assignments` table, causing RLS policies to deny data access
- The shed selector component only granting "All Sheds" visibility to Admin, not SSE
- The `users` table RLS SELECT policy restricting non-Admin users to only their own profile, preventing SSE from seeing related user data (e.g., note authors)

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user with the "Senior_Section_Engineer" role logs in and views the dashboard THEN the system shows zero active rakes, zero coaches, and all metrics at 0 because the shed selector defaults to a shed the user has no assignment for, and RLS policies deny access to all rake/coach data

1.2 WHEN a user with the "Senior_Section_Engineer" role attempts to view rake details or coach details THEN the system returns no data because the `user_has_shed_access()` RLS function returns false for users without entries in `user_shed_assignments`

1.3 WHEN a user with the "Senior_Section_Engineer" role uses the shed selector THEN the system does not offer an "All Sheds" option (reserved for Admin only), and if the user has no shed assignments, the selector shows no sheds or falls back to context sheds that don't match their access

1.4 WHEN a user with the "Senior_Section_Engineer" role views notes or coach details that reference other users THEN the system cannot resolve author names because the `users` table RLS policy only allows `id = auth.uid() OR is_admin()`

### Expected Behavior (Correct)

2.1 WHEN a user with the "Senior_Section_Engineer" role logs in and views the dashboard THEN the system SHALL display all active rakes, coaches, metrics, and POH process data for their assigned sheds, identical to what Admin sees for those same sheds

2.2 WHEN a user with the "Senior_Section_Engineer" role navigates to rake details or coach details THEN the system SHALL return full data (stage history, parts, checklists, tests, notes) for rakes in their assigned sheds

2.3 WHEN a user with the "Senior_Section_Engineer" role uses the shed selector THEN the system SHALL show all sheds the user is assigned to, and if the user is assigned to multiple sheds, allow switching between them; the default selection SHALL be the user's primary shed assignment

2.4 WHEN a user with the "Senior_Section_Engineer" role views notes or coach details that reference other users THEN the system SHALL resolve and display author names correctly by allowing SSE users to read basic profile info (full_name) of other users within their assigned sheds

2.5 WHEN a user with the "Senior_Section_Engineer" role accesses the sidebar navigation THEN the system SHALL show Dashboard, Register Rake, Completed Rakes, and Reports but SHALL NOT show User Management or Settings (Admin-only items)

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user with the "Admin" role logs in THEN the system SHALL CONTINUE TO display all data across all sheds, including user management and settings access

3.2 WHEN a user with the "Technician" role logs in THEN the system SHALL CONTINUE TO have view-only access with note-adding capability at their assigned sheds

3.3 WHEN a user with the "Viewer" role logs in THEN the system SHALL CONTINUE TO have read-only access at their assigned sheds

3.4 WHEN a user with the "Junior_Engineer" role logs in THEN the system SHALL CONTINUE TO have create/update/view access at their assigned sheds without user management access

3.5 WHEN RLS policies are evaluated for any role THEN the system SHALL CONTINUE TO enforce shed-based access control, preventing users from accessing data in sheds they are not assigned to

3.6 WHEN the Admin accesses User Management THEN the system SHALL CONTINUE TO allow full CRUD operations on users, shed assignments, and section assignments
