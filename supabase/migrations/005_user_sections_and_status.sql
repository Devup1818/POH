-- ============================================
-- User Section Assignments & Active Status
-- ============================================

-- 1. Add is_active column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- 2. Create user_section_assignments table
CREATE TABLE IF NOT EXISTS user_section_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shed_id UUID NOT NULL REFERENCES sheds(id) ON DELETE CASCADE,
  section_name VARCHAR(50) NOT NULL,
  sub_section VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, shed_id, section_name, sub_section)
);

-- 3. Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_user_section_user ON user_section_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_section_shed ON user_section_assignments(shed_id);

-- 4. Enable RLS
ALTER TABLE user_section_assignments ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "Admin can manage section assignments" ON user_section_assignments;
CREATE POLICY "Admin can manage section assignments"
  ON user_section_assignments FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Users can view own section assignments" ON user_section_assignments;
CREATE POLICY "Users can view own section assignments"
  ON user_section_assignments FOR SELECT TO authenticated
  USING (user_id = auth.uid());
