import { describe, it, expect } from 'vitest';
import {
  canCreateRake,
  canUpdateCoach,
  canAddNotes,
  canViewOnly,
  canManageUsers,
  canManageSheds,
  canDeleteRake,
  canEditRake,
} from '@/lib/auth/permissions';
import type { UserRole } from '@/types';

const ALL_ROLES: UserRole[] = ['Admin', 'Senior_Section_Engineer', 'Junior_Engineer', 'Technician', 'Viewer'];

describe('Permission utilities', () => {
  describe('canCreateRake', () => {
    it('allows Admin', () => {
      expect(canCreateRake('Admin')).toBe(true);
    });
    it('allows Senior_Section_Engineer', () => {
      expect(canCreateRake('Senior_Section_Engineer')).toBe(true);
    });
    it('allows Junior_Engineer', () => {
      expect(canCreateRake('Junior_Engineer')).toBe(true);
    });
    it('denies Technician', () => {
      expect(canCreateRake('Technician')).toBe(false);
    });
    it('denies Viewer', () => {
      expect(canCreateRake('Viewer')).toBe(false);
    });
  });

  describe('canUpdateCoach', () => {
    it('allows Admin', () => {
      expect(canUpdateCoach('Admin')).toBe(true);
    });
    it('allows Senior_Section_Engineer', () => {
      expect(canUpdateCoach('Senior_Section_Engineer')).toBe(true);
    });
    it('allows Junior_Engineer', () => {
      expect(canUpdateCoach('Junior_Engineer')).toBe(true);
    });
    it('denies Technician', () => {
      expect(canUpdateCoach('Technician')).toBe(false);
    });
    it('denies Viewer', () => {
      expect(canUpdateCoach('Viewer')).toBe(false);
    });
  });

  describe('canAddNotes', () => {
    it('allows Admin', () => {
      expect(canAddNotes('Admin')).toBe(true);
    });
    it('allows Senior_Section_Engineer', () => {
      expect(canAddNotes('Senior_Section_Engineer')).toBe(true);
    });
    it('allows Junior_Engineer', () => {
      expect(canAddNotes('Junior_Engineer')).toBe(true);
    });
    it('allows Technician', () => {
      expect(canAddNotes('Technician')).toBe(true);
    });
    it('denies Viewer', () => {
      expect(canAddNotes('Viewer')).toBe(false);
    });
  });

  describe('canViewOnly', () => {
    it('returns true for Viewer', () => {
      expect(canViewOnly('Viewer')).toBe(true);
    });
    it('returns false for Admin', () => {
      expect(canViewOnly('Admin')).toBe(false);
    });
    it('returns false for Senior_Section_Engineer', () => {
      expect(canViewOnly('Senior_Section_Engineer')).toBe(false);
    });
    it('returns false for Junior_Engineer', () => {
      expect(canViewOnly('Junior_Engineer')).toBe(false);
    });
    it('returns false for Technician', () => {
      expect(canViewOnly('Technician')).toBe(false);
    });
  });

  describe('canManageUsers', () => {
    it('allows only Admin', () => {
      expect(canManageUsers('Admin')).toBe(true);
      ALL_ROLES.filter((r) => r !== 'Admin').forEach((role) => {
        expect(canManageUsers(role)).toBe(false);
      });
    });
  });

  describe('canManageSheds', () => {
    it('allows only Admin', () => {
      expect(canManageSheds('Admin')).toBe(true);
      ALL_ROLES.filter((r) => r !== 'Admin').forEach((role) => {
        expect(canManageSheds(role)).toBe(false);
      });
    });
  });

  describe('canDeleteRake', () => {
    it('allows only Admin', () => {
      expect(canDeleteRake('Admin')).toBe(true);
      ALL_ROLES.filter((r) => r !== 'Admin').forEach((role) => {
        expect(canDeleteRake(role)).toBe(false);
      });
    });
  });

  describe('canEditRake', () => {
    it('allows only Admin', () => {
      expect(canEditRake('Admin')).toBe(true);
      ALL_ROLES.filter((r) => r !== 'Admin').forEach((role) => {
        expect(canEditRake(role)).toBe(false);
      });
    });
  });
});
