# Bugfix Requirements Document

## Introduction

Rake data that was previously visible to both Admin and SSE users has disappeared from the dashboard, rake detail pages, and coach process/stage views. Neither Admin nor SSE users can see any rake data, coach data, or current process stage information. The system shows zero active rakes, zero coaches, and all metrics at 0.

The root cause is that the Supabase RLS policies governing data access depend on the `user_has_shed_access(shed_id)` function, which in turn calls `is_admin()` — a function that checks for a matching row in the `users` table. If the authenticated Supabase Auth user does not have a corresponding entry in the application `users` table (or lacks `user_shed_assignments` entries for non-Admin roles), all RLS SELECT policies return false and no data is returned. This affects every data table: `rakes`, `coaches`, `coach_stage_history`, `coach_parts`, `coach_checklist_items`, `coach_tests`, and `notes`.

Contributing factors:
- The `users` table row (linked to `auth.users` via UUID) may be missing or have a mismatched role, causing `is_admin()` to return false for Admin users
- The `user_shed_assignments` table may have no entries for SSE users (seed data has these inserts commented out), causing `user_has_shed_access()` to return false
- The shed context provider reads `user_shed_assignments` to determine the default shed; with no assignments, it falls back to the first shed from the `sheds` table, but RLS still blocks data access because the user has no formal assignment to that shed
- When the dashboard passes `shedId = 'all'` (Admin default), the query skips the `shed_id` SQL filter, but RLS still evaluates `user_has_shed_access(shed_id)` per row — if the user's `users` table entry is missing, every row is denied

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN an Admin user logs in and views the dashboard THEN the system shows zero active rakes, zero coaches, and all metrics at 0 because the `is_admin()` RLS function cannot find a matching row in the `users` table for the authenticated user's UUID (or the row exists but `user_has_shed_access()` still fails), causing all RLS SELECT policies on `rakes`, `coaches`, and related tables to deny access

1.2 WHEN an SSE user logs in and views the dashboard THEN the system shows zero active rakes, zero coaches, and all metrics at 0 because the user has no entries in `user_shed_assignments`, causing `user_has_shed_access()` to return false for every shed, and all RLS SELECT policies deny access to rake and coach data

1.3 WHEN any authenticated user navigates to a rake detail page (`/rakes/[rakeId]`) THEN the system returns null/no data and shows "Rake not found" because the RLS policy on the `rakes` table denies the SELECT, and consequently all dependent queries on `coaches`, `coach_parts`, `coach_stage_history`, `coach_checklist_items`, and `coach_tests` also return empty results

1.4 WHEN any authenticated user views coach detail pages THEN the system cannot display the current process stage, stage timeline, parts status, checklist progress, or test results because RLS policies on `coaches` and all child tables (`coach_stage_history`, `coach_parts`, `coach_checklist_items`, `coach_tests`, `notes`) deny access through the cascading `user_has_shed_access()` check

1.5 WHEN the shed context provider initializes for a non-Admin user THEN it queries `user_shed_assignments` to determine the default shed, but with no assignment rows present, it falls back to the first shed from the `sheds` table — however RLS still blocks all data queries because the user has no formal shed assignment record

### Expected Behavior (Correct)

2.1 WHEN an Admin user logs in and views the dashboard THEN the system SHALL display all active rakes, all coaches, and accurate metrics across all sheds, because the Admin user has a valid entry in the `users` table with `role = 'Admin'` and the `is_admin()` function returns true, granting access through all RLS policies

2.2 WHEN an SSE user logs in and views the dashboard THEN the system SHALL display all active rakes, coaches, and metrics for their assigned sheds, because the user has valid entries in `user_shed_assignments` and `user_has_shed_access()` returns true for those sheds

2.3 WHEN any authorized user navigates to a rake detail page THEN the system SHALL return the full rake data including all coaches, their current stages, stage history, parts status, checklist progress, and test results for rakes within the user's accessible sheds

2.4 WHEN any authorized user views coach detail pages THEN the system SHALL display the current process stage, complete stage timeline, parts status with counts, checklist completion percentage, and test results — all data from `coaches`, `coach_stage_history`, `coach_parts`, `coach_checklist_items`, `coach_tests`, and `notes` tables SHALL be accessible per the user's shed access

2.5 WHEN the shed context provider initializes for a non-Admin user with valid shed assignments THEN it SHALL correctly resolve the user's primary shed assignment and set it as the default selected shed, ensuring subsequent data queries are scoped to an accessible shed

2.6 WHEN a new user is created via the admin user management flow THEN the system SHALL ensure the user has both a `users` table entry and appropriate `user_shed_assignments` entries so that RLS policies grant data access from the moment the user first logs in

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a Technician user logs in THEN the system SHALL CONTINUE TO show read-only rake and coach data for their assigned sheds with the ability to add notes

3.2 WHEN a Viewer user logs in THEN the system SHALL CONTINUE TO show read-only rake and coach data for their assigned sheds without any write capabilities

3.3 WHEN a user attempts to access data from a shed they are not assigned to THEN the system SHALL CONTINUE TO deny access via RLS policies, returning no data for that shed

3.4 WHEN the shed selector is used to switch between sheds THEN the system SHALL CONTINUE TO re-fetch dashboard data scoped to the newly selected shed

3.5 WHEN RLS policies evaluate INSERT, UPDATE, or DELETE operations THEN the system SHALL CONTINUE TO enforce role-based restrictions (only Admin and Engineers can create/update rakes and coaches)

3.6 WHEN the `users` table RLS SELECT policy (updated in migration 006) is evaluated THEN the system SHALL CONTINUE TO allow users to view profiles of other users who share a shed via `user_shed_assignments`, enabling note author name resolution
