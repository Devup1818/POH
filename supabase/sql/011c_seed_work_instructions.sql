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
