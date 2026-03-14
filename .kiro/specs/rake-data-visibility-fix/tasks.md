# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** - RLS Denies Data When Users/Shed Assignments Missing
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing cases:
    - Admin auth user with no `users` table row → `is_admin()` returns false → all RLS SELECT policies deny access
    - SSE auth user with `users` row but no `user_shed_assignments` rows → `user_has_shed_access()` returns false → all data denied
  - Create test file `src/__tests__/rake-visibility-fault.test.ts`
  - Mock the RLS evaluation chain: simulate `is_admin()` and `user_has_shed_access()` logic
  - Property: for all inputs where `isBugCondition(input)` is true (authUserId has no `users` row, OR non-Admin role with no `user_shed_assignments`), assert that after the fix, `user_has_shed_access(shedId)` returns true and dashboard queries return data
  - Test cases from design:
    - Admin user UUID `abc-123` with no `users` table row → verify `is_admin()` returns false and queries return empty
    - SSE user UUID `def-456` with `users` row but no `user_shed_assignments` → verify `user_has_shed_access()` returns false
    - Dashboard `getDashboardMetrics('all')` as auth user with no `users` row → verify all metrics are 0
    - ShedProvider for user with no shed assignments → verify fallback but data inaccessible
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Valid Users Continue To See Correct Data
  - **IMPORTANT**: Follow observation-first methodology
  - Create test file `src/__tests__/rake-visibility-preservation.test.ts`
  - Observe behavior on UNFIXED code for non-buggy inputs (users who DO have valid `users` rows and `user_shed_assignments`):
    - Observe: Admin with valid `users` row (`role = 'Admin'`) → `is_admin()` returns true → all data accessible
    - Observe: SSE with valid `users` row and `user_shed_assignments` for shed `GZB-EMU` → `user_has_shed_access('GZB-EMU')` returns true → shed-scoped data accessible
    - Observe: SSE user cannot see data from sheds they are NOT assigned to → `user_has_shed_access('OTHER-SHED')` returns false
    - Observe: Role-based write restrictions (only Admin, SSE, Junior_Engineer can create/update) remain enforced
    - Observe: Shed selector switching re-scopes queries correctly
  - Write property-based tests:
    - For all users with valid `users` row and `role = 'Admin'`, `is_admin()` returns true and `user_has_shed_access(anyShed)` returns true
    - For all non-Admin users with valid `users` row and matching `user_shed_assignments`, `user_has_shed_access(assignedShed)` returns true
    - For all non-Admin users, `user_has_shed_access(unassignedShed)` returns false (cross-shed denial preserved)
    - For all users, INSERT/UPDATE/DELETE RLS policies remain unchanged
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Fix RLS data visibility by provisioning users and shed assignments

  - [x] 3.1 Create migration 007 with auto-provisioning trigger and backfill
    - Create `supabase/migrations/007_auto_provision_user.sql`
    - Add `handle_new_auth_user()` function that fires on `auth.users` INSERT trigger
    - Function inserts a default `users` row with `role = 'Viewer'` and `is_active = true` if no row exists
    - Create AFTER INSERT trigger on `auth.users` table
    - Add one-time backfill INSERT: create `users` rows for existing `auth.users` entries missing a `users` row (default `role = 'Viewer'`)
    - _Bug_Condition: isBugCondition(input) where userRow IS NULL (no users table entry for auth user)_
    - _Expected_Behavior: After migration, every auth.users entry has a corresponding users table row, is_admin() returns true for Admin users, user_has_shed_access() returns true for users with shed assignments_
    - _Preservation: Existing users with valid rows are not modified; INSERT/UPDATE/DELETE RLS policies unchanged; migration 006 shared-shed visibility preserved_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

  - [x] 3.2 Uncomment seed data in seed.sql
    - Uncomment `INSERT INTO users` statements in `supabase/seed.sql`
    - Uncomment `INSERT INTO user_shed_assignments` statements in `supabase/seed.sql`
    - Update UUID placeholders to use subquery approach that looks up auth user by email, or add clear instructions for populating after auth user creation
    - _Bug_Condition: isBugCondition(input) where seed data is commented out, causing dev environments to have no users/assignments_
    - _Expected_Behavior: Development environments have working seed data with users and shed assignments out of the box_
    - _Preservation: No production impact; seed.sql only runs in development_
    - _Requirements: 2.1, 2.2, 2.5_

  - [x] 3.3 Improve shed context fallback in ShedProvider
    - Modify `src/lib/shed-context.tsx`
    - When a non-Admin user has no `user_shed_assignments`, instead of silently falling back to first shed from `sheds` table, set a state flag indicating the user needs shed assignment by an admin
    - Display a clear message or empty state when no shed assignments exist
    - Preserve existing behavior when shed assignments DO exist
    - _Bug_Condition: isBugCondition(input) where non-Admin user has no user_shed_assignments, ShedProvider masks the issue by falling back_
    - _Expected_Behavior: ShedProvider clearly indicates missing shed assignments instead of silently failing_
    - _Preservation: Existing shed selector switching and default shed resolution for users WITH assignments must remain unchanged_
    - _Requirements: 2.5, 3.4_

  - [x] 3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - RLS Grants Data When Users/Shed Assignments Provisioned
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1 (`src/__tests__/rake-visibility-fault.test.ts`)
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - Valid Users Continue To See Correct Data
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2 (`src/__tests__/rake-visibility-preservation.test.ts`)
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure all tests pass
  - Run full test suite to verify no regressions
  - Verify fault condition test passes (bug is fixed)
  - Verify preservation tests pass (no regressions)
  - Ensure all tests pass, ask the user if questions arise
