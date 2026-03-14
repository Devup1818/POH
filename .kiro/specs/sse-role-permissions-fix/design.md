# SSE Role Permissions Fix — Bugfix Design

## Overview

When a Senior Section Engineer (SSE) logs in, the dashboard shows no data because of three interrelated issues: (1) missing shed assignments in `user_shed_assignments` prevent RLS policies from granting data access, (2) the shed selector only offers "All Sheds" to Admin, leaving SSE with no valid shed context, and (3) the `users` table RLS policy blocks SSE from reading other users' profiles (needed for note author names). The fix ensures SSE users get full operational data access for their assigned sheds — identical to Admin — while keeping user management restricted to Admin only.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — an authenticated user with role `Senior_Section_Engineer` attempts to read operational data (rakes, coaches, stages, parts, checklists, tests, notes, dashboard metrics) but receives empty results due to missing shed assignments, restrictive shed selector logic, and overly narrow `users` table RLS
- **Property (P)**: The desired behavior — SSE users see all operational data for their assigned sheds, can resolve other users' names, and the shed selector defaults to their primary shed assignment
- **Preservation**: Admin full-access behavior, Technician/Viewer/Junior_Engineer access levels, and all existing RLS shed-based isolation must remain unchanged
- **`user_has_shed_access()`**: RLS helper function in `003_rls_policies.sql` that checks if the current user is Admin or has a `user_shed_assignments` row for the given shed
- **`is_admin()`**: RLS helper function that returns true if the current user's role is `Admin`
- **Shed Selector**: `src/components/layout/shed-selector.tsx` — UI component that determines which sheds appear in the dropdown and which shed is selected by default

## Bug Details

### Fault Condition

The bug manifests when a user with role `Senior_Section_Engineer` logs in and the system attempts to load dashboard data, rake details, or coach details. Three conditions combine to produce zero results:

1. The SSE user has no rows in `user_shed_assignments`, so `user_has_shed_access(shed_id)` returns `false` for every shed, and all RLS SELECT policies on `rakes`, `coaches`, `coach_stage_history`, `coach_parts`, `coach_checklist_items`, `coach_tests`, and `notes` deny access.
2. The shed selector component only shows "All Sheds" as a selectable option for Admin users. Non-admin users without shed assignments fall back to context sheds that may not match their RLS access, or the selector shows no sheds at all.
3. The `users` table RLS policy `USING (id = auth.uid() OR is_admin())` prevents SSE from reading any other user's profile, so joins like `author:created_by ( full_name )` in the notes query return null.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { userId: UUID, role: UserRole, action: 'read_operational_data' }
  OUTPUT: boolean

  RETURN input.role = 'Senior_Section_Engineer'
         AND countRows(user_shed_assignments WHERE user_id = input.userId) = 0
         AND input.action IN ['view_dashboard', 'view_rake', 'view_coach', 'view_notes']
END FUNCTION
```

### Examples

- **Dashboard empty**: SSE user "Vijay Saini" assigned to EMU Car Shed Ghaziabad logs in. The shed selector defaults to first context shed or 'all'. `getDashboardMetrics('all')` queries `rakes` table, but RLS calls `user_has_shed_access(shed_id)` which returns false because no `user_shed_assignments` row exists. Result: 0 active rakes, 0 coaches, all metrics at 0.
- **Rake detail inaccessible**: SSE navigates to `/rakes/[rakeId]`. The `rakes` RLS policy checks `user_has_shed_access(rakes.shed_id)` → false. Query returns null. Page shows "Rake not found."
- **Note author unresolved**: Even if data access were fixed, `getCoachNotes()` joins `notes.created_by` to `users.full_name`. The `users` RLS policy only allows `id = auth.uid() OR is_admin()`, so the join returns null for other users' names. Notes show "Unknown" as author.
- **Shed selector shows no useful options**: SSE user sees the shed dropdown but "All Sheds" is only available to Admin. With no shed assignments, the non-admin branch fetches zero assignments and falls back to context sheds, which may not align with RLS access.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Admin users must continue to see all data across all sheds, including "All Sheds" option in the shed selector
- Admin must retain full CRUD on User Management and Settings
- Technician users must continue to have view-only access plus note-adding at their assigned sheds
- Viewer users must continue to have read-only access at their assigned sheds
- Junior_Engineer users must continue to have create/update/view access at their assigned sheds
- RLS shed-based isolation must continue to prevent users from accessing data in sheds they are not assigned to
- All existing INSERT, UPDATE, DELETE RLS policies must remain unchanged

**Scope:**
All inputs that do NOT involve a `Senior_Section_Engineer` user with missing shed assignments should be completely unaffected by this fix. This includes:
- Admin user login and data access
- Any role with existing valid shed assignments
- All write operations (create rake, update coach, add notes)
- User management CRUD operations

## Hypothesized Root Cause

Based on the bug description and code analysis, the three root causes are:

1. **Missing Shed Assignments (Primary)**: The seed data in `supabase/seed.sql` does not create `user_shed_assignments` rows for SSE users. The admin user creation flow (`src/lib/actions/admin-users.ts`) may also fail to create shed assignments when creating SSE users. Without these rows, `user_has_shed_access()` always returns false for non-Admin users, and every RLS SELECT policy denies access.

2. **Shed Selector Admin-Only "All Sheds" Logic**: In `src/components/layout/shed-selector.tsx`, the `fetchUserSheds` function checks `profile?.role === 'Admin'` and only fetches all sheds for Admin. For non-admin users, it queries `user_shed_assignments` — but if those rows are missing, it falls back to context sheds. The shed selector should also handle SSE users who have multiple shed assignments and allow them to switch between assigned sheds, defaulting to their primary shed.

3. **Users Table RLS Too Restrictive**: The policy `USING (id = auth.uid() OR is_admin())` on the `users` table means non-Admin users can only read their own profile. This breaks the `author:created_by ( full_name )` join in `getCoachNotes()` and any other query that needs to resolve user names. SSE (and other roles) need to read basic profile info (at minimum `full_name`) of users within their assigned sheds.

## Correctness Properties

Property 1: Fault Condition — SSE Users See Operational Data for Assigned Sheds

_For any_ authenticated user with role `Senior_Section_Engineer` who has valid shed assignments in `user_shed_assignments`, the system SHALL return all rakes, coaches, stage history, parts, checklists, tests, and notes for sheds the user is assigned to, with dashboard metrics reflecting accurate counts and the shed selector defaulting to the user's primary shed.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation — Non-SSE Role Behavior Unchanged

_For any_ authenticated user whose role is NOT `Senior_Section_Engineer` (Admin, Junior_Engineer, Technician, Viewer), the system SHALL produce exactly the same data access behavior as before the fix, preserving Admin's full cross-shed access, Technician's view+notes access, Viewer's read-only access, and Junior_Engineer's create/update/view access at assigned sheds.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

Property 3: Preservation — User Name Resolution for Notes

_For any_ authenticated user viewing notes on a coach within their assigned shed, the system SHALL resolve the `full_name` of the note author correctly, regardless of the viewing user's role.

**Validates: Requirements 2.4**

Property 4: Preservation — Sidebar Navigation Correct per Role

_For any_ authenticated user, the sidebar SHALL show User Management and Settings only for Admin role, Register Rake for Admin and SSE, and Dashboard/Completed Rakes/Reports for all roles.

**Validates: Requirements 2.5, 3.1**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `supabase/migrations/006_sse_permissions_fix.sql` (new migration)

**Specific Changes**:
1. **Update `users` table RLS SELECT policy**: Replace the current policy `USING (id = auth.uid() OR is_admin())` with a broader policy that allows any authenticated user to read basic profile info of users who share a shed assignment. This enables note author name resolution.
   - New policy: Allow reading users who share at least one shed via `user_shed_assignments`, OR own profile, OR if Admin.
   - Implementation: `USING (id = auth.uid() OR is_admin() OR EXISTS (SELECT 1 FROM user_shed_assignments usa1 JOIN user_shed_assignments usa2 ON usa1.shed_id = usa2.shed_id WHERE usa1.user_id = auth.uid() AND usa2.user_id = users.id))`

**File**: `supabase/seed.sql`

**Specific Changes**:
2. **Add shed assignment seed data**: Ensure the seed SQL includes `user_shed_assignments` rows for the SSE test user, so that after seeding, the SSE user has a valid primary shed assignment. Update the commented-out section to include the INSERT for `user_shed_assignments`.

**File**: `src/components/layout/shed-selector.tsx`

**Specific Changes**:
3. **Allow SSE to see "All Sheds" if assigned to multiple sheds**: Currently only Admin gets the "All Sheds" option. Modify the logic so that if a non-admin user has multiple shed assignments, they can see all their assigned sheds and switch between them. The "All Sheds" option should be available to SSE users who have assignments to multiple sheds (or remove the "All Sheds" option for non-admin and just show their assigned sheds with the primary as default).
   - Simpler approach: Keep "All Sheds" as Admin-only, but ensure non-admin users with shed assignments see their assigned sheds correctly and default to their primary shed. The key fix is ensuring shed assignments exist so the non-admin branch works correctly.

**File**: `src/lib/shed-context.tsx`

**Specific Changes**:
4. **Default shed selection for non-admin users**: The `ShedProvider` currently defaults to `data[0].id` (first shed from `getSheds()` which returns ALL active sheds). For non-admin users, the default should come from the shed selector's primary assignment logic. No change needed here if the shed selector correctly calls `setSelectedShedId` with the primary shed on mount.

**File**: `src/lib/actions/admin-users.ts` (if it exists)

**Specific Changes**:
5. **Ensure user creation includes shed assignments**: When an Admin creates a new SSE user via User Management, the action must also insert a row into `user_shed_assignments` with the selected shed and `is_primary = true`. Verify this is already happening; if not, add it.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate an SSE user querying dashboard data, rake details, and coach notes. Run these tests on the UNFIXED code to observe failures and confirm the three root causes.

**Test Cases**:
1. **SSE Dashboard Empty Test**: Simulate SSE user calling `getDashboardMetrics` with their shed ID — expect 0 results due to missing shed assignment (will fail on unfixed code)
2. **SSE Rake Access Denied Test**: Simulate SSE user querying a rake in their shed — expect null/empty due to RLS denial (will fail on unfixed code)
3. **SSE Note Author Resolution Test**: Simulate SSE user fetching notes — expect author names to be "Unknown" because `users` RLS blocks the join (will fail on unfixed code)
4. **SSE Shed Selector Fallback Test**: Simulate SSE user with no shed assignments opening shed selector — expect fallback to context sheds with no matching RLS access (will fail on unfixed code)

**Expected Counterexamples**:
- Dashboard returns `activeRakeCount: 0` for SSE user despite rakes existing in their shed
- Note author names resolve to null/"Unknown" for non-Admin users
- Possible causes: missing `user_shed_assignments` rows, `users` RLS too restrictive, shed selector not defaulting to assigned shed

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  -- After fix: SSE user has shed assignments and relaxed RLS
  result := queryOperationalData_fixed(input.userId, input.shedId)
  ASSERT result.rakeCount > 0 WHEN rakesExistInShed(input.shedId)
  ASSERT result.noteAuthors DO NOT CONTAIN 'Unknown' WHEN authorExists
  ASSERT shedSelector.defaultShed = primaryShedAssignment(input.userId)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT queryOperationalData_original(input) = queryOperationalData_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for Admin, Technician, Viewer, and Junior_Engineer roles, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Admin Full Access Preservation**: Observe that Admin sees all rakes across all sheds on unfixed code, then verify this continues after fix
2. **Technician Shed-Scoped Access Preservation**: Observe that Technician only sees data for assigned sheds on unfixed code, then verify this continues after fix
3. **Viewer Read-Only Preservation**: Observe that Viewer has read-only access on unfixed code, then verify this continues after fix
4. **RLS Shed Isolation Preservation**: Observe that users cannot see data from unassigned sheds on unfixed code, then verify this continues after fix

### Unit Tests

- Test `user_has_shed_access()` returns true for SSE with valid shed assignment
- Test `user_has_shed_access()` returns false for SSE with no assignment to a given shed
- Test `users` RLS allows SSE to read `full_name` of users sharing a shed
- Test `users` RLS still blocks reading users from unrelated sheds
- Test shed selector defaults to primary shed for SSE user
- Test sidebar shows correct nav items for SSE role

### Property-Based Tests

- Generate random user/role/shed combinations and verify RLS access matches expected behavior: Admin sees all, SSE sees assigned sheds, other roles see assigned sheds
- Generate random note queries and verify author name resolution works for all roles with valid shed assignments
- Generate random shed selector states and verify the dropdown options match the user's shed assignments

### Integration Tests

- Test full SSE login → dashboard → rake detail → coach detail flow with valid shed assignments
- Test SSE user switching between assigned sheds in the shed selector
- Test that SSE cannot access rakes in sheds they are not assigned to
- Test that Admin creating an SSE user results in proper shed assignment creation
