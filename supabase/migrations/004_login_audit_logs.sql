-- ============================================
-- Login Audit Logs - OTP Authentication
-- ============================================

-- LOGIN AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS login_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  login_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_audit_user ON login_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_audit_timestamp ON login_audit_logs(login_timestamp DESC);

-- ==================
-- RLS: Insert-only (immutable records)
-- ==================
ALTER TABLE login_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role insert only" ON login_audit_logs;
CREATE POLICY "Service role insert only" ON login_audit_logs
  FOR INSERT
  WITH CHECK (true);

-- No UPDATE or DELETE policies = immutable records
