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
