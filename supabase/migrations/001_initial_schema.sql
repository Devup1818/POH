-- ============================================
-- Railway POH Management System - Initial Schema
-- ============================================

-- 1. SHEDS TABLE
CREATE TABLE sheds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shed_code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  railway_zone VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{
    "target_durations": {
      "Intake": 1,
      "Dismantling": 2,
      "Inspection": 6,
      "Reassembly": 3,
      "Finishing": 2,
      "Testing": 3,
      "Trial": 2,
      "Release": 1
    },
    "delay_thresholds": {
      "minor": 1,
      "significant": 2
    },
    "notification_preferences": {
      "stage_completion": true,
      "significant_delay": true,
      "missing_parts": true,
      "testing_complete": true
    }
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sheds_active ON sheds(is_active);
CREATE INDEX idx_sheds_code ON sheds(shed_code);

-- 2. USERS TABLE
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Senior_Section_Engineer', 'Junior_Engineer', 'Technician', 'Viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- 3. USER SHED ASSIGNMENTS
CREATE TABLE user_shed_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shed_id UUID NOT NULL REFERENCES sheds(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, shed_id)
);

CREATE INDEX idx_user_shed_user ON user_shed_assignments(user_id);
CREATE INDEX idx_user_shed_shed ON user_shed_assignments(shed_id);
CREATE INDEX idx_user_shed_primary ON user_shed_assignments(user_id, is_primary);

-- 4. RAKES TABLE
CREATE TABLE rakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rake_number VARCHAR(50) NOT NULL,
  rake_type VARCHAR(10) NOT NULL CHECK (rake_type IN ('EMU', 'MEMU')),
  poh_type VARCHAR(10) NOT NULL CHECK (poh_type IN ('1st POH', '2nd POH', '3rd POH', '4th POH')),
  shed_id UUID NOT NULL REFERENCES sheds(id) ON DELETE RESTRICT,
  total_coaches INT NOT NULL CHECK (total_coaches BETWEEN 6 AND 20),
  status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Completed')),
  intake_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completion_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partial unique index: prevent duplicate active rakes at same shed
CREATE UNIQUE INDEX idx_rakes_unique_active ON rakes(rake_number, shed_id) WHERE status = 'Active';

CREATE INDEX idx_rakes_shed ON rakes(shed_id);
CREATE INDEX idx_rakes_status ON rakes(status);
CREATE INDEX idx_rakes_intake ON rakes(intake_date);
CREATE INDEX idx_rakes_number ON rakes(rake_number);

-- 5. COACHES TABLE
CREATE TABLE coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rake_id UUID NOT NULL REFERENCES rakes(id) ON DELETE CASCADE,
  coach_number VARCHAR(6) NOT NULL CHECK (coach_number ~ '^[0-9]{6}$'),
  current_stage VARCHAR(20) NOT NULL DEFAULT 'Intake' CHECK (
    current_stage IN ('Intake', 'Dismantling', 'Inspection', 'Reassembly',
                      'Finishing', 'Testing', 'Trial', 'Release')
  ),
  stage_start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rake_id, coach_number)
);

CREATE INDEX idx_coaches_rake ON coaches(rake_id);
CREATE INDEX idx_coaches_stage ON coaches(current_stage);
CREATE INDEX idx_coaches_number ON coaches(coach_number);

-- 6. COACH STAGE HISTORY
CREATE TABLE coach_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  stage VARCHAR(20) NOT NULL CHECK (
    stage IN ('Intake', 'Dismantling', 'Inspection', 'Reassembly',
              'Finishing', 'Testing', 'Trial', 'Release')
  ),
  start_date TIMESTAMPTZ NOT NULL,
  completion_date TIMESTAMPTZ,
  target_duration_days INT NOT NULL,
  actual_duration_days INT,
  timeline_status VARCHAR(30) CHECK (
    timeline_status IN ('On Schedule', 'Minor Delay', 'Significant Delay', 'Ahead of Schedule')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stage_history_coach ON coach_stage_history(coach_id);
CREATE INDEX idx_stage_history_stage ON coach_stage_history(stage);
CREATE INDEX idx_stage_history_status ON coach_stage_history(timeline_status);

-- 7. COACH PARTS
CREATE TABLE coach_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  part_name VARCHAR(50) NOT NULL CHECK (
    part_name IN ('Motor Bogie', 'Trailer Bogie', 'Traction Motor', 'Brake System',
                  'Electrical System', 'Pantograph', 'Couplers', 'Suspension System', 'Body Shell')
  ),
  status VARCHAR(30) NOT NULL DEFAULT 'Not Started' CHECK (
    status IN ('Not Started', 'Dismantled', 'Under Inspection', 'Overhauled/Repaired',
               'Reassembled', 'Tested', 'Missing/Pending')
  ),
  status_updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  expected_arrival_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coach_id, part_name)
);

CREATE INDEX idx_parts_coach ON coach_parts(coach_id);
CREATE INDEX idx_parts_status ON coach_parts(status);
CREATE INDEX idx_parts_missing ON coach_parts(coach_id) WHERE status = 'Missing/Pending';

-- 8. CHECKLIST TEMPLATES
CREATE TABLE checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poh_type VARCHAR(10) NOT NULL CHECK (poh_type IN ('1st POH', '2nd POH', '3rd POH', '4th POH')),
  item_code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  rdso_smi_reference VARCHAR(100) NOT NULL,
  is_mandatory BOOLEAN DEFAULT false,
  execution_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_checklist_poh_type ON checklist_templates(poh_type);
CREATE INDEX idx_checklist_mandatory ON checklist_templates(is_mandatory);
CREATE INDEX idx_checklist_order ON checklist_templates(poh_type, execution_order);

-- 9. COACH CHECKLIST ITEMS
CREATE TABLE coach_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'Not Started' CHECK (
    status IN ('Not Started', 'In Progress', 'Completed')
  ),
  completion_date TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coach_id, template_id)
);

CREATE INDEX idx_checklist_items_coach ON coach_checklist_items(coach_id);
CREATE INDEX idx_checklist_items_status ON coach_checklist_items(status);
CREATE INDEX idx_checklist_items_template ON coach_checklist_items(template_id);

-- 10. COACH TESTS
CREATE TABLE coach_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  test_type VARCHAR(20) NOT NULL CHECK (test_type IN ('Electrical', 'Mechanical', 'Pneumatic')),
  status VARCHAR(20) NOT NULL DEFAULT 'Not Started' CHECK (
    status IN ('Not Started', 'In Progress', 'Completed')
  ),
  start_date TIMESTAMPTZ,
  completion_date TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coach_id, test_type)
);

CREATE INDEX idx_tests_coach ON coach_tests(coach_id);
CREATE INDEX idx_tests_type ON coach_tests(test_type);
CREATE INDEX idx_tests_status ON coach_tests(status);

-- 11. NOTES
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note_type VARCHAR(20) NOT NULL CHECK (note_type IN ('General', 'Stage-Specific', 'Part-Specific')),
  content TEXT NOT NULL,
  is_important BOOLEAN DEFAULT false,
  related_stage VARCHAR(20),
  related_part UUID REFERENCES coach_parts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notes_coach ON notes(coach_id);
CREATE INDEX idx_notes_created ON notes(created_at DESC);
CREATE INDEX idx_notes_important ON notes(is_important) WHERE is_important = true;

-- 12. AUDIT LOGS
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  shed_id UUID REFERENCES sheds(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_shed ON audit_logs(shed_id);
