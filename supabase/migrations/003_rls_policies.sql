-- ============================================
-- Row Level Security Policies
-- ============================================

-- Helper: check if user is Admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: check if user is assigned to a shed
CREATE OR REPLACE FUNCTION user_has_shed_access(check_shed_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_admin() OR EXISTS (
    SELECT 1 FROM user_shed_assignments
    WHERE user_id = auth.uid() AND shed_id = check_shed_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================
-- ENABLE RLS
-- ==================
ALTER TABLE sheds ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_shed_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_stage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ==================
-- SHEDS POLICIES
-- ==================
CREATE POLICY "Anyone authenticated can view active sheds"
  ON sheds FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin can insert sheds"
  ON sheds FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admin can update sheds"
  ON sheds FOR UPDATE TO authenticated
  USING (is_admin());

-- ==================
-- USERS POLICIES
-- ==================
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT TO authenticated
  USING (id = auth.uid() OR is_admin());

CREATE POLICY "Admin can insert users"
  ON users FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admin can update users"
  ON users FOR UPDATE TO authenticated
  USING (is_admin() OR id = auth.uid());

-- ==================
-- USER SHED ASSIGNMENTS POLICIES
-- ==================
CREATE POLICY "Users can view own assignments"
  ON user_shed_assignments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Admin can manage assignments"
  ON user_shed_assignments FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admin can update assignments"
  ON user_shed_assignments FOR UPDATE TO authenticated
  USING (is_admin());

CREATE POLICY "Admin can delete assignments"
  ON user_shed_assignments FOR DELETE TO authenticated
  USING (is_admin());

-- ==================
-- RAKES POLICIES
-- ==================
CREATE POLICY "Users can view rakes from assigned sheds"
  ON rakes FOR SELECT TO authenticated
  USING (user_has_shed_access(shed_id));

CREATE POLICY "Engineers can create rakes at assigned sheds"
  ON rakes FOR INSERT TO authenticated
  WITH CHECK (
    user_has_shed_access(shed_id)
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'Senior_Section_Engineer', 'Junior_Engineer')
    )
  );

CREATE POLICY "Engineers can update rakes at assigned sheds"
  ON rakes FOR UPDATE TO authenticated
  USING (
    user_has_shed_access(shed_id)
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'Senior_Section_Engineer', 'Junior_Engineer')
    )
  );

-- ==================
-- COACHES POLICIES (inherit from rake → shed)
-- ==================
CREATE POLICY "Users can view coaches from assigned sheds"
  ON coaches FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rakes r WHERE r.id = coaches.rake_id AND user_has_shed_access(r.shed_id)
    )
  );

CREATE POLICY "Engineers can insert coaches"
  ON coaches FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rakes r WHERE r.id = coaches.rake_id AND user_has_shed_access(r.shed_id)
    )
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'Senior_Section_Engineer', 'Junior_Engineer')
    )
  );

CREATE POLICY "Engineers can update coaches"
  ON coaches FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM rakes r WHERE r.id = coaches.rake_id AND user_has_shed_access(r.shed_id)
    )
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'Senior_Section_Engineer', 'Junior_Engineer')
    )
  );

-- ==================
-- COACH STAGE HISTORY POLICIES
-- ==================
CREATE POLICY "Users can view stage history from assigned sheds"
  ON coach_stage_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaches c
      JOIN rakes r ON r.id = c.rake_id
      WHERE c.id = coach_stage_history.coach_id AND user_has_shed_access(r.shed_id)
    )
  );

CREATE POLICY "Engineers can insert stage history"
  ON coach_stage_history FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coaches c
      JOIN rakes r ON r.id = c.rake_id
      WHERE c.id = coach_stage_history.coach_id AND user_has_shed_access(r.shed_id)
    )
  );

CREATE POLICY "Engineers can update stage history"
  ON coach_stage_history FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaches c
      JOIN rakes r ON r.id = c.rake_id
      WHERE c.id = coach_stage_history.coach_id AND user_has_shed_access(r.shed_id)
    )
  );

-- ==================
-- COACH PARTS POLICIES
-- ==================
CREATE POLICY "Users can view parts from assigned sheds"
  ON coach_parts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaches c
      JOIN rakes r ON r.id = c.rake_id
      WHERE c.id = coach_parts.coach_id AND user_has_shed_access(r.shed_id)
    )
  );

CREATE POLICY "Engineers can update parts"
  ON coach_parts FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaches c
      JOIN rakes r ON r.id = c.rake_id
      WHERE c.id = coach_parts.coach_id AND user_has_shed_access(r.shed_id)
    )
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'Senior_Section_Engineer', 'Junior_Engineer')
    )
  );

CREATE POLICY "System can insert parts"
  ON coach_parts FOR INSERT TO authenticated
  WITH CHECK (true);

-- ==================
-- CHECKLIST TEMPLATES POLICIES (read-only for all, admin can manage)
-- ==================
CREATE POLICY "Anyone authenticated can view checklist templates"
  ON checklist_templates FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin can manage checklist templates"
  ON checklist_templates FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admin can update checklist templates"
  ON checklist_templates FOR UPDATE TO authenticated
  USING (is_admin());

-- ==================
-- COACH CHECKLIST ITEMS POLICIES
-- ==================
CREATE POLICY "Users can view checklist items from assigned sheds"
  ON coach_checklist_items FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaches c
      JOIN rakes r ON r.id = c.rake_id
      WHERE c.id = coach_checklist_items.coach_id AND user_has_shed_access(r.shed_id)
    )
  );

CREATE POLICY "Engineers can update checklist items"
  ON coach_checklist_items FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaches c
      JOIN rakes r ON r.id = c.rake_id
      WHERE c.id = coach_checklist_items.coach_id AND user_has_shed_access(r.shed_id)
    )
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'Senior_Section_Engineer', 'Junior_Engineer')
    )
  );

CREATE POLICY "System can insert checklist items"
  ON coach_checklist_items FOR INSERT TO authenticated
  WITH CHECK (true);

-- ==================
-- COACH TESTS POLICIES
-- ==================
CREATE POLICY "Users can view tests from assigned sheds"
  ON coach_tests FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaches c
      JOIN rakes r ON r.id = c.rake_id
      WHERE c.id = coach_tests.coach_id AND user_has_shed_access(r.shed_id)
    )
  );

CREATE POLICY "Engineers can update tests"
  ON coach_tests FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaches c
      JOIN rakes r ON r.id = c.rake_id
      WHERE c.id = coach_tests.coach_id AND user_has_shed_access(r.shed_id)
    )
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'Senior_Section_Engineer', 'Junior_Engineer')
    )
  );

CREATE POLICY "System can insert tests"
  ON coach_tests FOR INSERT TO authenticated
  WITH CHECK (true);

-- ==================
-- NOTES POLICIES
-- ==================
CREATE POLICY "Users can view notes from assigned sheds"
  ON notes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM coaches c
      JOIN rakes r ON r.id = c.rake_id
      WHERE c.id = notes.coach_id AND user_has_shed_access(r.shed_id)
    )
  );

CREATE POLICY "Engineers and technicians can add notes"
  ON notes FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coaches c
      JOIN rakes r ON r.id = c.rake_id
      WHERE c.id = notes.coach_id AND user_has_shed_access(r.shed_id)
    )
    AND EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('Admin', 'Senior_Section_Engineer', 'Junior_Engineer', 'Technician')
    )
  );

CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete own notes"
  ON notes FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- ==================
-- AUDIT LOGS POLICIES
-- ==================
CREATE POLICY "Admin can view all audit logs"
  ON audit_logs FOR SELECT TO authenticated
  USING (is_admin() OR user_has_shed_access(shed_id));

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT TO authenticated
  WITH CHECK (true);
