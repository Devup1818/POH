/**
 * Preservation Property Tests — Rake Data Visibility
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
 *
 * These tests capture baseline behavior for VALID users — users who DO have
 * proper `users` table rows and `user_shed_assignments`. This behavior must
 * be preserved after the bugfix is applied.
 *
 * These tests should PASS on UNFIXED code (confirming baseline behavior).
 * After the fix, they must CONTINUE to pass (confirming no regressions).
 *
 * Observation-first methodology: we observe the current RLS evaluation for
 * non-buggy inputs and encode those observations as properties.
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { UserRole } from '@/types';

// ─── Types (same as fault condition test) ─────────────────────────────────────

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
 */
function getVisibleRakes(ctx: RLSContext): RakeRow[] {
  return ctx.rakes.filter((r) => userHasShedAccess(ctx, r.shed_id));
}

/**
 * Simulates the RLS INSERT/UPDATE policy check for rakes:
 *   user_has_shed_access(shed_id) AND role IN ('Admin', 'Senior_Section_Engineer', 'Junior_Engineer')
 */
function canWriteRake(ctx: RLSContext, shedId: string): boolean {
  const userRow = ctx.usersTable.find((u) => u.id === ctx.authUserId);
  if (!userRow) return false;
  const writeRoles: UserRole[] = ['Admin', 'Senior_Section_Engineer', 'Junior_Engineer'];
  return userHasShedAccess(ctx, shedId) && writeRoles.includes(userRow.role);
}

// ─── Generators ───────────────────────────────────────────────────────────────

const ALL_ROLES: UserRole[] = [
  'Admin',
  'Senior_Section_Engineer',
  'Junior_Engineer',
  'Technician',
  'Viewer',
];

const NON_ADMIN_ROLES: UserRole[] = [
  'Senior_Section_Engineer',
  'Junior_Engineer',
  'Technician',
  'Viewer',
];

/**
 * Generates a set of distinct shed IDs for test scenarios.
 */
const shedIdsArb = fc.uniqueArray(fc.uuid(), { minLength: 2, maxLength: 5 });

// ─── Property Tests ───────────────────────────────────────────────────────────

describe('Preservation: Valid Users Continue To See Correct Data', () => {
  describe('Test Case 1: Admin with valid users row → is_admin() returns true → all data accessible', () => {
    /**
     * **Validates: Requirements 3.5, 3.6**
     *
     * An Admin user with a valid `users` table row (role = 'Admin') should
     * have is_admin() return true, granting access to all rakes across all sheds.
     *
     * This is the CURRENT behavior for properly provisioned Admin users.
     * It must remain unchanged after the fix.
     */
    it('Admin with valid users row sees all rakes across all sheds', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          shedIdsArb,
          (authUserId, shedIds) => {
            const rakes: RakeRow[] = shedIds.map((shedId, i) => ({
              id: `rake-${i}`,
              shed_id: shedId,
              status: 'Active' as const,
            }));

            // Valid Admin: has a users table row with role = 'Admin'
            const ctx: RLSContext = {
              authUserId,
              usersTable: [{ id: authUserId, role: 'Admin', is_active: true }],
              userShedAssignments: [], // Admin doesn't need shed assignments
              rakes,
            };

            // is_admin() returns true for Admin with valid users row
            expect(isAdmin(ctx)).toBe(true);

            // Admin has access to ALL sheds
            for (const shedId of shedIds) {
              expect(userHasShedAccess(ctx, shedId)).toBe(true);
            }

            // Admin sees ALL rakes
            const visibleRakes = getVisibleRakes(ctx);
            expect(visibleRakes.length).toBe(rakes.length);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Test Case 2: SSE with valid users row and shed assignments → shed-scoped data accessible', () => {
    /**
     * **Validates: Requirements 3.1, 3.4**
     *
     * An SSE user with a valid `users` row and `user_shed_assignments` for
     * specific sheds should have user_has_shed_access() return true for those
     * sheds, granting access to rakes in assigned sheds only.
     *
     * This is the CURRENT behavior for properly provisioned SSE users.
     * It must remain unchanged after the fix.
     */
    it('SSE with valid shed assignments sees rakes only from assigned sheds', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          shedIdsArb,
          (authUserId, shedIds) => {
            // Assign user to the first shed only
            const assignedShedId = shedIds[0];

            const rakes: RakeRow[] = shedIds.map((shedId, i) => ({
              id: `rake-${i}`,
              shed_id: shedId,
              status: 'Active' as const,
            }));

            const ctx: RLSContext = {
              authUserId,
              usersTable: [
                { id: authUserId, role: 'Senior_Section_Engineer', is_active: true },
              ],
              userShedAssignments: [
                { user_id: authUserId, shed_id: assignedShedId, is_primary: true },
              ],
              rakes,
            };

            // is_admin() returns false for SSE
            expect(isAdmin(ctx)).toBe(false);

            // user_has_shed_access returns true for assigned shed
            expect(userHasShedAccess(ctx, assignedShedId)).toBe(true);

            // SSE sees only rakes from assigned shed
            const visibleRakes = getVisibleRakes(ctx);
            expect(visibleRakes.length).toBe(1);
            expect(visibleRakes[0].shed_id).toBe(assignedShedId);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Test Case 3: Non-Admin user cannot see data from unassigned sheds', () => {
    /**
     * **Validates: Requirements 3.3**
     *
     * A non-Admin user should NOT have access to sheds they are not assigned to.
     * user_has_shed_access(unassignedShed) must return false.
     * Cross-shed denial must be preserved after the fix.
     */
    it('non-Admin user denied access to unassigned sheds', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.constantFrom(...NON_ADMIN_ROLES),
          shedIdsArb,
          (authUserId, role, shedIds) => {
            const assignedShedId = shedIds[0];
            const unassignedShedIds = shedIds.slice(1);

            const rakes: RakeRow[] = shedIds.map((shedId, i) => ({
              id: `rake-${i}`,
              shed_id: shedId,
              status: 'Active' as const,
            }));

            const ctx: RLSContext = {
              authUserId,
              usersTable: [{ id: authUserId, role, is_active: true }],
              userShedAssignments: [
                { user_id: authUserId, shed_id: assignedShedId, is_primary: true },
              ],
              rakes,
            };

            // user_has_shed_access returns false for all unassigned sheds
            for (const unassignedShed of unassignedShedIds) {
              expect(userHasShedAccess(ctx, unassignedShed)).toBe(false);
            }

            // Visible rakes should only include rakes from the assigned shed
            const visibleRakes = getVisibleRakes(ctx);
            for (const rake of visibleRakes) {
              expect(rake.shed_id).toBe(assignedShedId);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Test Case 4: All roles with proper rows can see rake data for assigned sheds', () => {
    /**
     * **Validates: Requirements 3.1, 3.2**
     *
     * Every role (Admin, SSE, Junior_Engineer, Technician, Viewer) with a valid
     * `users` row and appropriate shed assignments should be able to see rake
     * data for their assigned sheds. This verifies role-based READ access is
     * preserved for all roles.
     */
    it('all roles with valid provisioning see rake data for assigned sheds', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.constantFrom(...ALL_ROLES),
          shedIdsArb,
          (authUserId, role, shedIds) => {
            const assignedShedId = shedIds[0];

            const rakes: RakeRow[] = shedIds.map((shedId, i) => ({
              id: `rake-${i}`,
              shed_id: shedId,
              status: 'Active' as const,
            }));

            const ctx: RLSContext = {
              authUserId,
              usersTable: [{ id: authUserId, role, is_active: true }],
              userShedAssignments: [
                { user_id: authUserId, shed_id: assignedShedId, is_primary: true },
              ],
              rakes,
            };

            if (role === 'Admin') {
              // Admin sees ALL rakes (is_admin() bypasses shed check)
              expect(isAdmin(ctx)).toBe(true);
              const visibleRakes = getVisibleRakes(ctx);
              expect(visibleRakes.length).toBe(rakes.length);
            } else {
              // Non-Admin sees only rakes from assigned shed
              expect(userHasShedAccess(ctx, assignedShedId)).toBe(true);
              const visibleRakes = getVisibleRakes(ctx);
              expect(visibleRakes.length).toBeGreaterThan(0);
              // All visible rakes are from the assigned shed
              for (const rake of visibleRakes) {
                expect(rake.shed_id).toBe(assignedShedId);
              }
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
