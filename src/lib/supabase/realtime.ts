'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook that subscribes to Supabase real-time changes on rakes and coaches tables.
 * Calls `onUpdate` whenever a relevant change occurs so the consumer can refresh data.
 */
export function useDashboardRealtime(
  shedId: string,
  onUpdate: () => void,
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const stableOnUpdate = useCallback(onUpdate, [onUpdate]);

  useEffect(() => {
    const supabase = createClient();

    // Subscribe to changes on rakes and coaches tables
    const channel = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rakes',
        },
        () => stableOnUpdate(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coaches',
        },
        () => stableOnUpdate(),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coach_parts',
        },
        () => stableOnUpdate(),
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [shedId, stableOnUpdate]);
}

/**
 * Hook that subscribes to real-time changes on coach_parts for a specific coach.
 * Calls `onUpdate` with the changed row whenever a part is inserted/updated.
 */
export function useCoachPartsRealtime(
  coachId: string,
  onUpdate: (row: { id: string; status: string; notes: string | null; expected_arrival_date: string | null; status_updated_at: string }) => void,
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const stableOnUpdate = useCallback(onUpdate, [onUpdate]);

  useEffect(() => {
    if (!coachId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`coach-parts-${coachId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'coach_parts',
          filter: `coach_id=eq.${coachId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            stableOnUpdate(payload.new as any);
          }
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [coachId, stableOnUpdate]);
}
