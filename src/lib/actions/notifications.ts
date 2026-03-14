'use server';

import { createClient } from '@/lib/supabase/server';
import type { Notification, NotificationPreferences, Result } from '@/types';

/**
 * Fetch unread and recent notifications for a user.
 * Returns up to 50 most recent notifications (unread first, then recent read).
 */
export async function getNotifications(
  userId: string,
): Promise<Result<Notification[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('is_read', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: (data ?? []) as Notification[] };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fetch notifications',
    };
  }
}

/**
 * Get count of unread notifications for a user.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const supabase = await createClient();

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(
  notificationId: string,
): Promise<Result<void>> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to mark notification as read',
    };
  }
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllAsRead(userId: string): Promise<Result<void>> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to mark all as read',
    };
  }
}

/**
 * Create a notification for all section engineers at a shed.
 * Called from other server actions when notification-worthy events occur.
 */
export async function createNotificationForShed(
  shedId: string,
  type: Notification['type'],
  title: string,
  message: string,
  relatedEntityType?: string,
  relatedEntityId?: string,
): Promise<void> {
  try {
    const supabase = await createClient();

    // Get all engineers assigned to this shed
    const { data: assignments } = await supabase
      .from('user_shed_assignments')
      .select('user_id, users!inner(role, notification_preferences)')
      .eq('shed_id', shedId);

    if (!assignments || assignments.length === 0) return;

    // Map notification type to preference key
    const prefKey: Record<string, keyof NotificationPreferences> = {
      stage_completion: 'stage_completion',
      significant_delay: 'significant_delay',
      missing_part_overdue: 'missing_parts',
      testing_complete: 'testing_complete',
    };

    const notifications = assignments
      .filter((a) => {
        const user = a.users as unknown as {
          role: string;
          notification_preferences: NotificationPreferences | null;
        };
        // Only notify engineers and admins
        if (!['Admin', 'Senior_Section_Engineer', 'Section_Engineer'].includes(user.role)) {
          return false;
        }
        // Check user notification preferences
        const prefs = user.notification_preferences;
        if (prefs && prefKey[type] && !prefs[prefKey[type]]) {
          return false;
        }
        return true;
      })
      .map((a) => ({
        user_id: a.user_id,
        type,
        title,
        message,
        is_read: false,
        related_entity_type: relatedEntityType ?? null,
        related_entity_id: relatedEntityId ?? null,
        shed_id: shedId,
      }));

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }
  } catch {
    // Notification failures should not break the main operation
    console.error('Failed to create notifications');
  }
}

/**
 * Update user notification preferences.
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences,
): Promise<Result<void>> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('users')
      .update({ notification_preferences: preferences })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update preferences',
    };
  }
}

/**
 * Get user notification preferences.
 */
export async function getNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences> {
  const defaults: NotificationPreferences = {
    stage_completion: true,
    significant_delay: true,
    missing_parts: true,
    testing_complete: true,
  };

  try {
    const supabase = await createClient();

    const { data } = await supabase
      .from('users')
      .select('notification_preferences')
      .eq('id', userId)
      .single();

    if (data?.notification_preferences) {
      return { ...defaults, ...data.notification_preferences };
    }
    return defaults;
  } catch {
    return defaults;
  }
}
