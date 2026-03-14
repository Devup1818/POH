# Rake Data Visibility Bugfix Design

## Overview

Rake data has disappeared for all users (Admin and SSE) because the Supabase RLS policy chain `user_has_shed_access(shed_id)` → `is_admin()` → `users` table lookup fails when the authenticated Supabase Auth user has no corresponding row in the application `users` table. For non-Admin roles, the additional check against `user_shed_assignments` also fails when those rows are missing. The fix ensures that the admin user creation flow atomically provisions both `users` and `user_shed_assignments` rows, adds a database trigger to auto-provision the `users` row on first login as a safety net, and uncomments the seed data so development environments work out of the box.

## Glossary

- **Bug_Condition (C)**: An authenticated Supabase Auth user whose UUID has no matching row in the `users` table (or, for non-Admin roles, no matching rows in `user_shed_assignments`), causing all RLS SELECT policies to deny access
- **Property (P)**: Every authenticated user with a valid `users` table entry (and shed assignments for non-Admin roles) can see rake, coach, and related data for their accessible sheds
- **Preservation**: Existing RLS enforcement for unauthorized access, role-based write restrictions, shed selector behavior, and the migration 006 shared-shed user visibility must remain unchanged
- **is_admin()**: Function in `supabase/migrations/003_rls_policies.sql` that checks `EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin')`
- **user_has_shed_access(shed_id)**: Function in `supabase/migrations/003_rls_policies.sql` that returns `is_admin() OR EXISTS (SELECT 1 FROM user_shed_assignments WHERE user_id = auth.uid() AND shed_id = check_shed_id)`
- **createUser()**: Server action in `src/lib/actions/admin-users.ts` that creates a Supabase Auth account, inserts into `users`, and inserts shed/section assignments
- **ShedProvider**: Client component in `src/lib/shed-context.tsx` that resolves the user's default shed from `user_shed_assignments`

## Bug Details

### Fault Condition

The bug manifests when an authenticated Supabase Auth user queries any RLS-protected table (`rakes`, `coaches`, `coach_stage_history`, `coach_parts`, `coach_checklist_items`, `coach_tests`, `notes`). The RLS policies call `user_has_shed_access(shed_id)`, which calls `is_admin()`, which looks up the `users` table by `auth.uid()`. If no row exists, `is_admin()` returns false. For non-Admin users, `user_has_shed_access()` then checks `user_shed_assignments` — if no rows exist there either, it returns false. Every SELECT returns zero rows.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { authUserId: UUID, targetTable: string, shedId: UUID }
  OUTPUT: boolean
  
  LET userRow = SELECT * FROM users WHERE id = input.authUserId
  LET shedAssignments = SELECT * FROM user_shed_assignments WHERE user_id = input.authUserId
  
  RETURN (userRow IS NULL)
         OR (userRow.role != 'Admin' AND shedAssignments IS EMPTY)
END FUNCTION
```

### Examples

- Admin user logs in with UUID `abc-123`, but `users` table has no row with `id = 'abc-123'` → `is_admin()` returns false → `user_has_shed_access()` returns false → dashboard shows 0 rakes, 0 coaches, all metrics at 0
- SSE user logs in with UUID `def-456`, `users` table has row with `role = 'Senior_Section_Engineer'`, but `user_shed_assignments` has no rows for `user_id = 'def-456'` → `is_admin()` returns false, shed assignment check returns false → dashboard shows 0 rakes
- SSE user logs in, `users` row exists, `user_shed_assignments` has entry for shed `GZB-EMU` → `user_has_shed_access('GZB-EMU')` returns true → data is visible (not buggy)
- Admin user logs in, `users` row exists with `role = 'Admin'` → `is_admin()` returns true → all data visible (not buggy)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- RLS policies must continue to deny access to data from sheds a non-Admin user is not assigned to
- Role-based write restrictions (only Admin, SSE, Junior_Engineer can create/update rakes and coaches) must remain enforced
- Shed selector switching must continue to re-scope dashboard queries to the selected shed
- Migration 006's shared-shed user visibility (users can see profiles of users who share a shed) must remain functional
- INSERT, UPDATE, DELETE RLS policies must remain unchanged
- Technician and Viewer read-only access patterns must remain unchanged
- The `createUser()` action's existing rollback behavior (delete auth account on DB error) must be preserved

**Scope:**
All inputs where the user has a valid `users` table entry AND appropriate `user_shed_assignments` entries should be completely unaffected by this fix. The fix only addresses the case where these rows are missing.

## Hypothesized Root Cause

Based on the bug description, the most likely issues are:

1. **Missing `users` table row**: The seed.sql file has the `INSERT INTO users` statements commented out. When a user is created via the Supabase Auth dashboard (not via the admin UI), no corresponding `users` table row is created. The `is_admin()` function then returns false for all users, blocking all RLS policies.

2. **Missing `user_shed_assignments` rows**: The seed.sql file also has the `INSERT INTO user_shed_assignments` statements commented out. Even if a `users` row exists for a non-Admin user, the `user_has_shed_access()` function returns false because there are no shed assignment rows.

3. **No auto-provisioning on first login**: The system has no mechanism to automatically create a `users` table row when a Supabase Auth user first authenticates. If a user is created directly in the Supabase Auth dashboard (bypassing the admin UI `createUser()` action), they will never get a `users` row.

4. **Shed context fallback masks the real issue**: The `ShedProvider` falls back to the first shed from the `sheds` table when no shed assignments exist, making it appear as though the user has a selected shed — but RLS still blocks data because there's no formal `user_shed_assignments` row.

## Correctness Properties

Property 1: Fault Condition - Authenticated Users With Provisioned Rows See Data

_For any_ authenticated user where the bug condition held (missing `users` row or missing `user_shed_assignments` rows), after applying the fix (migration 007 + seed.sql uncomment + auto-provisioning trigger), the user SHALL have a valid `users` table entry and appropriate `user_shed_assignments` entries, causing `user_has_shed_access()` to return true and all RLS SELECT policies to grant access to data within the user's accessible sheds.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

Property 2: Preservation - Unauthorized Access Still Denied

_For any_ authenticated user where the bug condition does NOT hold (user already has valid `users` row and `user_shed_assignments` entries), the fixed code SHALL produce exactly the same RLS evaluation results as the original code, preserving shed-scoped access restrictions, role-based write controls, and all existing query behavior.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `supabase/migrations/007_auto_provision_user.sql`

**Specific Changes**:
1. **Create auto-provisioning function**: Add a PostgreSQL function `handle_new_auth_user()` that fires on `auth.users` INSERT via a trigger. It inserts a default row into `users` with `role = 'Viewer'` and `is_active = true` if no row already exists. This ensures every Supabase Auth user gets a `users` table entry automatically.

2. **Create trigger on auth.users**: Attach `handle_new_auth_user()` as an AFTER INSERT trigger on `auth.users` so that users created via the Supabase dashboard or any auth method get auto-provisioned.

3. **Backfill existing auth users**: Add a one-time INSERT statement that creates `users` rows for any existing `auth.users` entries that don't have a corresponding `users` row, using `role = 'Viewer'` as the default.

**File**: `supabase/seed.sql`

**Specific Changes**:
4. **Uncomment seed user inserts**: Uncomment the `INSERT INTO users` and `INSERT INTO user_shed_assignments` statements, replacing the `<AUTH_USER_UUID>` placeholders with a note that these should be populated after creating the auth users, OR convert them to use a subquery approach that looks up the auth user by email.

**File**: `src/lib/shed-context.tsx`

**Specific Changes**:
5. **Improve fallback behavior**: When a non-Admin user has no `user_shed_assignments`, instead of silently falling back to the first shed (which still won't work due to RLS), display a clear message or set a state flag indicating the user needs shed assignment configuration by an admin.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate the RLS evaluation chain by mocking the `is_admin()` and `user_has_shed_access()` function behavior. Test with users that have no `users` table row and users that have no `user_shed_assignments` rows. Run these tests on the UNFIXED code to observe failures.

**Test Cases**:
1. **Admin No Users Row Test**: Simulate an Admin auth user with no `users` table row — verify `is_admin()` returns false and dashboard queries return empty (will fail on unfixed code)
2. **SSE No Shed Assignments Test**: Simulate an SSE auth user with a `users` row but no `user_shed_assignments` — verify `user_has_shed_access()` returns false and dashboard returns empty (will fail on unfixed code)
3. **Dashboard Zero Metrics Test**: Call `getDashboardMetrics('all')` as an auth user with no `users` row — verify all metrics are 0 (will fail on unfixed code, confirming the bug)
4. **Shed Context Fallback Test**: Initialize `ShedProvider` for a user with no shed assignments — verify it falls back but data is still inaccessible (will fail on unfixed code)

**Expected Counterexamples**:
- `is_admin()` returns false for Admin users because `users` table lookup fails
- `user_has_shed_access()` returns false for SSE users because `user_shed_assignments` is empty
- Possible causes: missing `users` row (confirmed by commented-out seed.sql), missing shed assignments

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  -- Apply migration 007 (auto-provisioning trigger + backfill)
  result := queryDashboard(input.authUserId, input.shedId)
  ASSERT result.activeRakeCount > 0 OR no rakes exist for that shed
  ASSERT user_has_shed_access(input.shedId) = true
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT queryDashboard_original(input) = queryDashboard_fixed(input)
  ASSERT user_has_shed_access_original(input.shedId) = user_has_shed_access_fixed(input.shedId)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain (different user roles, shed combinations)
- It catches edge cases that manual unit tests might miss (e.g., users with multiple shed assignments)
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for users who DO have valid `users` rows and `user_shed_assignments`, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Admin With Valid Row Preservation**: Observe that an Admin with a valid `users` row can see all data on unfixed code, then verify this continues after fix
2. **SSE With Valid Assignments Preservation**: Observe that an SSE with valid shed assignments can see shed-scoped data on unfixed code, then verify this continues after fix
3. **Cross-Shed Denial Preservation**: Observe that a user cannot see data from unassigned sheds on unfixed code, then verify this continues after fix
4. **Write Restriction Preservation**: Observe that role-based write restrictions work on unfixed code, then verify this continues after fix

### Unit Tests

- Test `is_admin()` returns true when `users` row exists with `role = 'Admin'`
- Test `is_admin()` returns false when `users` row is missing
- Test `user_has_shed_access()` returns true for Admin regardless of shed assignments
- Test `user_has_shed_access()` returns true for SSE with matching shed assignment
- Test `user_has_shed_access()` returns false for SSE with no shed assignments
- Test auto-provisioning trigger creates `users` row on auth.users INSERT
- Test `ShedProvider` handles missing shed assignments gracefully

### Property-Based Tests

- Generate random user configurations (role, shed assignments present/absent) and verify RLS evaluation matches expected behavior after fix
- Generate random shed/user combinations and verify `user_has_shed_access()` returns correct boolean based on assignments
- Test that all existing users with valid rows continue to see the same data before and after migration 007

### Integration Tests

- Test full flow: create user via admin UI → user logs in → dashboard shows data
- Test full flow: create user via Supabase dashboard → auto-provisioning trigger fires → user logs in → user gets Viewer access
- Test shed context initialization with and without shed assignments
- Test that migration 007 backfill correctly provisions existing auth users
