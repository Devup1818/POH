-- Migration 009: Notifications System
-- Creates notifications table, RLS policies, and trigger functions for auto-generating notifications

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (
    type IN ('stage_completion', 'significant_delay', 'missing_part_overdue', 'testing_complete', 'general')
  ),
  title VARCHAR(300) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  shed_id UUID REFERENCES sheds(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_shed ON notifications(shed_id);

-- 2. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- System/triggers can insert notifications (using service role or definer functions)
-- We use SECURITY DEFINER functions to insert notifications
CREATE POLICY "Service can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- 3. Helper function to notify section engineers at a shed
CREATE OR REPLACE FUNCTION notify_shed_engineers(
  p_shed_id UUID,
  p_type VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_related_entity_type VARCHAR DEFAULT NULL,
  p_related_entity_id UUID DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id, shed_id)
  SELECT
    usa.user_id,
    p_type,
    p_title,
    p_message,
    p_related_entity_type,
    p_related_entity_id,
    p_shed_id
  FROM user_shed_assignments usa
  JOIN users u ON u.id = usa.user_id
  WHERE usa.shed_id = p_shed_id
    AND u.role IN ('Admin', 'Senior_Section_Engineer', 'Section_Engineer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger: When all coaches in a rake complete a stage (all at same stage or beyond)
-- This is checked via server-side logic in the actions, not a trigger,
-- because detecting "all coaches completed current stage" requires complex aggregate checks.

-- 5. Auto-update trigger for updated_at on notifications (not needed - no updated_at column)

-- 6. Add notification_preferences to user profile (optional, stored in users table or separate)
-- For simplicity, we'll use the shed config's notification_preferences as defaults
-- and allow per-user overrides via a JSONB column on users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'notification_preferences'
  ) THEN
    ALTER TABLE users ADD COLUMN notification_preferences JSONB DEFAULT '{
      "stage_completion": true,
      "significant_delay": true,
      "missing_parts": true,
      "testing_complete": true
    }'::jsonb;
  END IF;
END $$;
