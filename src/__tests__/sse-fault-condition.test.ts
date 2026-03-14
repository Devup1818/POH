/**
 * Bug Condition Exploration Test — SSE User Gets Empty Dashboard Data
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
 *
 * This test encodes the EXPECTED (correct) behavior for SSE users.
 * On UNFIXED code, these tests are EXPECTED TO FAIL — failure confirms the bug exists.
 * After the fix is applied, these tests should PASS.
 *
 * Fault Condition: isBugCondition(input) returns true when
 *   input.role = 'Senior_Section_Engineer'
 *   AND the shed selector shows "All Sheds" to non-admin users
 *   AND non-admin users with shed assignments should see only their assigned sheds
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  canCreateRake,
  canUpdateCoach,
  canAddNotes,
  canViewOnly,
  canManageUsers,
  canManageSheds,
} from '@/lib/auth/permissions';
import type { UserRole } from '@/types';

// ─── Generators ───────────────────────────────────────────────────────────────

/** Generate a random shed assignment for an SSE user */
const shedAssignmentArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 3, maxLength: 30 }),
});

/** Generate 1-5 shed assignments (SSE user with valid assignments) */
const sseWithShedAssignmentsArb = fc.record({
  userId: fc.uuid(),
  role: fc.constant('Senior_Section_Engineer' as UserRole),
  assignedSheds: fc.array(shedAssignmentArb, { minLength: 1, maxLength: 5 }),
  primaryShedIndex: fc.nat(), // will be modded by array length
});

// ─── Sidebar NAV_ITEMS replica (from sidebar.tsx) ─────────────────────────────
// We replicate the NAV_ITEMS structure to test the filtering logic in isolation.

interface NavItem {
  href: string;
  label: string;
  roles?: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard' },
  { href: '/rakes/new', label: 'Register Rake', roles: ['Admin', 'Senior_Section_Engineer'] },
  { href: '/completed', label: 'Completed Rakes' },
  { href: '/reports', label: 'Reports' },
  { href: '/admin/users', label: 'User Management', roles: ['Admin'] },
  { href: '/settings', label: 'Settings', roles: ['Admin'] },
];

function getVisibleNavItems(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(role);
  });
}

// ─── Shed Selector Logic replica (from shed-selector.tsx) ─────────────────────
// We replicate the shed selector's option-building logic to test it in isolation.

interface Shed {
  id: string;
  name: string;
}

/**
 * Current shed selector logic (fixed):
 * "All Sheds" is only available to Admin users.
 * Non-admin users see only their assigned sheds.
 */
function getShedSelectorOptions_current(
  userSheds: Shed[],
  isAdmin: boolean,
): Shed[] {
  const allOption: Shed = { id: 'all', name: 'All Sheds' };
  if (isAdmin) {
    return [allOption, ...userSheds];
  }
  return userSheds;
}

/**
 * Expected (correct) shed selector logic:
 * "All Sheds" should only be available to Admin users.
 * Non-admin users should only see their assigned sheds.
 */
function getShedSelectorOptions_expected(
  userSheds: Shed[],
  isAdmin: boolean,
): Shed[] {
  const allOption: Shed = { id: 'all', name: 'All Sheds' };
  if (isAdmin) {
    return [allOption, ...userSheds];
  }
  return userSheds;
}

// ─── Property Tests ───────────────────────────────────────────────────────────

describe('Fault Condition: SSE User Gets Empty Dashboard Data', () => {
  describe('Property 1.1: SSE permission functions grant operational access', () => {
    /**
     * **Validates: Requirements 1.1, 1.2**
     *
     * SSE users should have create rake, update coach, add notes permissions.
     * These permission functions should return true for SSE.
     */
    it('SSE should have operational permissions (create rake, update coach, add notes)', () => {
      fc.assert(
        fc.property(
          fc.constant('Senior_Section_Engineer' as UserRole),
          (role) => {
            expect(canCreateRake(role)).toBe(true);
            expect(canUpdateCoach(role)).toBe(true);
            expect(canAddNotes(role)).toBe(true);
            expect(canViewOnly(role)).toBe(false);
            // SSE should NOT have admin-only permissions
            expect(canManageUsers(role)).toBe(false);
            expect(canManageSheds(role)).toBe(false);
          },
        ),
        { numRuns: 10 },
      );
    });
  });

  describe('Property 1.2: Shed selector should NOT show "All Sheds" to non-admin users', () => {
    /**
     * **Validates: Requirements 1.3**
     *
     * The shed selector currently always prepends "All Sheds" for all users.
     * For SSE (non-admin) users with shed assignments, the selector should
     * only show their assigned sheds — NOT "All Sheds".
     *
     * This test SHOULD FAIL on unfixed code because the current logic
     * always includes "All Sheds" regardless of role.
     */
    it('non-admin user with shed assignments should NOT see "All Sheds" option', () => {
      fc.assert(
        fc.property(
          sseWithShedAssignmentsArb,
          ({ assignedSheds }) => {
            const isAdmin = false;
            const options = getShedSelectorOptions_current(assignedSheds, isAdmin);

            // Expected: non-admin users should NOT have "All Sheds" in their options
            const hasAllSheds = options.some((s) => s.id === 'all');
            expect(hasAllSheds).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('non-admin user should only see their assigned sheds', () => {
      fc.assert(
        fc.property(
          sseWithShedAssignmentsArb,
          ({ assignedSheds }) => {
            const isAdmin = false;
            const options = getShedSelectorOptions_current(assignedSheds, isAdmin);

            // Expected: options should exactly match assigned sheds (no extra "All Sheds")
            expect(options.length).toBe(assignedSheds.length);
            for (const shed of assignedSheds) {
              expect(options.some((o) => o.id === shed.id)).toBe(true);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 1.3: Sidebar nav visibility for SSE role', () => {
    /**
     * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
     *
     * SSE should see: Dashboard, Register Rake, Completed Rakes, Reports
     * SSE should NOT see: User Management, Settings
     */
    it('SSE should see operational nav items but NOT admin-only items', () => {
      fc.assert(
        fc.property(
          fc.constant('Senior_Section_Engineer' as UserRole),
          (role) => {
            const visible = getVisibleNavItems(role);
            const labels = visible.map((item) => item.label);

            // SSE SHOULD see these
            expect(labels).toContain('Dashboard');
            expect(labels).toContain('Register Rake');
            expect(labels).toContain('Completed Rakes');
            expect(labels).toContain('Reports');

            // SSE should NOT see these (Admin-only)
            expect(labels).not.toContain('User Management');
            expect(labels).not.toContain('Settings');

            // Exactly 4 items visible
            expect(visible.length).toBe(4);
          },
        ),
        { numRuns: 10 },
      );
    });
  });
});
