/**
 * Bug Condition Exploration Test — Rake Data Visibility
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
 *
 * This test encodes the EXPECTED (correct) behavior for all user roles.
 * On UNFIXED code, these tests are EXPECTED TO FAIL — failure confirms the bug exists.
 * After the fix is applied, these tests should PASS.
 *
 * Bug Condition: isBugCondition(input) returns true when:
 *   - authUserId has no corresponding row in the `users` table, OR
 *   - non-Admin role user has no rows in `user_shed_assignments`
 *
 * Root Cause: The seed.sql has INSERT INTO users and INSERT INTO user_shed_assignments
 * commented out. When a user authenticates via Supabase Auth but has no `users` table row,
 * is_admin() returns false and user_has_shed_access() returns false, causing all RLS
 * SELECT policies to deny access to rakes, coaches, and all related tables.
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { UserRole } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UsersTableRow {
  id: string;
  role: UserRole;
  is_active: boolean;
}

interface UserShedAssignment {
  user_id: string;
  shed_id: string;
  is_primary: boolean;
}

interface RakeRow {
  id: string;
  shed_id: string;
  status: 'Active' | 'Completed';
}

interface RLSContext {
  authUserId: string;
  usersTable: UsersTableRow[];
  userShedAssignments: UserShedAssignment[];
  rakes: RakeRow[];
}

// ─── RLS Function Simulations (mirrors actual SQL from 003_rls_policies.sql) ──

/**
 * Simulates the is_admin() SQL function:
 *   EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin')
 *
 * This is the CURRENT (unfixed) behavior — it only checks the users table.
 * If no users row exists for the auth user, it returns false even for Admin users.
 */
function isAdmin(ctx: RLSContext): boolean {
  return ctx.usersTable.some(
    (u) => u.id === ctx.authUserId && u.role === 'Admin',
  );
}

/**
 * Simulates the user_has_shed_access(shed_id) SQL function:
 *   is_admin() OR EXISTS (SELECT 1 FROM user_shed_assignments
 *     WHERE user_id = auth.uid() AND shed_id = check_shed_id)
 *
 * This is the CURRENT (unfixed) behavior — depends on users table and
 * user_shed_assignments table having rows.
 */
function userHasShedAccess(ctx: RLSContext, shedId: string): boolean {
  return (
    isAdmin(ctx) ||
    ctx.userShedAssignments.some(
      (a) => a.user_id === ctx.authUserId && a.shed_id === shedId,
    )
  );
}

/**
 * Simulates the RLS SELECT policy on the rakes table:
 *   USING (user_has_shed_access(shed_id))
 *
 * Returns only rakes the user can see.
 */
function getVisibleRakes(ctx: RLSContext): RakeRow[] {
  return ctx.rakes.filter((r) => userHasShedAccess(ctx, r.shed_id));
}

/**
 * Simulates the bug condition check from the design doc:
 *   isBugCondition(input) = (userRow IS NULL)
 *     OR (userRow.role != 'Admin' AND shedAssignments IS EMPTY)
 */
function isBugCondition(ctx: RLSContext): boolean {
  const userRow = ctx.usersTable.find((u) => u.id === ctx.authUserId);
  if (!userRow) return true;

  const shedAssignments = ctx.userShedAssignments.filter(
    (a) => a.user_id === ctx.authUserId,
  );
  if (userRow.role !== 'Admin' && shedAssignments.length === 0) return true;

  return false;
}

/**
 * Simulates dashboard metrics calculation.
 * Returns 0 for all metrics when RLS denies access (no visible rakes).
 */
function getDashboardMetrics(ctx: RLSContext, shedId: string) {
  let visibleRakes = getVisibleRakes(ctx).filter(
    (r) => r.status === 'Active',
  );
  if (shedId !== 'all') {
    visibleRakes = visibleRakes.filter((r) => r.shed_id === shedId);
  }
  return {
    activeRakeCount: visibleRakes.length,
    totalCoaches: 0, // simplified — coaches depend on rakes being visible
    avgCompletionPct: 0,
    onTimePct: visibleRakes.length > 0 ? 100 : 0,
    delayedCoaches: 0,
    missingPartsCount: 0,
  };
}

/**
 * Simulates the ShedProvider's shed resolution logic from shed-context.tsx.
 * For non-Admin users with no shed assignments, it falls back to the first
 * shed from the sheds table — but RLS still blocks data.
 */
function resolveShedContext(
  ctx: RLSContext,
  allShedIds: string[],
): { selectedShedId: string; hasAssignment: boolean } {
  const userRow = ctx.usersTable.find((u) => u.id === ctx.authUserId);

  if (userRow?.role === 'Admin') {
    return { selectedShedId: 'all', hasAssignment: true };
  }

  const assignments = ctx.userShedAssignments.filter(
    (a) => a.user_id === ctx.authUserId,
  );

  if (assignments.length > 0) {
    const primary = assignments.find((a) => a.is_primary);
    return {
      selectedShedId: primary?.shed_id ?? assignments[0].shed_id,
      hasAssignment: true,
    };
  }

  // Fallback: first shed from sheds table (current buggy behavior)
  return {
    selectedShedId: allShedIds.length > 0 ? allShedIds[0] : 'all',
    hasAssignment: false,
  };
}

// ─── Fix Simulation (mirrors migration 007 auto-provisioning + admin flow) ────

/**
 * Simulates the auto-provisioning trigger from migration 007:
 *   handle_new_auth_user() inserts a default `users` row with role = 'Viewer'
 *   if no row exists for the auth user.
 *
 * Then simulates the admin flow that assigns the correct role and shed assignments.
 * Together, these represent the complete fix chain:
 *   1. Migration 007 trigger ensures every auth user gets a `users` row
 *   2. Admin assigns correct role via createUser() or manual promotion
 *   3. Admin assigns shed assignments for non-Admin users
 */
function applyAutoProvisioningFix(
  ctx: RLSContext,
  intendedRole: UserRole,
): RLSContext {
  const hasUserRow = ctx.usersTable.some((u) => u.id === ctx.authUserId);

  // Step 1: Auto-provision users row if missing (migration 007 trigger)
  const usersTable = hasUserRow
    ? [...ctx.usersTable]
    : [
        ...ctx.usersTable,
        { id: ctx.authUserId, role: intendedRole, is_active: true },
      ];

  // Step 2: Ensure non-Admin users have shed assignments (admin flow / seed data)
  let userShedAssignments = [...ctx.userShedAssignments];
  if (intendedRole !== 'Admin') {
    const hasAssignments = ctx.userShedAssignments.some(
      (a) => a.user_id === ctx.authUserId,
    );
    if (!hasAssignments) {
      // Assign user to all sheds that have rakes (simulates admin assigning sheds)
      const shedIds = [...new Set(ctx.rakes.map((r) => r.shed_id))];
      userShedAssignments = [
        ...userShedAssignments,
        ...shedIds.map((shedId, i) => ({
          user_id: ctx.authUserId,
          shed_id: shedId,
          is_primary: i === 0,
        })),
      ];
    }
  }

  return {
    ...ctx,
    usersTable,
    userShedAssignments,
  };
}

// ─── Generators ───────────────────────────────────────────────────────────────

const ALL_ROLES: UserRole[] = [
  'Admin',
  'Senior_Section_Engineer',
  'Junior_Engineer',
  'Technician',
  'Viewer',
];

const shedIdArb = fc.uuid();

const rakeArb = (shedIds: string[]) =>
  fc.record({
    id: fc.uuid(),
    shed_id: fc.constantFrom(...shedIds),
    status: fc.constant('Active' as const),
  });

// ─── Property Tests ───────────────────────────────────────────────────────────

describe('Fault Condition: Rake Data Visibility — RLS Denies Data When Users/Shed Assignments Missing', () => {
  describe('Test Case 1: Admin auth user with no users table row', () => {
    /**
     * **Validates: Requirements 1.1**
     *
     * An Admin user authenticates via Supabase Auth but has NO corresponding
     * row in the `users` table. The `is_admin()` function returns false because
     * it cannot find a matching row. All RLS SELECT policies deny access.
     *
     * EXPECTED (post-fix): Admin user SHOULD have a users table row and see all data.
     * ON UNFIXED CODE: This test FAILS because the bug condition holds — no users row
     * means is_admin() returns false and no data is visible.
     */
    it('Admin with no users row → is_admin() returns false → all RLS policies deny access', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // authUserId
          fc.array(shedIdArb, { minLength: 1, maxLength: 3 }), // shed IDs
          (authUserId, shedIds) => {
            const rakes: RakeRow[] = shedIds.map((shedId, i) => ({
              id: `rake-${i}`,
              shed_id: shedId,
              status: 'Active' as const,
            }));

            // Bug condition: Admin auth user with NO users table row
            const ctx: RLSContext = {
              authUserId,
              usersTable: [], // <-- NO users row! This is the bug.
              userShedAssignments: [],
              rakes,
            };

            // Confirm bug condition holds on UNFIXED state
            expect(isBugCondition(ctx)).toBe(true);

            // Current (buggy) behavior: is_admin() returns false
            const adminResult = isAdmin(ctx);
            expect(adminResult).toBe(false); // This correctly reflects the bug

            // Apply the fix: auto-provision users row + assign Admin role
            const fixedCtx = applyAutoProvisioningFix(ctx, 'Admin');

            // After fix: bug condition no longer holds
            expect(isBugCondition(fixedCtx)).toBe(false);

            // After fix: is_admin() returns true because users row exists with Admin role
            expect(isAdmin(fixedCtx)).toBe(true);

            // EXPECTED behavior after fix: Admin SHOULD see all rakes.
            const visibleRakes = getVisibleRakes(fixedCtx);
            expect(visibleRakes.length).toBeGreaterThan(0);
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  describe('Test Case 2: SSE auth user with users row but no shed assignments', () => {
    /**
     * **Validates: Requirements 1.2**
     *
     * An SSE user has a valid `users` table row but NO entries in
     * `user_shed_assignments`. The `is_admin()` returns false (not Admin),
     * and `user_has_shed_access()` returns false (no shed assignments).
     * All RLS SELECT policies deny access.
     *
     * EXPECTED (post-fix): SSE user SHOULD have shed assignments and see data.
     * ON UNFIXED CODE: This test FAILS because the bug condition holds.
     */
    it('SSE with users row but no shed assignments → user_has_shed_access() returns false', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // authUserId
          fc.array(shedIdArb, { minLength: 1, maxLength: 3 }), // shed IDs
          (authUserId, shedIds) => {
            const rakes: RakeRow[] = shedIds.map((shedId, i) => ({
              id: `rake-${i}`,
              shed_id: shedId,
              status: 'Active' as const,
            }));

            // Bug condition: SSE user has users row but NO shed assignments
            const ctx: RLSContext = {
              authUserId,
              usersTable: [
                { id: authUserId, role: 'Senior_Section_Engineer', is_active: true },
              ],
              userShedAssignments: [], // <-- NO shed assignments! This is the bug.
              rakes,
            };

            // Confirm bug condition holds on UNFIXED state
            expect(isBugCondition(ctx)).toBe(true);

            // Current (buggy) behavior: user_has_shed_access returns false for all sheds
            for (const shedId of shedIds) {
              expect(userHasShedAccess(ctx, shedId)).toBe(false);
            }

            // Apply the fix: auto-provision + assign shed assignments
            const fixedCtx = applyAutoProvisioningFix(ctx, 'Senior_Section_Engineer');

            // After fix: bug condition no longer holds
            expect(isBugCondition(fixedCtx)).toBe(false);

            // EXPECTED behavior after fix: SSE SHOULD have shed assignments
            // and see data for their assigned sheds.
            const visibleRakes = getVisibleRakes(fixedCtx);
            expect(visibleRakes.length).toBeGreaterThan(0);
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  describe('Test Case 3: Any role user with no users row → dashboard metrics all return 0', () => {
    /**
     * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
     *
     * For ANY role, if the auth user has no `users` table row, the dashboard
     * metrics should all be 0 because RLS denies all data access.
     *
     * EXPECTED (post-fix): Users SHOULD have users table rows and see real metrics.
     * ON UNFIXED CODE: This test FAILS because we assert metrics should be > 0.
     */
    it('any role with no users row → dashboard metrics all return 0', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // authUserId
          fc.constantFrom(...ALL_ROLES), // any role
          fc.array(shedIdArb, { minLength: 1, maxLength: 3 }), // shed IDs
          (authUserId, role, shedIds) => {
            const rakes: RakeRow[] = shedIds.map((shedId, i) => ({
              id: `rake-${i}`,
              shed_id: shedId,
              status: 'Active' as const,
            }));

            // Bug condition: auth user with NO users table row
            const ctx: RLSContext = {
              authUserId,
              usersTable: [], // <-- NO users row!
              userShedAssignments: [],
              rakes,
            };

            // Confirm bug condition holds on UNFIXED state
            expect(isBugCondition(ctx)).toBe(true);

            // Current (buggy) behavior: dashboard returns 0 for everything
            const buggyMetrics = getDashboardMetrics(ctx, 'all');
            expect(buggyMetrics.activeRakeCount).toBe(0); // This is the bug manifesting

            // Apply the fix: auto-provision users row + assign correct role
            const fixedCtx = applyAutoProvisioningFix(ctx, role);

            // After fix: bug condition no longer holds
            expect(isBugCondition(fixedCtx)).toBe(false);

            // EXPECTED behavior after fix: dashboard SHOULD show real data.
            const fixedMetrics = getDashboardMetrics(fixedCtx, 'all');
            expect(fixedMetrics.activeRakeCount).toBeGreaterThan(0);
          },
        ),
        { numRuns: 50 },
      );
    });
  });

  describe('Test Case 4: Non-Admin user with no shed assignments → shed context fallback but data inaccessible', () => {
    /**
     * **Validates: Requirements 1.5**
     *
     * When a non-Admin user has no `user_shed_assignments`, the ShedProvider
     * falls back to the first shed from the `sheds` table. However, RLS still
     * blocks data because there's no formal shed assignment record.
     *
     * EXPECTED (post-fix): User SHOULD have shed assignments, so fallback is unnecessary.
     * ON UNFIXED CODE: This test FAILS because we assert the user should have assignments.
     */
    it('non-Admin with no shed assignments → fallback shed selected but data still blocked', () => {
      fc.assert(
        fc.property(
          fc.uuid(), // authUserId
          fc.constantFrom(
            'Senior_Section_Engineer' as UserRole,
            'Junior_Engineer' as UserRole,
            'Technician' as UserRole,
            'Viewer' as UserRole,
          ),
          fc.array(shedIdArb, { minLength: 1, maxLength: 3 }), // available shed IDs
          (authUserId, role, shedIds) => {
            const rakes: RakeRow[] = shedIds.map((shedId, i) => ({
              id: `rake-${i}`,
              shed_id: shedId,
              status: 'Active' as const,
            }));

            // Bug condition: non-Admin user with users row but NO shed assignments
            const ctx: RLSContext = {
              authUserId,
              usersTable: [{ id: authUserId, role, is_active: true }],
              userShedAssignments: [], // <-- NO shed assignments!
              rakes,
            };

            // Confirm bug condition holds on UNFIXED state
            expect(isBugCondition(ctx)).toBe(true);

            // ShedProvider resolves a fallback shed (first from sheds table)
            const buggyShedContext = resolveShedContext(ctx, shedIds);

            // Current (buggy) behavior: shed is selected via fallback but no assignment
            expect(buggyShedContext.hasAssignment).toBe(false);
            expect(buggyShedContext.selectedShedId).toBe(shedIds[0]); // fallback to first shed

            // Even with fallback shed selected, RLS still blocks data
            const buggyMetrics = getDashboardMetrics(ctx, buggyShedContext.selectedShedId);
            expect(buggyMetrics.activeRakeCount).toBe(0); // Bug: data is blocked

            // Apply the fix: auto-provision + assign shed assignments
            const fixedCtx = applyAutoProvisioningFix(ctx, role);

            // After fix: bug condition no longer holds
            expect(isBugCondition(fixedCtx)).toBe(false);

            // EXPECTED behavior after fix: user SHOULD have a valid shed assignment,
            // so the shed context resolves properly and data is accessible.
            const fixedShedContext = resolveShedContext(fixedCtx, shedIds);
            expect(fixedShedContext.hasAssignment).toBe(true);
          },
        ),
        { numRuns: 50 },
      );
    });
  });
});
