-- ============================================
-- SAFE Migration: POH Architecture Changes
-- ============================================
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This is safe to run multiple times (idempotent).
-- ============================================

-- 1. Widen coaches.coach_number to VARCHAR(8) and allow 5-8 digits
ALTER TABLE coaches ALTER COLUMN coach_number TYPE VARCHAR(8);
ALTER TABLE coaches DROP CONSTRAINT IF EXISTS coaches_coach_number_check;
ALTER TABLE coaches ADD CONSTRAINT coaches_coach_number_check
  CHECK (coach_number ~ '^\d{5,8}$');

-- 2. Add coaches.coach_type column (MC/TC) with default 'MC'
ALTER TABLE coaches ADD COLUMN IF NOT EXISTS
  coach_type VARCHAR(2) NOT NULL DEFAULT 'MC'
  CHECK (coach_type IN ('MC', 'TC'));

-- 3. Add rakes.rake_category column (EMU/MEMU) with default 'EMU'
ALTER TABLE rakes ADD COLUMN IF NOT EXISTS
  rake_category VARCHAR(10) NOT NULL DEFAULT 'EMU'
  CHECK (rake_category IN ('EMU', 'MEMU'));

-- 3b. Widen rakes.rake_type to accept new type values
ALTER TABLE rakes ALTER COLUMN rake_type TYPE VARCHAR(30);
ALTER TABLE rakes DROP CONSTRAINT IF EXISTS rakes_rake_type_check;
ALTER TABLE rakes ADD CONSTRAINT rakes_rake_type_check
  CHECK (rake_type IN ('EMU', 'MEMU', '3-Phase Rake', 'Conventional Rake'));

-- 4. Remove DEFAULT NOW() from rakes.intake_date
ALTER TABLE rakes ALTER COLUMN intake_date DROP DEFAULT;

-- 5. Create coach_section_status table
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

-- 6. Create section_in_charge_assignments table
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

-- 7. RLS for coach_section_status
ALTER TABLE coach_section_status ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'coach_section_status' AND policyname = 'Users can view coach section status from assigned sheds'
  ) THEN
    CREATE POLICY "Users can view coach section status from assigned sheds"
      ON coach_section_status FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM coaches c
          JOIN rakes r ON r.id = c.rake_id
          WHERE c.id = coach_section_status.coach_id AND user_has_shed_access(r.shed_id)
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'coach_section_status' AND policyname = 'Engineers can insert coach section status'
  ) THEN
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
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'coach_section_status' AND policyname = 'Engineers can update coach section status'
  ) THEN
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
  END IF;
END $$;

-- 8. RLS for section_in_charge_assignments
ALTER TABLE section_in_charge_assignments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'section_in_charge_assignments' AND policyname = 'Users can view own section in-charge assignments'
  ) THEN
    CREATE POLICY "Users can view own section in-charge assignments"
      ON section_in_charge_assignments FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'section_in_charge_assignments' AND policyname = 'Admin can manage section in-charge assignments'
  ) THEN
    CREATE POLICY "Admin can manage section in-charge assignments"
      ON section_in_charge_assignments FOR INSERT TO authenticated
      WITH CHECK (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'section_in_charge_assignments' AND policyname = 'Admin can update section in-charge assignments'
  ) THEN
    CREATE POLICY "Admin can update section in-charge assignments"
      ON section_in_charge_assignments FOR UPDATE TO authenticated
      USING (is_admin());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'section_in_charge_assignments' AND policyname = 'Admin can delete section in-charge assignments'
  ) THEN
    CREATE POLICY "Admin can delete section in-charge assignments"
      ON section_in_charge_assignments FOR DELETE TO authenticated
      USING (is_admin());
  END IF;
END $$;

-- 9. Seed coach_section_status for existing coaches (safe — ON CONFLICT DO NOTHING)
INSERT INTO coach_section_status (coach_id, section_name)
SELECT c.id, s.section_name
FROM coaches c
CROSS JOIN (
  VALUES ('E2'), ('E3'), ('E5'), ('M2'), ('M3'), ('M5'), ('M6'), ('Painting'), ('M8'), ('M4')
) AS s(section_name)
ON CONFLICT (coach_id, section_name) DO NOTHING;

-- Done! All architecture changes applied safely.
