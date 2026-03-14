-- ============================================
-- Job Card Section Analysis: Template/Master Tables
-- ============================================
-- Requirements: 1.1, 1.2, 12.1, 13.1, 14.1
--
-- Tables created:
--   1. workshop_sections — 10 fixed workshop sections (master)
--   2. work_instructions — WI templates per section
--   3. wi_coach_type_applicability — WI ↔ Coach Type mapping
--   4. must_change_item_templates — POH cycle-based must change items
--   5. section_test_templates — Section-specific test definitions
--
-- Instance tables (section_work_items, etc.) are in a separate migration.
-- ============================================

-- ============================================
-- 1. workshop_sections
-- ============================================
CREATE TABLE IF NOT EXISTS workshop_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_code VARCHAR(20) UNIQUE NOT NULL CHECK (
    section_code IN ('M5', 'M6', 'M8', 'E2', 'E3', 'E5', 'M2', 'M3', 'Painting', 'M4')
  ),
  name_hindi VARCHAR(200) NOT NULL,
  name_english VARCHAR(200) NOT NULL,
  description TEXT,
  section_type VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (
    section_type IN ('standard', 'placeholder', 'coordination')
  ),
  display_order INT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ws_code ON workshop_sections(section_code);
CREATE INDEX IF NOT EXISTS idx_ws_order ON workshop_sections(display_order);

-- ============================================
-- 2. work_instructions
-- ============================================
CREATE TABLE IF NOT EXISTS work_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES workshop_sections(id) ON DELETE CASCADE,
  wi_number VARCHAR(20) NOT NULL,
  version_number VARCHAR(10) NOT NULL DEFAULT '01',
  rake_type VARCHAR(30) NOT NULL CHECK (
    rake_type IN ('Conventional', '3-Phase')
  ),
  scope_description TEXT,
  is_placeholder BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wi_number, version_number, rake_type)
);

CREATE INDEX IF NOT EXISTS idx_wi_section ON work_instructions(section_id);
CREATE INDEX IF NOT EXISTS idx_wi_rake_type ON work_instructions(rake_type);

-- ============================================
-- 3. wi_coach_type_applicability
-- ============================================
CREATE TABLE IF NOT EXISTS wi_coach_type_applicability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wi_id UUID NOT NULL REFERENCES work_instructions(id) ON DELETE CASCADE,
  coach_type VARCHAR(10) NOT NULL CHECK (
    coach_type IN ('MC', 'TC', 'DTC', 'DMC', 'NDTC')
  ),
  UNIQUE(wi_id, coach_type)
);

CREATE INDEX IF NOT EXISTS idx_wica_wi ON wi_coach_type_applicability(wi_id);
CREATE INDEX IF NOT EXISTS idx_wica_coach_type ON wi_coach_type_applicability(coach_type);

-- ============================================
-- 4. must_change_item_templates
-- ============================================
CREATE TABLE IF NOT EXISTS must_change_item_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES workshop_sections(id) ON DELETE CASCADE,
  item_name VARCHAR(200) NOT NULL,
  poh_cycle VARCHAR(10) NOT NULL CHECK (
    poh_cycle IN ('1st POH', '2nd POH', '3rd POH', '4th POH')
  ),
  rake_type VARCHAR(30) NOT NULL CHECK (
    rake_type IN ('Conventional', '3-Phase')
  ),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(section_id, item_name, poh_cycle, rake_type)
);

CREATE INDEX IF NOT EXISTS idx_mci_section ON must_change_item_templates(section_id);
CREATE INDEX IF NOT EXISTS idx_mci_cycle ON must_change_item_templates(poh_cycle);

-- ============================================
-- 5. section_test_templates
-- ============================================
CREATE TABLE IF NOT EXISTS section_test_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES workshop_sections(id) ON DELETE CASCADE,
  test_name VARCHAR(200) NOT NULL,
  test_description TEXT,
  rake_type VARCHAR(30) CHECK (
    rake_type IN ('Conventional', '3-Phase')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(section_id, test_name, rake_type)
);

CREATE INDEX IF NOT EXISTS idx_stt_section ON section_test_templates(section_id);

-- ============================================
-- Job Card Section Analysis: Instance Tables
-- ============================================
-- Requirements: 1.3, 11.5, 13.2, 13.4, 14.3
--
-- Tables created:
--   1. section_work_items — Coach-specific work item instances
--   2. must_change_item_instances — Coach-specific must change item tracking
--   3. section_test_instances — Coach-specific test results
--   4. m4_coordination_entries — M4 support/coordination tracking
-- ============================================

-- ============================================
-- 6. section_work_items
-- ============================================
CREATE TABLE IF NOT EXISTS section_work_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES workshop_sections(id) ON DELETE RESTRICT,
  wi_id UUID NOT NULL REFERENCES work_instructions(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'Not Started' CHECK (
    status IN ('Not Started', 'In Progress', 'Completed')
  ),
  completion_date TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coach_id, wi_id)
);
CREATE INDEX IF NOT EXISTS idx_swi_coach ON section_work_items(coach_id);
CREATE INDEX IF NOT EXISTS idx_swi_section ON section_work_items(section_id);
CREATE INDEX IF NOT EXISTS idx_swi_status ON section_work_items(status);
CREATE INDEX IF NOT EXISTS idx_swi_coach_section ON section_work_items(coach_id, section_id);

-- ============================================
-- 7. must_change_item_instances
-- ============================================
CREATE TABLE IF NOT EXISTS must_change_item_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES must_change_item_templates(id) ON DELETE RESTRICT,
  section_id UUID NOT NULL REFERENCES workshop_sections(id) ON DELETE RESTRICT,
  is_replaced BOOLEAN NOT NULL DEFAULT false,
  old_part_detail VARCHAR(500),
  new_part_detail VARCHAR(500),
  replaced_at TIMESTAMPTZ,
  replaced_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coach_id, template_id)
);
CREATE INDEX IF NOT EXISTS idx_mcii_coach ON must_change_item_instances(coach_id);
CREATE INDEX IF NOT EXISTS idx_mcii_section ON must_change_item_instances(section_id);
CREATE INDEX IF NOT EXISTS idx_mcii_replaced ON must_change_item_instances(is_replaced);
CREATE INDEX IF NOT EXISTS idx_mcii_coach_section ON must_change_item_instances(coach_id, section_id);

-- ============================================
-- 8. section_test_instances
-- ============================================
CREATE TABLE IF NOT EXISTS section_test_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES section_test_templates(id) ON DELETE RESTRICT,
  section_id UUID NOT NULL REFERENCES workshop_sections(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'Not Started' CHECK (
    status IN ('Not Started', 'In Progress', 'Completed', 'Failed')
  ),
  measured_values TEXT,
  passed BOOLEAN,
  tested_at TIMESTAMPTZ,
  tested_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coach_id, template_id)
);
CREATE INDEX IF NOT EXISTS idx_sti_coach ON section_test_instances(coach_id);
CREATE INDEX IF NOT EXISTS idx_sti_section ON section_test_instances(section_id);
CREATE INDEX IF NOT EXISTS idx_sti_status ON section_test_instances(status);
CREATE INDEX IF NOT EXISTS idx_sti_coach_section ON section_test_instances(coach_id, section_id);

-- ============================================
-- 9. m4_coordination_entries
-- ============================================
CREATE TABLE IF NOT EXISTS m4_coordination_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES workshop_sections(id) ON DELETE RESTRICT,
  supported_section_id UUID NOT NULL REFERENCES workshop_sections(id) ON DELETE RESTRICT,
  activity_type VARCHAR(50) NOT NULL CHECK (
    activity_type IN ('Lifting', 'Lowering', 'Shifting', 'Crane Operation', 'Other')
  ),
  status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (
    status IN ('Pending', 'In Progress', 'Completed')
  ),
  notes TEXT,
  logged_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_m4ce_coach ON m4_coordination_entries(coach_id);
CREATE INDEX IF NOT EXISTS idx_m4ce_supported ON m4_coordination_entries(supported_section_id);
CREATE INDEX IF NOT EXISTS idx_m4ce_status ON m4_coordination_entries(status);

-- ============================================
-- SEED DATA: Workshop Sections, Work Instructions,
-- Coach Type Applicability, and Section Test Templates
-- ============================================
-- Requirements: 1.1, 1.4, 2.1-2.6, 3.1-3.6, 4.1-4.6, 5.1-5.6,
--               6.1-6.6, 7.1-7.6, 8.1-8.6, 9.1-9.6, 10.1-10.5,
--               11.1-11.3, 14.1
-- ============================================

-- ============================================
-- 10. Seed: workshop_sections (10 rows)
-- ============================================
INSERT INTO workshop_sections (section_code, name_hindi, name_english, description, section_type, display_order) VALUES
('M2', 'फर्निशिंग और बॉडी सेक्शन', 'Furnishing & Body Section', 'Body repair, furnishing, seat, window, door, flooring, roof', 'standard', 1),
('M3', 'पैंटोग्राफ और स्पीडोमीटर सेक्शन', 'Pantograph & Speedometer Section', 'Pantograph overhaul, speedometer, speed recorder, carbon strip', 'standard', 2),
('M4', 'M&P / मशीनरी सेक्शन', 'M&P / Machinery Section', 'Lifting jack, crane, M&P equipment coordination, support to all sections', 'coordination', 3),
('M5', 'ब्रेक/न्यूमैटिक सेक्शन', 'Brake/Pneumatic Section', 'Brake system, pneumatic equipment, distributor valve, brake cylinder, slack adjuster, air dryer, MU valve, angle cock, hose pipe', 'standard', 4),
('M6', 'बोगी और मैकेनिकल सेक्शन', 'Bogie & Mechanical Section', 'Bogie overhaul, bolster spring, axle box, center pivot, side bearer, wheel set, axle, bearing', 'standard', 5),
('M8', 'कम्प्रेसर सेक्शन', 'Compressor Section', 'Compressor overhaul, motor overhaul, unloader valve, safety valve, NRV', 'standard', 6),
('Painting', 'पेंटिंग सेक्शन', 'Painting Section', 'Surface preparation, primer, putty, final coat, livery marking', 'placeholder', 7),
('E2', 'HT इलेक्ट्रिकल सेक्शन', 'HT Electrical Section', 'HT equipment, transformer, tap changer, HT cable, circuit breaker, lightning arrester', 'standard', 8),
('E3', 'ट्रैक्शन मोटर सेक्शन', 'Traction Motor Section', 'Traction motor overhaul, armature, field coil, brush gear, bearing, gear case', 'standard', 9),
('E5', 'ट्रेन लाइटिंग और LT इलेक्ट्रिकल सेक्शन', 'Train Lighting & LT Electrical Section', 'Train lighting, battery, charger, LT wiring, fan, destination board, PA system, CCTV', 'standard', 10)
ON CONFLICT (section_code) DO NOTHING;

-- ============================================
-- 11. Seed: work_instructions + wi_coach_type_applicability
-- ============================================
-- Uses DO $$ block with variables to reference section IDs.
-- Each section gets Conventional AND 3-Phase WI variants.
-- Coach type applicability per design matrix.
-- M4 (coordination) has no WIs.
-- Painting WIs are placeholders (is_placeholder=true).
-- ============================================

DO $$
DECLARE
  v_m2_id UUID; v_m3_id UUID; v_m4_id UUID; v_m5_id UUID; v_m6_id UUID;
  v_m8_id UUID; v_painting_id UUID; v_e2_id UUID; v_e3_id UUID; v_e5_id UUID;
  v_wi_id UUID;
BEGIN
  SELECT id INTO v_m2_id FROM workshop_sections WHERE section_code = 'M2';
  SELECT id INTO v_m3_id FROM workshop_sections WHERE section_code = 'M3';
  SELECT id INTO v_m4_id FROM workshop_sections WHERE section_code = 'M4';
  SELECT id INTO v_m5_id FROM workshop_sections WHERE section_code = 'M5';
  SELECT id INTO v_m6_id FROM workshop_sections WHERE section_code = 'M6';
  SELECT id INTO v_m8_id FROM workshop_sections WHERE section_code = 'M8';
  SELECT id INTO v_painting_id FROM workshop_sections WHERE section_code = 'Painting';
  SELECT id INTO v_e2_id FROM workshop_sections WHERE section_code = 'E2';
  SELECT id INTO v_e3_id FROM workshop_sections WHERE section_code = 'E3';
  SELECT id INTO v_e5_id FROM workshop_sections WHERE section_code = 'E5';

  -- ========== M2: Furnishing & Body Section ==========
  -- Conventional: W/M2/01, W/M2/02 — Coach Types: MC, TC, DTC, DMC, NDTC
  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_m2_id, 'W/M2/01', '01', 'Conventional', 'Body repair and furnishing work instruction 01')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC'), (v_wi_id, 'NDTC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_m2_id, 'W/M2/02', '01', 'Conventional', 'Body repair and furnishing work instruction 02')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC'), (v_wi_id, 'NDTC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  -- 3-Phase: W/M2/01, W/M2/02 — Coach Types: MC, TC, DTC, DMC, NDTC
  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_m2_id, 'W/M2/01', '01', '3-Phase', 'Body repair and furnishing work instruction 01 (3-Phase)')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC'), (v_wi_id, 'NDTC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_m2_id, 'W/M2/02', '01', '3-Phase', 'Body repair and furnishing work instruction 02 (3-Phase)')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC'), (v_wi_id, 'NDTC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  -- ========== M3: Pantograph & Speedometer Section ==========
  -- W/M3/07 (pantograph): MC, DMC only
  -- W/M3/08 (speedometer): all coach types
  -- Conventional variants
  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_m3_id, 'W/M3/07', '01', 'Conventional', 'Pantograph overhaul work instruction')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'DMC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_m3_id, 'W/M3/08', '01', 'Conventional', 'Speedometer and speed recorder work instruction')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC'), (v_wi_id, 'NDTC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  -- 3-Phase variants
  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_m3_id, 'W/M3/07', '01', '3-Phase', 'Pantograph overhaul work instruction (3-Phase)')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'DMC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_m3_id, 'W/M3/08', '01', '3-Phase', 'Speedometer and speed recorder work instruction (3-Phase)')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC'), (v_wi_id, 'NDTC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  -- ========== M5: Brake/Pneumatic Section ==========
  -- W/M5/01 through W/M5/05 — Coach Types: MC, TC, DTC, DMC, NDTC
  -- Conventional variants
  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_m5_id, 'W/M5/01', '01', 'Conventional', 'Brake system overhaul work instruction 01')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC'), (v_wi_id, 'NDTC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_m5_id, 'W/M5/02', '01', 'Conventional', 'Pneumatic equipment overhaul work instruction 02')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC'), (v_wi_id, 'NDTC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_m5_id, 'W/M5/03', '01', 'Conventional', 'Distributor valve and brake cylinder work instruction 03')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC'), (v_wi_id, 'NDTC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_m5_id, 'W/M5/04', '01', 'Conventional', 'Slack adjuster and air dryer work instruction 04')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC'), (v_wi_id, 'NDTC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_m5_id, 'W/M5/05', '01', 'Conventional', 'MU valve, angle cock, hose pipe work instruction 05')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC'), (v_wi_id, 'NDTC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  -- 3-Phase variants
  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_m5_id, 'W/M5/01', '01', '3-Phase', 'Brake system overhaul work instruction 01 (3-Phase)')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC'), (v_wi_id, 'NDTC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_m5_id, 'W/M5/02', '01', '3-Phase', 'Pneumatic equipment overhaul work instruction 02 (3-Phase)')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC'), (v_wi_id, 'NDTC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_m5_id, 'W/M5/03', '01', '3-Phase', 'Distributor valve and brake cylinder work instruction 03 (3-Phase)')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC'), (v_wi_id, 'NDTC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_m5_id, 'W/M5/04', '01', '3-Phase', 'Slack adjuster and air dryer work instruction 04 (3-Phase)')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC'), (v_wi_id, 'NDTC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_m5_id, 'W/M5/05', '01', '3-Phase', 'MU valve, angle cock, hose pipe work instruction 05 (3-Phase)')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC'), (v_wi_id, 'NDTC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  -- ========== M6: Bogie & Mechanical Section ==========
  -- W/M6/01, W/M6/02 — Coach Types: MC, TC, DTC, DMC, NDTC
  -- Conventional variants
  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_m6_id, 'W/M6/01', '01', 'Conventional', 'Bogie overhaul work instruction 01')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC'), (v_wi_id, 'NDTC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_m6_id, 'W/M6/02', '01', 'Conventional', 'Wheel set and bearing work instruction 02')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC'), (v_wi_id, 'NDTC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  -- 3-Phase variants
  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_m6_id, 'W/M6/01', '01', '3-Phase', 'Bogie overhaul work instruction 01 (3-Phase)')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC'), (v_wi_id, 'NDTC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_m6_id, 'W/M6/02', '01', '3-Phase', 'Wheel set and bearing work instruction 02 (3-Phase)')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC'), (v_wi_id, 'NDTC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  -- ========== M8: Compressor Section ==========
  -- W/M8/01, W/M8/02 — Coach Types: MC only
  -- Conventional variants
  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_m8_id, 'W/M8/01', '01', 'Conventional', 'Compressor overhaul work instruction 01')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES (v_wi_id, 'MC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_m8_id, 'W/M8/02', '01', 'Conventional', 'Motor overhaul and valve work instruction 02')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES (v_wi_id, 'MC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  -- 3-Phase variants
  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_m8_id, 'W/M8/01', '01', '3-Phase', 'Compressor overhaul work instruction 01 (3-Phase)')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES (v_wi_id, 'MC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_m8_id, 'W/M8/02', '01', '3-Phase', 'Motor overhaul and valve work instruction 02 (3-Phase)')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES (v_wi_id, 'MC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  -- ========== E2: HT Electrical Section ==========
  -- W/E2/05, W/E2/06 — Coach Types: MC, TC, DTC, DMC (no NDTC)
  -- Conventional variants
  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_e2_id, 'W/E2/05', '01', 'Conventional', 'HT equipment and transformer work instruction 05')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_e2_id, 'W/E2/06', '01', 'Conventional', 'Circuit breaker and lightning arrester work instruction 06')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  -- 3-Phase variants
  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_e2_id, 'W/E2/05', '01', '3-Phase', 'HT equipment and transformer work instruction 05 (3-Phase)')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_e2_id, 'W/E2/06', '01', '3-Phase', 'Circuit breaker and lightning arrester work instruction 06 (3-Phase)')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  -- ========== E3: Traction Motor Section ==========
  -- W/E3/05, W/E3/06 — Coach Types: MC, DMC only
  -- Conventional variants
  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_e3_id, 'W/E3/05', '01', 'Conventional', 'Traction motor overhaul work instruction 05')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'DMC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_e3_id, 'W/E3/06', '01', 'Conventional', 'Armature and field coil work instruction 06')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'DMC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  -- 3-Phase variants
  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_e3_id, 'W/E3/05', '01', '3-Phase', 'Traction motor overhaul work instruction 05 (3-Phase)')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'DMC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_e3_id, 'W/E3/06', '01', '3-Phase', 'Armature and field coil work instruction 06 (3-Phase)')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'DMC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  -- ========== E5: Train Lighting & LT Electrical Section ==========
  -- W/E5/05, W/E5/06 — Coach Types: MC, TC, DTC, DMC, NDTC
  -- Conventional variants
  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_e5_id, 'W/E5/05', '01', 'Conventional', 'Train lighting and battery work instruction 05')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC'), (v_wi_id, 'NDTC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_e5_id, 'W/E5/06', '01', 'Conventional', 'LT wiring, fan, PA system work instruction 06')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC'), (v_wi_id, 'NDTC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  -- 3-Phase variants
  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_e5_id, 'W/E5/05', '01', '3-Phase', 'Train lighting and battery work instruction 05 (3-Phase)')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC'), (v_wi_id, 'NDTC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description)
  VALUES (v_e5_id, 'W/E5/06', '01', '3-Phase', 'LT wiring, fan, PA system work instruction 06 (3-Phase)')
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC'), (v_wi_id, 'NDTC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  -- ========== Painting: Painting Section ==========
  -- W/PT/01 (placeholder) — Coach Types: MC, TC, DTC, DMC, NDTC — is_placeholder=true
  -- Conventional variant
  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description, is_placeholder)
  VALUES (v_painting_id, 'W/PT/01', '01', 'Conventional', 'Painting section placeholder work instruction', true)
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC'), (v_wi_id, 'NDTC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  -- 3-Phase variant
  INSERT INTO work_instructions (section_id, wi_number, version_number, rake_type, scope_description, is_placeholder)
  VALUES (v_painting_id, 'W/PT/01', '01', '3-Phase', 'Painting section placeholder work instruction (3-Phase)', true)
  ON CONFLICT (wi_number, version_number, rake_type) DO NOTHING
  RETURNING id INTO v_wi_id;
  IF v_wi_id IS NOT NULL THEN
    INSERT INTO wi_coach_type_applicability (wi_id, coach_type) VALUES
      (v_wi_id, 'MC'), (v_wi_id, 'TC'), (v_wi_id, 'DTC'), (v_wi_id, 'DMC'), (v_wi_id, 'NDTC')
    ON CONFLICT (wi_id, coach_type) DO NOTHING;
  END IF;

  -- ========== M4: M&P / Machinery Section ==========
  -- No WIs (coordination section) — M4 has no independent work items

END $$;

-- ============================================
-- 12. Seed: section_test_templates
-- ============================================
-- Per Requirement 14.1: Section-specific testing formats.
-- rake_type = NULL means applicable to both Conventional and 3-Phase.
-- M4 has no tests (coordination section).
-- ============================================

DO $$
DECLARE
  v_m2_id UUID; v_m3_id UUID; v_m5_id UUID; v_m6_id UUID;
  v_m8_id UUID; v_painting_id UUID; v_e2_id UUID; v_e3_id UUID; v_e5_id UUID;
BEGIN
  SELECT id INTO v_m2_id FROM workshop_sections WHERE section_code = 'M2';
  SELECT id INTO v_m3_id FROM workshop_sections WHERE section_code = 'M3';
  SELECT id INTO v_m5_id FROM workshop_sections WHERE section_code = 'M5';
  SELECT id INTO v_m6_id FROM workshop_sections WHERE section_code = 'M6';
  SELECT id INTO v_m8_id FROM workshop_sections WHERE section_code = 'M8';
  SELECT id INTO v_painting_id FROM workshop_sections WHERE section_code = 'Painting';
  SELECT id INTO v_e2_id FROM workshop_sections WHERE section_code = 'E2';
  SELECT id INTO v_e3_id FROM workshop_sections WHERE section_code = 'E3';
  SELECT id INTO v_e5_id FROM workshop_sections WHERE section_code = 'E5';

  -- M5: brake continuity test, leakage test, BP pressure test, FP pressure test
  INSERT INTO section_test_templates (section_id, test_name, test_description, rake_type) VALUES
    (v_m5_id, 'Brake Continuity Test', 'Verify brake continuity across all coaches', NULL),
    (v_m5_id, 'Leakage Test', 'Check for pneumatic system leakage', NULL),
    (v_m5_id, 'BP Pressure Test', 'Brake pipe pressure measurement and validation', NULL),
    (v_m5_id, 'FP Pressure Test', 'Feed pipe pressure measurement and validation', NULL)
  ON CONFLICT (section_id, test_name, rake_type) DO NOTHING;

  -- M6: bogie dimension check, wheel profile measurement
  INSERT INTO section_test_templates (section_id, test_name, test_description, rake_type) VALUES
    (v_m6_id, 'Bogie Dimension Check', 'Verify bogie dimensions are within tolerance', NULL),
    (v_m6_id, 'Wheel Profile Measurement', 'Measure wheel profile and flange dimensions', NULL)
  ON CONFLICT (section_id, test_name, rake_type) DO NOTHING;

  -- M8: compressor output test, pressure build-up time test
  INSERT INTO section_test_templates (section_id, test_name, test_description, rake_type) VALUES
    (v_m8_id, 'Compressor Output Test', 'Verify compressor output pressure and flow rate', NULL),
    (v_m8_id, 'Pressure Build-Up Time Test', 'Measure time to reach operating pressure', NULL)
  ON CONFLICT (section_id, test_name, rake_type) DO NOTHING;

  -- E2: HT insulation test, megger test, HV test
  INSERT INTO section_test_templates (section_id, test_name, test_description, rake_type) VALUES
    (v_e2_id, 'HT Insulation Test', 'High tension insulation resistance measurement', NULL),
    (v_e2_id, 'Megger Test', 'Megger test for HT equipment insulation', NULL),
    (v_e2_id, 'HV Test', 'High voltage withstand test', NULL)
  ON CONFLICT (section_id, test_name, rake_type) DO NOTHING;

  -- E3: no-load test, insulation resistance test
  INSERT INTO section_test_templates (section_id, test_name, test_description, rake_type) VALUES
    (v_e3_id, 'No-Load Test', 'Traction motor no-load current and speed test', NULL),
    (v_e3_id, 'Insulation Resistance Test', 'Traction motor insulation resistance measurement', NULL)
  ON CONFLICT (section_id, test_name, rake_type) DO NOTHING;

  -- E5: battery capacity test, insulation test, lighting lux test
  INSERT INTO section_test_templates (section_id, test_name, test_description, rake_type) VALUES
    (v_e5_id, 'Battery Capacity Test', 'Battery capacity and discharge rate test', NULL),
    (v_e5_id, 'Insulation Test', 'LT wiring insulation resistance test', NULL),
    (v_e5_id, 'Lighting Lux Test', 'Lighting intensity measurement in lux', NULL)
  ON CONFLICT (section_id, test_name, rake_type) DO NOTHING;

  -- M2: door operation test, window fitment check
  INSERT INTO section_test_templates (section_id, test_name, test_description, rake_type) VALUES
    (v_m2_id, 'Door Operation Test', 'Verify door opening, closing, and locking mechanism', NULL),
    (v_m2_id, 'Window Fitment Check', 'Check window fitment, sealing, and operation', NULL)
  ON CONFLICT (section_id, test_name, rake_type) DO NOTHING;

  -- M3: pantograph rise/lower test, contact pressure test
  INSERT INTO section_test_templates (section_id, test_name, test_description, rake_type) VALUES
    (v_m3_id, 'Pantograph Rise/Lower Test', 'Verify pantograph rise and lower operation and timing', NULL),
    (v_m3_id, 'Contact Pressure Test', 'Measure pantograph contact strip pressure', NULL)
  ON CONFLICT (section_id, test_name, rake_type) DO NOTHING;

  -- Painting: paint thickness measurement, surface finish inspection
  INSERT INTO section_test_templates (section_id, test_name, test_description, rake_type) VALUES
    (v_painting_id, 'Paint Thickness Measurement', 'Measure paint film thickness using DFT gauge', NULL),
    (v_painting_id, 'Surface Finish Inspection', 'Visual and tactile inspection of surface finish quality', NULL)
  ON CONFLICT (section_id, test_name, rake_type) DO NOTHING;

  -- M4: No tests (coordination section)

END $$;

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
