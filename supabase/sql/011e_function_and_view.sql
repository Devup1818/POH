-- ============================================
-- Job Card Generation Function
-- ============================================
-- Requirements: 1.3, 1.4, 13.2
--
-- Generates a complete job card for a coach by creating:
--   - section_work_items from matching work_instructions
--   - must_change_item_instances from matching templates (by POH cycle)
--   - section_test_instances from matching test templates
--
-- Skips M4 (coordination section) for work items.
-- Uses ON CONFLICT DO NOTHING for idempotent re-runs.
-- ============================================

CREATE OR REPLACE FUNCTION generate_job_card(
  p_coach_id UUID,
  p_rake_type VARCHAR,
  p_coach_type VARCHAR,
  p_poh_cycle VARCHAR
) RETURNS VOID AS $$
DECLARE
  v_section RECORD;
  v_wi RECORD;
  v_mci RECORD;
  v_test RECORD;
  v_rake_type_mapped VARCHAR;
BEGIN
  -- Map rake_type to WI variant
  v_rake_type_mapped := CASE
    WHEN p_rake_type IN ('3-Phase Rake', '3-Phase') THEN '3-Phase'
    ELSE 'Conventional'
  END;

  -- For each applicable section
  FOR v_section IN
    SELECT ws.id, ws.section_code, ws.section_type
    FROM workshop_sections ws
    WHERE ws.is_active = true
  LOOP
    -- Skip M4 coordination section for work items
    IF v_section.section_type = 'coordination' THEN
      CONTINUE;
    END IF;

    -- Create work items from applicable WIs
    FOR v_wi IN
      SELECT wi.id
      FROM work_instructions wi
      JOIN wi_coach_type_applicability wica ON wica.wi_id = wi.id
      WHERE wi.section_id = v_section.id
        AND wi.rake_type = v_rake_type_mapped
        AND wica.coach_type = p_coach_type
    LOOP
      INSERT INTO section_work_items (coach_id, section_id, wi_id)
      VALUES (p_coach_id, v_section.id, v_wi.id)
      ON CONFLICT (coach_id, wi_id) DO NOTHING;
    END LOOP;

    -- Create must change item instances
    FOR v_mci IN
      SELECT mci.id
      FROM must_change_item_templates mci
      WHERE mci.section_id = v_section.id
        AND mci.poh_cycle = p_poh_cycle
        AND mci.rake_type = v_rake_type_mapped
    LOOP
      INSERT INTO must_change_item_instances (coach_id, template_id, section_id)
      VALUES (p_coach_id, v_mci.id, v_section.id)
      ON CONFLICT (coach_id, template_id) DO NOTHING;
    END LOOP;

    -- Create test instances
    FOR v_test IN
      SELECT st.id
      FROM section_test_templates st
      WHERE st.section_id = v_section.id
        AND (st.rake_type = v_rake_type_mapped OR st.rake_type IS NULL)
    LOOP
      INSERT INTO section_test_instances (coach_id, template_id, section_id)
      VALUES (p_coach_id, v_test.id, v_section.id)
      ON CONFLICT (coach_id, template_id) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 13. View: v_coach_section_progress
-- ============================================
-- Requirements: 15.2, 18.5, 18.6
-- Calculates per-coach, per-section progress including
-- work item completion %, must change item counts,
-- and test result counts.
-- ============================================

CREATE OR REPLACE VIEW v_coach_section_progress AS
SELECT
  swi.coach_id,
  swi.section_id,
  ws.section_code,
  ws.name_hindi,
  ws.name_english,
  ws.section_type,
  COUNT(swi.id) AS total_work_items,
  COUNT(swi.id) FILTER (WHERE swi.status = 'Completed') AS completed_work_items,
  CASE
    WHEN COUNT(swi.id) = 0 THEN 0
    ELSE ROUND((COUNT(swi.id) FILTER (WHERE swi.status = 'Completed')::NUMERIC / COUNT(swi.id)) * 100)
  END AS progress_pct,
  (SELECT COUNT(*) FROM must_change_item_instances mci
   WHERE mci.coach_id = swi.coach_id AND mci.section_id = swi.section_id) AS must_change_total,
  (SELECT COUNT(*) FROM must_change_item_instances mci
   WHERE mci.coach_id = swi.coach_id AND mci.section_id = swi.section_id AND mci.is_replaced = true) AS must_change_replaced,
  (SELECT COUNT(*) FROM section_test_instances sti
   WHERE sti.coach_id = swi.coach_id AND sti.section_id = swi.section_id) AS tests_total,
  (SELECT COUNT(*) FROM section_test_instances sti
   WHERE sti.coach_id = swi.coach_id AND sti.section_id = swi.section_id AND sti.status = 'Completed' AND sti.passed = true) AS tests_passed,
  (SELECT COUNT(*) FROM section_test_instances sti
   WHERE sti.coach_id = swi.coach_id AND sti.section_id = swi.section_id AND sti.status = 'Failed') AS tests_failed
FROM section_work_items swi
JOIN workshop_sections ws ON ws.id = swi.section_id
GROUP BY swi.coach_id, swi.section_id, ws.section_code, ws.name_hindi, ws.name_english, ws.section_type;


