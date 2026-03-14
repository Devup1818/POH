-- ============================================
-- Functions, Triggers, and Views
-- ============================================

-- ==================
-- FUNCTIONS
-- ==================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Calculate timeline status
CREATE OR REPLACE FUNCTION calculate_timeline_status(
  actual_days INT,
  target_days INT,
  minor_threshold INT DEFAULT 1,
  significant_threshold INT DEFAULT 2
)
RETURNS VARCHAR AS $$
BEGIN
  IF actual_days IS NULL THEN
    RETURN NULL;
  ELSIF actual_days < target_days THEN
    RETURN 'Ahead of Schedule';
  ELSIF actual_days <= target_days THEN
    RETURN 'On Schedule';
  ELSIF actual_days <= target_days + significant_threshold THEN
    RETURN 'Minor Delay';
  ELSE
    RETURN 'Significant Delay';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get rake current stage (earliest stage among coaches)
CREATE OR REPLACE FUNCTION get_rake_current_stage(rake_uuid UUID)
RETURNS VARCHAR AS $$
DECLARE
  stage_order TEXT[] := ARRAY['Intake', 'Dismantling', 'Inspection', 'Reassembly',
                               'Finishing', 'Testing', 'Trial', 'Release'];
  earliest_stage VARCHAR;
BEGIN
  SELECT current_stage INTO earliest_stage
  FROM coaches
  WHERE rake_id = rake_uuid
  ORDER BY array_position(stage_order, current_stage)
  LIMIT 1;

  RETURN earliest_stage;
END;
$$ LANGUAGE plpgsql;

-- Initialize coach parts on coach creation
CREATE OR REPLACE FUNCTION initialize_coach_parts()
RETURNS TRIGGER AS $$
DECLARE
  part_names TEXT[] := ARRAY['Motor Bogie', 'Trailer Bogie', 'Traction Motor', 'Brake System',
                              'Electrical System', 'Pantograph', 'Couplers', 'Suspension System', 'Body Shell'];
  part_name TEXT;
BEGIN
  FOREACH part_name IN ARRAY part_names
  LOOP
    INSERT INTO coach_parts (coach_id, part_name, status)
    VALUES (NEW.id, part_name, 'Not Started');
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Initialize coach checklist on coach creation
CREATE OR REPLACE FUNCTION initialize_coach_checklist()
RETURNS TRIGGER AS $$
DECLARE
  rake_poh_type VARCHAR;
BEGIN
  SELECT poh_type INTO rake_poh_type
  FROM rakes
  WHERE id = NEW.rake_id;

  INSERT INTO coach_checklist_items (coach_id, template_id, status)
  SELECT NEW.id, id, 'Not Started'
  FROM checklist_templates
  WHERE poh_type = rake_poh_type;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Initialize coach tests when entering Testing stage
CREATE OR REPLACE FUNCTION initialize_coach_tests()
RETURNS TRIGGER AS $$
DECLARE
  test_types TEXT[] := ARRAY['Electrical', 'Mechanical', 'Pneumatic'];
  t_type TEXT;
BEGIN
  IF NEW.current_stage = 'Testing' AND (OLD IS NULL OR OLD.current_stage != 'Testing') THEN
    FOREACH t_type IN ARRAY test_types
    LOOP
      INSERT INTO coach_tests (coach_id, test_type, status)
      VALUES (NEW.id, t_type, 'Not Started')
      ON CONFLICT (coach_id, test_type) DO NOTHING;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create audit log on data changes
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  shed_uuid UUID;
  current_user_id UUID;
BEGIN
  -- Try to get current user from auth context
  BEGIN
    current_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    current_user_id := NULL;
  END;

  -- Skip audit if no authenticated user (e.g., during seed)
  IF current_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get shed_id based on entity type
  IF TG_TABLE_NAME = 'rakes' THEN
    shed_uuid := NEW.shed_id;
  ELSIF TG_TABLE_NAME = 'coaches' THEN
    SELECT shed_id INTO shed_uuid FROM rakes WHERE id = NEW.rake_id;
  END IF;

  INSERT INTO audit_logs (
    user_id, action, entity_type, entity_id,
    old_values, new_values, shed_id
  ) VALUES (
    current_user_id, TG_OP, TG_TABLE_NAME, NEW.id,
    CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    to_jsonb(NEW), shed_uuid
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================
-- TRIGGERS
-- ==================

-- Auto-update updated_at triggers
DROP TRIGGER IF EXISTS update_sheds_updated_at ON sheds;
CREATE TRIGGER update_sheds_updated_at BEFORE UPDATE ON sheds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_rakes_updated_at ON rakes;
CREATE TRIGGER update_rakes_updated_at BEFORE UPDATE ON rakes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_coaches_updated_at ON coaches;
CREATE TRIGGER update_coaches_updated_at BEFORE UPDATE ON coaches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_coach_stage_history_updated_at ON coach_stage_history;
CREATE TRIGGER update_coach_stage_history_updated_at BEFORE UPDATE ON coach_stage_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_coach_parts_updated_at ON coach_parts;
CREATE TRIGGER update_coach_parts_updated_at BEFORE UPDATE ON coach_parts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_checklist_templates_updated_at ON checklist_templates;
CREATE TRIGGER update_checklist_templates_updated_at BEFORE UPDATE ON checklist_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_coach_checklist_items_updated_at ON coach_checklist_items;
CREATE TRIGGER update_coach_checklist_items_updated_at BEFORE UPDATE ON coach_checklist_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_coach_tests_updated_at ON coach_tests;
CREATE TRIGGER update_coach_tests_updated_at BEFORE UPDATE ON coach_tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Initialize coach parts on insert
DROP TRIGGER IF EXISTS trigger_initialize_coach_parts ON coaches;
CREATE TRIGGER trigger_initialize_coach_parts
  AFTER INSERT ON coaches
  FOR EACH ROW EXECUTE FUNCTION initialize_coach_parts();

-- Initialize coach checklist on insert
DROP TRIGGER IF EXISTS trigger_initialize_coach_checklist ON coaches;
CREATE TRIGGER trigger_initialize_coach_checklist
  AFTER INSERT ON coaches
  FOR EACH ROW EXECUTE FUNCTION initialize_coach_checklist();

-- Initialize coach tests when entering Testing stage
DROP TRIGGER IF EXISTS trigger_initialize_coach_tests ON coaches;
CREATE TRIGGER trigger_initialize_coach_tests
  AFTER UPDATE ON coaches
  FOR EACH ROW EXECUTE FUNCTION initialize_coach_tests();

-- Audit triggers on key tables
DROP TRIGGER IF EXISTS audit_rakes ON rakes;
CREATE TRIGGER audit_rakes AFTER INSERT OR UPDATE ON rakes
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();
DROP TRIGGER IF EXISTS audit_coaches ON coaches;
CREATE TRIGGER audit_coaches AFTER INSERT OR UPDATE ON coaches
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- ==================
-- VIEWS
-- ==================

-- Active rakes with aggregated data
CREATE OR REPLACE VIEW v_active_rakes_summary AS
SELECT
  r.id,
  r.rake_number,
  r.rake_type,
  r.poh_type,
  r.shed_id,
  s.name as shed_name,
  r.total_coaches,
  r.intake_date,
  r.status,
  get_rake_current_stage(r.id) as current_stage,
  EXTRACT(DAY FROM NOW() - r.intake_date)::INT as elapsed_days,
  COUNT(DISTINCT c.id)::INT as total_coaches_count,
  COUNT(DISTINCT CASE
    WHEN csh.timeline_status IN ('Minor Delay', 'Significant Delay') THEN c.id
  END)::INT as delayed_coaches_count,
  COUNT(DISTINCT CASE
    WHEN cp.status = 'Missing/Pending' THEN cp.coach_id
  END)::INT as coaches_with_missing_parts
FROM rakes r
JOIN sheds s ON r.shed_id = s.id
LEFT JOIN coaches c ON r.id = c.rake_id
LEFT JOIN coach_stage_history csh ON c.id = csh.coach_id AND csh.completion_date IS NULL
LEFT JOIN coach_parts cp ON c.id = cp.coach_id AND cp.status = 'Missing/Pending'
WHERE r.status = 'Active'
GROUP BY r.id, r.rake_number, r.rake_type, r.poh_type, r.shed_id, s.name, r.total_coaches, r.intake_date, r.status;
