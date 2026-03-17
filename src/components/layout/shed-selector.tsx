'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronDown, Building2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useShed } from '@/lib/shed-context';
import { createClient } from '@/lib/supabase/client';
import { isAuthEnabled, DEV_USER } from '@/lib/dev-auth';

export interface Shed {
  id: string;
  name: string;
}

interface ShedSelectorProps {
  className?: string;
}

export function ShedSelector({ className }: ShedSelectorProps) {
  const { selectedShedId, setSelectedShedId, sheds: contextSheds } = useShed();
  const [isOpen, setIsOpen] = useState(false);
  const [userSheds, setUserSheds] = useState<Shed[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch user's assigned sheds from Supabase
  useEffect(() => {
    async function fetchUserSheds() {
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
          // No auth session — use context sheds
          setUserSheds(contextSheds.map((s) => ({ id: s.id, name: s.name })));
          setLoaded(true);
          return;
        }

        // Check user role
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .single();

        const userIsAdmin = profile?.role === 'Admin' || (!isAuthEnabled && !profile);
        setIsAdmin(userIsAdmin);

        if (userIsAdmin) {
          // Admin can see all sheds
          const { data: allSheds } = await supabase
            .from('sheds')
            .select('id, name')
            .eq('is_active', true)
            .order('name');

          setUserSheds(allSheds && allSheds.length > 0
            ? allSheds
            : contextSheds.map((s) => ({ id: s.id, name: s.name })));
        } else {
          // Non-admin: fetch assigned sheds
          const { data: assignments } = await supabase
            .from('user_shed_assignments')
            .select('is_primary, sheds:shed_id(id, name)')
            .eq('user_id', userId);

          if (assignments && assignments.length > 0) {
            const sheds: Shed[] = assignments
              .filter((a) => a.sheds)
              .map((a) => {
                const shed = a.sheds as unknown as { id: string; name: string };
                return { id: shed.id, name: shed.name };
              });

            if (sheds.length > 0) {
              setUserSheds(sheds);
              const primary = assignments.find((a) => a.is_primary);
              if (primary?.sheds) {
                const shed = primary.sheds as unknown as { id: string; name: string };
                setSelectedShedId(shed.id);
              }
            } else {
              setUserSheds(contextSheds.map((s) => ({ id: s.id, name: s.name })));
            }
          } else {
            setUserSheds(contextSheds.map((s) => ({ id: s.id, name: s.name })));
          }
        }
      } catch {
        setUserSheds(contextSheds.map((s) => ({ id: s.id, name: s.name })));
      }
      setLoaded(true);
    }
    fetchUserSheds();
  }, [setSelectedShedId, contextSheds]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allOption: Shed = { id: 'all', name: 'All Sheds' };
  const options = isAdmin ? [allOption, ...userSheds] : userSheds;
  const current = options.find((s) => s.id === selectedShedId) ?? (userSheds[0] || allOption);

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Building2 className="h-4 w-4 text-amber-500" />
        <span className="hidden sm:inline max-w-[180px] truncate">{current.name}</span>
        <span className="sm:hidden max-w-[100px] truncate text-xs">{current.name}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-gray-400 transition-transform',
            isOpen && 'rotate-180',
          )}
        />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-1 w-64 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          {options.map((shed) => (
            <li
              key={shed.id}
              role="option"
              aria-selected={selectedShedId === shed.id}
              className={cn(
                'flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50',
                selectedShedId === shed.id && 'bg-blue-50 text-blue-700 font-medium',
              )}
              onClick={() => {
                setSelectedShedId(shed.id);
                setIsOpen(false);
              }}
            >
              <Building2 className="h-4 w-4 flex-shrink-0 text-gray-400" />
              <span className="flex-1 truncate">{shed.name}</span>
              {selectedShedId === shed.id && (
                <Check className="h-4 w-4 text-blue-600" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
