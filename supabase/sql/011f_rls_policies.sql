-- ============================================
-- 14. RLS Policies for Instance Tables
-- ============================================
-- Requirements: 19.5, 19.6, 19.7, 19.10
--
-- Access control:
--   - SELECT: all authenticated users can view all data
--   - UPDATE: admin OR SSE with matching section assignment
--   - INSERT: admin only (for job card generation)
--   - M4: ALL policy for M4-assigned SSE or admin
--
-- Uses existing is_admin() function and user_section_assignments table.
-- ============================================

-- Section Work Items
ALTER TABLE section_work_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view section work items"
  ON section_work_items FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "SSE can update own section work items"
  ON section_work_items FOR UPDATE TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM user_section_assignments usa
      JOIN workshop_sections ws ON ws.section_code = usa.sub_section
      WHERE usa.user_id = auth.uid()
        AND ws.id = section_work_items.section_id
    )
  );

-- Also need INSERT policy for job card generation (admin/system)
CREATE POLICY "Admin can insert section work items"
  ON section_work_items FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- Must Change Item Instances
ALTER TABLE must_change_item_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view must change items"
  ON must_change_item_instances FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "SSE can update own section must change items"
  ON must_change_item_instances FOR UPDATE TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM user_section_assignments usa
      JOIN workshop_sections ws ON ws.section_code = usa.sub_section
      WHERE usa.user_id = auth.uid()
        AND ws.id = must_change_item_instances.section_id
    )
  );

CREATE POLICY "Admin can insert must change items"
  ON must_change_item_instances FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- Section Test Instances
ALTER TABLE section_test_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view section tests"
  ON section_test_instances FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "SSE can update own section tests"
  ON section_test_instances FOR UPDATE TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM user_section_assignments usa
      JOIN workshop_sections ws ON ws.section_code = usa.sub_section
      WHERE usa.user_id = auth.uid()
        AND ws.id = section_test_instances.section_id
    )
  );

CREATE POLICY "Admin can insert section tests"
  ON section_test_instances FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- M4 Coordination Entries
ALTER TABLE m4_coordination_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view M4 entries"
  ON m4_coordination_entries FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "M4 SSE can manage coordination entries"
  ON m4_coordination_entries FOR ALL TO authenticated
  USING (
    is_admin()
    OR EXISTS (
      SELECT 1 FROM user_section_assignments usa
      WHERE usa.user_id = auth.uid()
        AND usa.sub_section = 'M4'
    )
  );
