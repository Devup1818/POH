'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { getSheds } from '@/lib/queries/dashboard';
import { createClient } from '@/lib/supabase/client';
import { isAuthEnabled, DEV_USER } from '@/lib/dev-auth';

export interface ShedInfo {
  id: string;
  name: string;
  shed_code: string;
}

interface ShedContextValue {
  selectedShedId: string;
  shedName: string;
  sheds: ShedInfo[];
  setSelectedShedId: (id: string) => void;
  loading: boolean;
  needsShedAssignment: boolean;
}

const ShedContext = createContext<ShedContextValue | null>(null);

export function ShedProvider({ children }: { children: ReactNode }) {
  const [sheds, setSheds] = useState<ShedInfo[]>([]);
  const [selectedShedId, setSelectedShedId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [needsShedAssignment, setNeedsShedAssignment] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const allSheds = await getSheds();
        setSheds(allSheds);

        const supabase = createClient();
        let userId: string | null = null;

        if (isAuthEnabled) {
          const { data: { user } } = await supabase.auth.getUser();
          userId = user?.id ?? null;
        } else {
          userId = DEV_USER.id;
        }

        if (userId) {
          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

          const role = profile?.role ?? (!isAuthEnabled ? DEV_USER.role : null);

          if (role === 'Admin') {
            // Admin defaults to 'all' to see all sheds
            setSelectedShedId('all');
          } else {
            // Non-admin: try to get their primary shed assignment
            const { data: assignments } = await supabase
              .from('user_shed_assignments')
              .select('shed_id, is_primary')
              .eq('user_id', userId);

            if (assignments && assignments.length > 0) {
              const primary = assignments.find((a) => a.is_primary);
              setSelectedShedId(primary?.shed_id ?? assignments[0].shed_id);
            } else {
              // No shed assignments — flag that the user needs assignment
              // instead of silently falling back to first shed (which RLS would block anyway)
              setNeedsShedAssignment(true);
            }
          }
        } else {
          // No auth user — default to 'all' (original behavior)
          setSelectedShedId('all');
        }
      } catch {
        // Fallback — keep 'all'
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const shedName =
    selectedShedId === 'all'
      ? 'All Sheds'
      : sheds.find((s) => s.id === selectedShedId)?.name ?? '';

  return (
    <ShedContext.Provider
      value={{ selectedShedId, shedName, sheds, setSelectedShedId, loading, needsShedAssignment }}
    >
      {needsShedAssignment ? (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md rounded-lg border border-amber-200 bg-amber-50 p-6 text-center shadow-sm">
            <h2 className="mb-2 text-lg font-semibold text-amber-800">
              No Shed Assigned
            </h2>
            <p className="text-sm text-amber-700">
              Your account does not have a shed assignment yet. Please contact
              your administrator to be assigned to a shed before you can access
              the system.
            </p>
          </div>
        </div>
      ) : (
        children
      )}
    </ShedContext.Provider>
  );
}

export function useShed() {
  const ctx = useContext(ShedContext);
  if (!ctx) throw new Error('useShed must be used within ShedProvider');
  return ctx;
}
