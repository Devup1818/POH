'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isAuthEnabled, DEV_USER } from '@/lib/dev-auth';
import type { UserRole } from '@/types';

interface RoleGuardProps {
  /** Roles that are allowed to see the children */
  allowedRoles: UserRole[];
  /** Content to render when the user has the required role */
  children: ReactNode;
  /** Optional fallback to render when access is denied. Defaults to nothing (hidden). */
  fallback?: ReactNode;
  /** If true, shows an "Access Denied" message instead of hiding content */
  showAccessDenied?: boolean;
}

/**
 * Conditionally renders children based on the current user's role.
 * Fetches the user role from Supabase on mount, with a mock fallback
 * for development when the DB is unavailable.
 */
export function RoleGuard({
  allowedRoles,
  children,
  fallback,
  showAccessDenied = false,
}: RoleGuardProps) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      try {
        const supabase = createClient();
        let userId: string | null = null;

        if (isAuthEnabled) {
          const { data: { user } } = await supabase.auth.getUser();
          userId = user?.id ?? null;
        } else {
          userId = DEV_USER.id;
        }

        if (!userId) {
          setRole('Technician');
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .single();

        if (profile?.role) {
          setRole(profile.role as UserRole);
        } else if (!isAuthEnabled) {
          setRole(DEV_USER.role);
        } else {
          setRole('Technician');
        }
      } catch {
        setRole(isAuthEnabled ? 'Technician' : DEV_USER.role);
      }
      setLoading(false);
    }
    fetchRole();
  }, []);

  if (loading) {
    return null;
  }

  if (!role || !allowedRoles.includes(role)) {
    if (fallback) return <>{fallback}</>;
    if (showAccessDenied) return <AccessDeniedMessage />;
    return null;
  }

  return <>{children}</>;
}

function AccessDeniedMessage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
        <ShieldAlert className="h-7 w-7 text-red-400" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-gray-900">Access Denied</h2>
      <p className="mt-1 max-w-sm text-sm text-gray-500">
        You don&apos;t have permission to access this page. Contact your administrator
        if you believe this is an error.
      </p>
    </div>
  );
}
