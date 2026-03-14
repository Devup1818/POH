-- ============================================
-- POH Architecture Changes Migration
-- ============================================
-- Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
--
-- Changes:
--   1. rakes.rake_type: VARCHAR(10) → VARCHAR(20), CHECK → '3-Phase Rake'/'Conventional Rake'
--   2. rakes.intake_date: remove DEFAULT NOW()
--   3. coaches.coach_number: VARCHAR(6) → VARCHAR(8), CHECK → 5-8 digits
--   4. coaches.coach_type: new column VARCHAR(2) MC/TC
--   5. coach_section_status: new table (per-coach per-section tracking)
--   6. section_in_charge_assignments: new table (SSE → section mapping)
--   7. Data migration: EMU → '3-Phase Rake', MEMU → 'Conventional Rake'
-- ============================================

-- ============================================
-- 1. ALTER rakes.rake_type
-- ============================================

-- First migrate existing data BEFORE changing the constraint
UPDATE rakes SET rake_type = '3-Phase Rake' WHERE rake_type = 'EMU';
UPDATE rakes SET rake_type = 'Conventional Rake' WHERE rake_type = 'MEMU';

-- Widen column to VARCHAR(20) to fit longer names
ALTER TABLE rakes ALTER COLUMN rake_type TYPE VARCHAR(20);

-- Drop old CHECK and add new one
ALTER TABLE rakes DROP CONSTRAINT IF EXISTS rakes_rake_type_check;
ALTER TABLE rakes ADD CONSTRAINT rakes_rake_type_check
  CHECK (rake_type IN ('3-Phase Rake', 'Conventional Rake'));

-- ============================================
-- 2. ALTER rakes.intake_date — remove DEFAULT NOW()
-- ============================================
ALTER TABLE rakes ALTER COLUMN intake_date DROP DEFAULT;

-- ============================================
-- 3. ALTER coaches.coach_number — VARCHAR(8), 5-8 digit CHECK
-- ============================================

-- Widen column
ALTER TABLE coaches ALTER COLUMN coach_number TYPE VARCHAR(8);

-- Drop old CHECK and add new one
ALTER TABLE coaches DROP CONSTRAINT IF EXISTS coaches_coach_number_check;
ALTER TABLE coaches ADD CONSTRAINT coaches_coach_number_check
  CHECK (coach_number ~ '^\d{5,8}$');

-- ============================================
-- 4. ADD coaches.coach_type column
-- ============================================
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS
  coach_type VARCHAR(2) NOT NULL DEFAULT 'MC'
  CHECK (coach_type IN ('MC', 'TC'));

-- ============================================
-- 5. CREATE coach_section_status table
-- ============================================
CREATE TABLE IF NOT EXISTS coach_section_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  section_name VARCHAR(20) NOT NULL CHECK (
    section_name IN ('E2', 'E3', 'E5', 'M2', 'M3', 'M5', 'M6', 'Painting', 'M8', 'M4')
  ),
  status VARCHAR(20) NOT NULL DEFAULT 'Not Started' CHECK (
    status IN ('Not Started', 'In Progress', 'Completed')
  ),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coach_id, section_name)
);

CREATE INDEX IF NOT EXISTS idx_coach_section_status_coach ON coach_section_status(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_section_status_section ON coach_section_status(section_name);
CREATE INDEX IF NOT EXISTS idx_coach_section_status_status ON coach_section_status(status);

-- ============================================
-- 6. CREATE section_in_charge_assignments table
-- ============================================
CREATE TABLE IF NOT EXISTS section_in_charge_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shed_id UUID NOT NULL REFERENCES sheds(id) ON DELETE CASCADE,
  section_name VARCHAR(20) NOT NULL CHECK (
    section_name IN ('E2', 'E3', 'E5', 'M2', 'M3', 'M5', 'M6', 'Painting', 'M8', 'M4')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, shed_id, section_name)
);

CREATE INDEX IF NOT EXISTS idx_section_in_charge_user ON section_in_charge_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_section_in_charge_shed ON section_in_charge_assignments(shed_id);
CREATE INDEX IF NOT EXISTS idx_section_in_charge_section ON section_in_charge_assignments(section_name);

-- ============================================
-- 7. RLS Policies for coach_section_status
-- ============================================
ALTER TABLE coach_section_status ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view section status for coaches in their assigned sheds
CREATE POLICY "Users can view coach section status from assigned sheds"
  ON coach_section_status FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaches c
      JOIN rakes r ON r.id = c.rake_id
      WHERE c.id = coach_section_status.coach_id AND user_has_shed_access(r.shed_id)
    )
  );

-- INSERT: Engineers can insert section status records
CREATE POLICY "Engineers can insert coach section status"
  ON coach_section_status FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coaches c
      JOIN rakes r ON r.id = c.rake_id
      WHERE c.id = coach_section_status.coach_id AND user_has_shed_access(r.shed_id)
    )
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
        AND role IN ('Admin', 'Senior_Section_Engineer', 'Junior_Engineer')
    )
  );

-- UPDATE: Engineers can update section status records
CREATE POLICY "Engineers can update coach section status"
  ON coach_section_status FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaches c
      JOIN rakes r ON r.id = c.rake_id
      WHERE c.id = coach_section_status.coach_id AND user_has_shed_access(r.shed_id)
    )
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid()
        AND role IN ('Admin', 'Senior_Section_Engineer', 'Junior_Engineer')
    )
  );

-- ============================================
-- 8. RLS Policies for section_in_charge_assignments
-- ============================================
ALTER TABLE section_in_charge_assignments ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view their own assignments; Admins can view all
CREATE POLICY "Users can view own section in-charge assignments"
  ON section_in_charge_assignments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- INSERT/UPDATE/DELETE: Admin only
CREATE POLICY "Admin can manage section in-charge assignments"
  ON section_in_charge_assignments FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admin can update section in-charge assignments"
  ON section_in_charge_assignments FOR UPDATE TO authenticated
  USING (is_admin());

CREATE POLICY "Admin can delete section in-charge assignments"
  ON section_in_charge_assignments FOR DELETE TO authenticated
  USING (is_admin());

-- ============================================
-- 9. Seed coach_section_status for existing coaches
-- ============================================
-- Create 10 section status rows for every existing coach
INSERT INTO coach_section_status (coach_id, section_name)
SELECT c.id, s.section_name
FROM coaches c
CROSS JOIN (
  VALUES ('E2'), ('E3'), ('E5'), ('M2'), ('M3'), ('M5'), ('M6'), ('Painting'), ('M8'), ('M4')
) AS s(section_name)
ON CONFLICT (coach_id, section_name) DO NOTHING;

-- ============================================
-- 10. ADD rakes.rake_category column (EMU/MEMU)
-- ============================================
ALTER TABLE rakes ADD COLUMN IF NOT EXISTS
  rake_category VARCHAR(10) NOT NULL DEFAULT 'EMU'
  CHECK (rake_category IN ('EMU', 'MEMU'));
