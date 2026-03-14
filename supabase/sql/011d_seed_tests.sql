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
