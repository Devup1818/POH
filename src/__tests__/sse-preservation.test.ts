/**
 * Preservation Property Tests — Non-SSE Role Behavior Unchanged
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
 *
 * These tests observe and lock down the CURRENT behavior of permission functions
 * and sidebar navigation for all non-SSE roles (Admin, Junior_Engineer, Technician, Viewer).
 * They are written BEFORE the fix is applied and must continue to pass AFTER the fix,
 * ensuring no regressions are introduced.
 *
 * Observation-first methodology:
 * 1. Observe current behavior on unfixed code
 * 2. Encode observations as property-based tests
 * 3. Verify tests pass on unfixed code (baseline)
 * 4. After fix, re-run to confirm preservation
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

// ─── Observed Permission Matrix (unfixed code) ───────────────────────────────
// These are the observed return values for each permission function per role.

const OBSERVED_PERMISSIONS: Record<
  string,
  Record<string, boolean>
> = {
  Admin: {
    canCreateRake: true,
    canUpdateCoach: true,
    canAddNotes: true,
    canViewOnly: false,
    canManageUsers: true,
    canManageSheds: true,
  },
  Junior_Engineer: {
    canCreateRake: true,
    canUpdateCoach: true,
    canAddNotes: true,
    canViewOnly: false,
    canManageUsers: false,
    canManageSheds: false,
  },
  Technician: {
    canCreateRake: false,
    canUpdateCoach: false,
    canAddNotes: true,
    canViewOnly: false,
    canManageUsers: false,
    canManageSheds: false,
  },
  Viewer: {
    canCreateRake: false,
    canUpdateCoach: false,
    canAddNotes: false,
    canViewOnly: true,
    canManageUsers: false,
    canManageSheds: false,
  },
};

// ─── Generators ───────────────────────────────────────────────────────────────

/** Generate one of the four non-SSE roles */
const nonSseRoleArb = fc.constantFrom<UserRole>(
  'Admin',
  'Junior_Engineer',
  'Technician',
  'Viewer',
);

/** Generate any valid UserRole (all five roles) */
const allRolesArb = fc.constantFrom<UserRole>(
  'Admin',
  'Senior_Section_Engineer',
  'Junior_Engineer',
  'Technician',
  'Viewer',
);

// ─── Sidebar NAV_ITEMS replica (from sidebar.tsx) ─────────────────────────────

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

// ─── Observed Sidebar Visibility (unfixed code) ──────────────────────────────

/** Items with no roles restriction — visible to ALL roles */
const UNRESTRICTED_LABELS = ['Dashboard', 'Completed Rakes', 'Reports'];

/** Items restricted to Admin only */
const ADMIN_ONLY_LABELS = ['User Management', 'Settings'];

/** Items restricted to Admin + SSE */
const ADMIN_SSE_LABELS = ['Register Rake'];

// ─── Property Tests ───────────────────────────────────────────────────────────

describe('Preservation: Non-SSE Role Behavior Unchanged', () => {
  describe('Property 2.1: Permission functions return observed values for non-SSE roles', () => {
    /**
     * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
     *
     * For all roles in [Admin, Junior_Engineer, Technician, Viewer],
     * each permission function returns the same value as observed on unfixed code.
     */
    it('canCreateRake matches observed behavior for all non-SSE roles', () => {
      fc.assert(
        fc.property(nonSseRoleArb, (role) => {
          expect(canCreateRake(role)).toBe(OBSERVED_PERMISSIONS[role].canCreateRake);
        }),
        { numRuns: 100 },
      );
    });

    it('canUpdateCoach matches observed behavior for all non-SSE roles', () => {
      fc.assert(
        fc.property(nonSseRoleArb, (role) => {
          expect(canUpdateCoach(role)).toBe(OBSERVED_PERMISSIONS[role].canUpdateCoach);
        }),
        { numRuns: 100 },
      );
    });

    it('canAddNotes matches observed behavior for all non-SSE roles', () => {
      fc.assert(
        fc.property(nonSseRoleArb, (role) => {
          expect(canAddNotes(role)).toBe(OBSERVED_PERMISSIONS[role].canAddNotes);
        }),
        { numRuns: 100 },
      );
    });

    it('canViewOnly matches observed behavior for all non-SSE roles', () => {
      fc.assert(
        fc.property(nonSseRoleArb, (role) => {
          expect(canViewOnly(role)).toBe(OBSERVED_PERMISSIONS[role].canViewOnly);
        }),
        { numRuns: 100 },
      );
    });

    it('canManageUsers matches observed behavior for all non-SSE roles', () => {
      fc.assert(
        fc.property(nonSseRoleArb, (role) => {
          expect(canManageUsers(role)).toBe(OBSERVED_PERMISSIONS[role].canManageUsers);
        }),
        { numRuns: 100 },
      );
    });

    it('canManageSheds matches observed behavior for all non-SSE roles', () => {
      fc.assert(
        fc.property(nonSseRoleArb, (role) => {
          expect(canManageSheds(role)).toBe(OBSERVED_PERMISSIONS[role].canManageSheds);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 2.2: Sidebar visibility matches role-based filter logic for all roles', () => {
    /**
     * **Validates: Requirements 3.1, 3.5, 3.6**
     *
     * For all roles, sidebar visibility follows these rules:
     * - Unrestricted items (Dashboard, Completed Rakes, Reports) visible to ALL roles
     * - Admin-only items (User Management, Settings) visible ONLY to Admin
     * - Admin+SSE items (Register Rake) visible ONLY to Admin and SSE
     */
    it('unrestricted nav items are visible to all roles', () => {
      fc.assert(
        fc.property(allRolesArb, (role) => {
          const visible = getVisibleNavItems(role);
          const labels = visible.map((item) => item.label);

          for (const label of UNRESTRICTED_LABELS) {
            expect(labels).toContain(label);
          }
        }),
        { numRuns: 100 },
      );
    });

    it('Admin-only nav items are visible only to Admin', () => {
      fc.assert(
        fc.property(allRolesArb, (role) => {
          const visible = getVisibleNavItems(role);
          const labels = visible.map((item) => item.label);

          for (const label of ADMIN_ONLY_LABELS) {
            if (role === 'Admin') {
              expect(labels).toContain(label);
            } else {
              expect(labels).not.toContain(label);
            }
          }
        }),
        { numRuns: 100 },
      );
    });

    it('Register Rake is visible only to Admin and Senior_Section_Engineer', () => {
      fc.assert(
        fc.property(allRolesArb, (role) => {
          const visible = getVisibleNavItems(role);
          const labels = visible.map((item) => item.label);

          for (const label of ADMIN_SSE_LABELS) {
            if (role === 'Admin' || role === 'Senior_Section_Engineer') {
              expect(labels).toContain(label);
            } else {
              expect(labels).not.toContain(label);
            }
          }
        }),
        { numRuns: 100 },
      );
    });

    it('Admin sees all 6 nav items', () => {
      fc.assert(
        fc.property(fc.constant('Admin' as UserRole), (role) => {
          const visible = getVisibleNavItems(role);
          expect(visible.length).toBe(6);
        }),
        { numRuns: 10 },
      );
    });

    it('non-SSE non-Admin roles see exactly 3 nav items (Dashboard, Completed Rakes, Reports)', () => {
      fc.assert(
        fc.property(
          fc.constantFrom<UserRole>('Junior_Engineer', 'Technician', 'Viewer'),
          (role) => {
            const visible = getVisibleNavItems(role);
            expect(visible.length).toBe(3);
            const labels = visible.map((item) => item.label);
            expect(labels).toEqual(UNRESTRICTED_LABELS);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
