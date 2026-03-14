'use server';

import { createClient } from '@/lib/supabase/server';
import { createNotificationForShed } from '@/lib/actions/notifications';

/**
 * Check for overdue missing parts and generate notifications.
 * This should be called periodically (e.g., via a cron job or API route).
 * It finds parts where expected_arrival_date has passed and the part is still Missing/Pending,
 * and creates notifications for the relevant shed engineers.
 */
export async function checkOverdueMissingParts(): Promise<{ checked: number; notified: number }> {
  const supabase = await createClient();

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Find missing parts where expected arrival date has passed
  const { data: overdueParts, error } = await supabase
    .from('coach_parts')
    .select(`
      id, part_name, expected_arrival_date, notes,
      coaches!inner (
        id, coach_number, rake_id,
        rakes!inner (
          id, rake_number, shed_id, status
        )
      )
    `)
    .eq('status', 'Missing/Pending')
    .eq('coaches.rakes.status', 'Active')
    .lte('expected_arrival_date', today);

  if (error || !overdueParts) {
    return { checked: 0, notified: 0 };
  }

  // Check which ones we haven't already notified about recently (within last 24h)
  let notified = 0;

  for (const part of overdueParts) {
    const coach = part.coaches as unknown as {
      id: string;
      coach_number: string;
      rake_id: string;
      rakes: { id: string; rake_number: string; shed_id: string };
    };

    // Check if we already sent a notification for this part in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'missing_part_overdue')
      .eq('related_entity_id', part.id)
      .gte('created_at', oneDayAgo);

    if ((count ?? 0) === 0) {
      await createNotificationForShed(
        coach.rakes.shed_id,
        'missing_part_overdue',
        `Overdue: ${part.part_name} for coach ${coach.coach_number}`,
        `The expected arrival date (${part.expected_arrival_date}) for ${part.part_name} on coach ${coach.coach_number} (rake ${coach.rakes.rake_number}) has passed. The part is still missing.`,
        'coach',
        coach.id,
      );
      notified++;
    }
  }

  return { checked: overdueParts.length, notified };
}

/**
 * Check for coaches with significant delays and generate notifications.
 * This checks coaches whose elapsed time in current stage exceeds target + 2 days.
 */
export async function checkSignificantDelays(): Promise<{ checked: number; notified: number }> {
  const supabase = await createClient();

  // Find coaches in active rakes with stage history that has no completion date
  // and where elapsed time exceeds target + 2 days
  const { data: activeCoaches, error } = await supabase
    .from('coach_stage_history')
    .select(`
      id, stage, start_date, target_duration_days,
      coaches!inner (
        id, coach_number, current_stage, rake_id,
        rakes!inner (
          id, rake_number, shed_id, status
        )
      )
    `)
    .is('completion_date', null)
    .eq('coaches.rakes.status', 'Active');

  if (error || !activeCoaches) {
    return { checked: 0, notified: 0 };
  }

  let notified = 0;

  for (const entry of activeCoaches) {
    const elapsedMs = Date.now() - new Date(entry.start_date).getTime();
    const elapsedDays = Math.ceil(elapsedMs / (1000 * 60 * 60 * 24));
    const targetDays = entry.target_duration_days;

    // Only notify for significant delays (> target + 2 days)
    if (elapsedDays > targetDays + 2) {
      const coach = entry.coaches as unknown as {
        id: string;
        coach_number: string;
        rake_id: string;
        rakes: { id: string; rake_number: string; shed_id: string };
      };

      // Check if we already sent a delay notification for this coach in the last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'significant_delay')
        .eq('related_entity_id', coach.id)
        .gte('created_at', oneDayAgo);

      if ((count ?? 0) === 0) {
        const delayDays = elapsedDays - targetDays;
        await createNotificationForShed(
          coach.rakes.shed_id,
          'significant_delay',
          `Coach ${coach.coach_number} significantly delayed`,
          `Coach ${coach.coach_number} in rake ${coach.rakes.rake_number} has been in ${entry.stage} stage for ${elapsedDays} days (target: ${targetDays} days, delay: ${delayDays} days).`,
          'coach',
          coach.id,
        );
        notified++;
      }
    }
  }

  return { checked: activeCoaches.length, notified };
}
