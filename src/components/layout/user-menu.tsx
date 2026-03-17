'use client';

import { useRef, useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Shield, Building2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from '@/lib/supabase/auth';
import { createClient } from '@/lib/supabase/client';
import { isAuthEnabled, DEV_USER } from '@/lib/dev-auth';
import type { User } from '@supabase/supabase-js';

interface UserShed {
  id: string;
  name: string;
  shedCode: string;
  isPrimary: boolean;
}

interface UserMenuProps {
  className?: string;
}

const ROLE_DISPLAY: Record<string, string> = {
  Admin: 'Admin',
  Senior_Section_Engineer: 'Senior Section Engineer',
  Junior_Engineer: 'Junior Engineer',
  Technician: 'Technician',
  Viewer: 'Viewer',
};

export function UserMenu({ className }: UserMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<{
    fullName: string;
    role: string;
    sheds: UserShed[];
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch user data on mount
  useEffect(() => {
    async function fetchUser() {
      const supabase = createClient();
      let userId: string | null = null;

      if (isAuthEnabled) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;
        setUser(authUser);
        userId = authUser.id;
      } else {
        userId = DEV_USER.id;
      }

      // Try to fetch user profile and shed assignments from database
      try {
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, role')
          .eq('id', userId)
          .single();

        const { data: shedAssignments } = await supabase
          .from('user_shed_assignments')
          .select('is_primary, sheds:shed_id(id, name, shed_code)')
          .eq('user_id', userId);

        const sheds: UserShed[] = (shedAssignments ?? [])
          .filter((a) => a.sheds)
          .map((a) => {
            const shed = a.sheds as unknown as { id: string; name: string; shed_code: string };
            return {
              id: shed.id,
              name: shed.name,
              shedCode: shed.shed_code,
              isPrimary: a.is_primary,
            };
          });

        if (profile) {
          setUserProfile({
            fullName: profile.full_name,
            role: profile.role,
            sheds,
          });
        } else if (!isAuthEnabled) {
          setUserProfile({
            fullName: DEV_USER.full_name,
            role: DEV_USER.role,
            sheds: [],
          });
        }
      } catch {
        // If DB tables don't exist yet or RLS blocks, fall back
        if (!isAuthEnabled) {
          setUserProfile({
            fullName: DEV_USER.full_name,
            role: DEV_USER.role,
            sheds: [],
          });
        } else {
          const meta = user?.user_metadata ?? {};
          setUserProfile({
            fullName: meta.full_name ?? user?.email ?? 'User',
            role: meta.role ?? 'Technician',
            sheds: [],
          });
        }
      }
    }
    fetchUser();
  }, []);

  function handleSignOut() {
    setIsOpen(false);
    startTransition(async () => {
      await signOut();
      router.push('/login');
      router.refresh();
    });
  }

  const displayName = userProfile?.fullName ?? user?.email ?? 'User';
  const role = userProfile?.role ?? '';
  const sheds = userProfile?.sheds ?? [];
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <div ref={menuRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-100"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="User menu"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
          {initials}
        </div>
        <div className="hidden text-left md:block">
          <p className="text-sm font-medium text-gray-700 leading-tight">{displayName}</p>
          {role && (
            <p className="text-xs text-gray-400">{ROLE_DISPLAY[role] ?? role}</p>
          )}
        </div>
        <ChevronDown className={cn(
          'hidden h-4 w-4 text-gray-400 transition-transform md:block',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1 w-72 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
        >
          {/* User info section */}
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">{displayName}</p>
            {role && (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                <Shield className="h-3 w-3" />
                <span>{ROLE_DISPLAY[role] ?? role}</span>
              </div>
            )}
            {user?.email && (
              <p className="mt-0.5 text-xs text-gray-400">{user.email}</p>
            )}
          </div>

          {/* Assigned sheds section */}
          {sheds.length > 0 && (
            <div className="border-b border-gray-100 px-4 py-2.5">
              <p className="mb-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned Sheds
              </p>
              <div className="space-y-1">
                {sheds.map((shed) => (
                  <div
                    key={shed.id}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <Building2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{shed.name}</span>
                    {shed.isPrimary && (
                      <span className="ml-auto text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sign out */}
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={isPending}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4 text-gray-400" />
            {isPending ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
}
