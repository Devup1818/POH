# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Fault Condition** — SSE User Gets Empty Dashboard Data
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists for SSE users
  - **Scoped PBT Approach**: Scope the property to the concrete failing case: a user with role `Senior_Section_Engineer` who has no `user_shed_assignments` rows attempting to read operational data
  - Write a property-based test in `src/__tests__/sse-fault-condition.test.ts` using Vitest
  - From Fault Condition in design: `isBugCondition(input)` returns true when `input.role = 'Senior_Section_Engineer' AND countRows(user_shed_assignments WHERE user_id = input.userId) = 0 AND input.action IN ['view_dashboard', 'view_rake', 'view_coach', 'view_notes']`
  - Test the following assertions (matching Expected Behavior Properties from design):
    - SSE user with shed assignments should see rakes for their assigned sheds (currently fails: returns 0)
    - SSE user should be able to resolve note author names (currently fails: returns null/"Unknown")
    - Shed selector should show assigned sheds for SSE and default to primary shed (currently fails: falls back to context sheds)
  - Since this is a client/server app with Supabase, test the permission logic and shed selector logic in isolation:
    - Test `canAccessShed()` from `src/lib/auth/permissions.ts` — SSE with shed assignment should return true
    - Test shed selector logic — non-admin user with shed assignments should see their assigned sheds, not just "All Sheds"
    - Test sidebar nav visibility — SSE should see Dashboard, Register Rake, Completed Rakes, Reports but NOT User Management or Settings
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct — it proves the bug exists)
  - Document counterexamples found (e.g., "SSE user with no shed assignments gets canAccessShed() = false for all sheds")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** — Non-SSE Role Behavior Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Write property-based tests in `src/__tests__/sse-preservation.test.ts` using Vitest
  - Observe behavior on UNFIXED code for non-buggy inputs (roles other than SSE with missing shed assignments):
  - Observe: `canCreateRake('Admin')` returns true, `canCreateRake('Viewer')` returns false
  - Observe: `canManageUsers('Admin')` returns true, `canManageUsers('Junior_Engineer')` returns false
  - Observe: `canUpdateCoach('Junior_Engineer')` returns true, `canUpdateCoach('Technician')` returns false
  - Observe: `canAddNotes('Technician')` returns true, `canAddNotes('Viewer')` returns false
  - Observe: Sidebar NAV_ITEMS with `roles: ['Admin']` (User Management, Settings) only visible to Admin
  - Observe: Sidebar NAV_ITEMS with `roles: ['Admin', 'Senior_Section_Engineer']` (Register Rake) visible to Admin and SSE
  - Observe: Sidebar NAV_ITEMS with no `roles` restriction (Dashboard, Completed Rakes, Reports) visible to all roles
  - Write property-based tests: for all roles in `['Admin', 'Junior_Engineer', 'Technician', 'Viewer']`, permission functions return the same values as observed
  - Write property-based tests: for all roles, sidebar visibility matches the role-based filter logic
  - Verify tests pass on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Fix for SSE role permissions — empty dashboard data

  - [x] 3.1 Create migration `supabase/migrations/006_sse_permissions_fix.sql`
    - Update `users` table RLS SELECT policy: replace `USING (id = auth.uid() OR is_admin())` with a policy that allows any authenticated user to read profiles of users who share a shed via `user_shed_assignments`
    - New policy: `USING (id = auth.uid() OR is_admin() OR EXISTS (SELECT 1 FROM user_shed_assignments usa1 JOIN user_shed_assignments usa2 ON usa1.shed_id = usa2.shed_id WHERE usa1.user_id = auth.uid() AND usa2.user_id = users.id))`
    - This enables SSE (and other roles) to resolve note author names for users in shared sheds
    - Verify all existing INSERT, UPDATE, DELETE RLS policies remain unchanged
    - _Bug_Condition: isBugCondition(input) where input.role = 'Senior_Section_Engineer' AND no user_shed_assignments rows exist_
    - _Expected_Behavior: SSE users can read full_name of users sharing a shed assignment_
    - _Preservation: Admin full access unchanged, existing RLS INSERT/UPDATE/DELETE policies unchanged_
    - _Requirements: 1.4, 2.4_

  - [x] 3.2 Update seed data in `supabase/seed.sql`
    - Add `user_shed_assignments` INSERT for the SSE test user (Vijay Saini, EMU Car Shed Ghaziabad)
    - Set `is_primary = true` for the SSE user's primary shed
    - Ensure seed data does not duplicate existing assignments
    - _Bug_Condition: SSE user has zero rows in user_shed_assignments after seeding_
    - _Expected_Behavior: SSE user has at least one shed assignment with is_primary = true after seeding_
    - _Preservation: Existing seed data for Admin and other roles unchanged_
    - _Requirements: 1.1, 1.2, 2.1, 2.2_

  - [x] 3.3 Fix shed selector in `src/components/layout/shed-selector.tsx`
    - The non-admin branch already fetches `user_shed_assignments` and sets primary shed — this logic is correct
    - Verify that when SSE user has shed assignments, the selector shows those sheds and defaults to primary
    - Keep "All Sheds" option as Admin-only (no change needed for this)
    - Ensure the fallback to context sheds only triggers when no shed assignments exist
    - If no code changes needed (logic already correct once shed assignments exist), document this finding
    - _Bug_Condition: SSE user with no shed assignments sees fallback context sheds_
    - _Expected_Behavior: SSE user with shed assignments sees assigned sheds, defaults to primary_
    - _Preservation: Admin "All Sheds" behavior unchanged, non-admin shed assignment logic unchanged_
    - _Requirements: 1.3, 2.3_

  - [x] 3.4 Verify admin user creation flow in `src/lib/actions/admin-users.ts`
    - Check that when Admin creates a new SSE user, a `user_shed_assignments` row is created with the selected shed and `is_primary = true`
    - If the flow does not create shed assignments, add the INSERT to the user creation action
    - _Bug_Condition: Admin creates SSE user but no shed assignment row is inserted_
    - _Expected_Behavior: User creation flow inserts user_shed_assignments for the assigned shed_
    - _Preservation: Existing user creation for other roles unchanged_
    - _Requirements: 2.1, 2.2_

  - [x] 3.5 Verify permissions in `src/lib/auth/permissions.ts`
    - Confirm SSE role is already included in RAKE_CREATORS, COACH_UPDATERS, NOTE_ADDERS arrays
    - Confirm SSE is NOT in ADMIN_ONLY (canManageUsers, canManageSheds should return false for SSE)
    - If any permission is missing for SSE, add it
    - _Bug_Condition: SSE role missing from permission arrays_
    - _Expected_Behavior: SSE has create/update/view/notes permissions, no user management_
    - _Preservation: All other role permissions unchanged_
    - _Requirements: 2.1, 2.2, 2.5_

  - [x] 3.6 Verify sidebar navigation in `src/components/layout/sidebar.tsx`
    - Confirm Register Rake has `roles: ['Admin', 'Senior_Section_Engineer']` — SSE should see it
    - Confirm User Management has `roles: ['Admin']` — SSE should NOT see it
    - Confirm Settings has `roles: ['Admin']` — SSE should NOT see it
    - Confirm Dashboard, Completed Rakes, Reports have no `roles` restriction — visible to all
    - If any nav item role config is incorrect for SSE, fix it
    - _Bug_Condition: SSE sees admin-only nav items or misses operational nav items_
    - _Expected_Behavior: SSE sees Dashboard, Register Rake, Completed Rakes, Reports only_
    - _Preservation: Admin sees all nav items, other roles see correct items_
    - _Requirements: 2.5, 3.1_

  - [x] 3.7 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** — SSE User Gets Dashboard Data for Assigned Sheds
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.8 Verify preservation tests still pass
    - **Property 2: Preservation** — Non-SSE Role Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint — Ensure all tests pass
  - Run full test suite: `npx vitest --run`
  - Ensure `src/__tests__/sse-fault-condition.test.ts` passes (bug is fixed)
  - Ensure `src/__tests__/sse-preservation.test.ts` passes (no regressions)
  - Ensure `src/__tests__/permissions.test.ts` passes (existing tests unchanged)
  - Ask the user if questions arise
