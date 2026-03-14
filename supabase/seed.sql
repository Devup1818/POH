-- ============================================
-- Seed Data: Sheds & Checklist Templates
-- ============================================

-- 1. SHEDS
INSERT INTO sheds (shed_code, name, railway_zone) VALUES
  ('GZB-EMU', 'EMU Car Shed, Ghaziabad', 'Northern Railway'),
  ('VR-EMU', 'EMU Car Shed, Virar', 'Western Railway'),
  ('LKO-MEMU', 'MEMU Shed, Lucknow', 'Northern Railway')
ON CONFLICT (shed_code) DO NOTHING;

-- 2. CHECKLIST TEMPLATES — 1st POH
-- Bogie & Suspension
INSERT INTO checklist_templates (poh_type, item_code, description, category, rdso_smi_reference, is_mandatory, execution_order) VALUES
  ('1st POH', 'chk-1-001', 'Bogie frame inspection and crack detection (NDT)', 'Bogie & Suspension', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 4.1.1', true, 1),
  ('1st POH', 'chk-1-002', 'Primary suspension springs examination and replacement', 'Bogie & Suspension', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 4.1.2', true, 2),
  ('1st POH', 'chk-1-003', 'Secondary suspension coil springs and rubber pads check', 'Bogie & Suspension', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 4.1.3', true, 3),
  ('1st POH', 'chk-1-004', 'Axle box bearing examination and lubrication', 'Bogie & Suspension', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 4.1.4', true, 4)
ON CONFLICT (item_code) DO NOTHING;

-- Wheels & Axles
INSERT INTO checklist_templates (poh_type, item_code, description, category, rdso_smi_reference, is_mandatory, execution_order) VALUES
  ('1st POH', 'chk-1-005', 'Wheel profile measurement and re-profiling if required', 'Wheels & Axles', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 4.2.1', true, 5),
  ('1st POH', 'chk-1-006', 'Axle ultrasonic testing (UST) for cracks', 'Wheels & Axles', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 4.2.2', true, 6),
  ('1st POH', 'chk-1-007', 'Wheel disc crack detection by MPI', 'Wheels & Axles', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 4.2.3', true, 7)
ON CONFLICT (item_code) DO NOTHING;

-- Traction Motor
INSERT INTO checklist_templates (poh_type, item_code, description, category, rdso_smi_reference, is_mandatory, execution_order) VALUES
  ('1st POH', 'chk-1-008', 'Traction motor dismantling and complete inspection', 'Traction Motor', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 5.1.1', true, 8),
  ('1st POH', 'chk-1-009', 'Armature and field coil insulation resistance test', 'Traction Motor', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 5.1.2', true, 9),
  ('1st POH', 'chk-1-010', 'Commutator undercutting and surface grinding', 'Traction Motor', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 5.1.3', true, 10)
ON CONFLICT (item_code) DO NOTHING;

-- Brake System
INSERT INTO checklist_templates (poh_type, item_code, description, category, rdso_smi_reference, is_mandatory, execution_order) VALUES
  ('1st POH', 'chk-1-011', 'Brake cylinder overhaul and seal replacement', 'Brake System', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 6.1.1', true, 11),
  ('1st POH', 'chk-1-012', 'Distributor valve (DV) overhaul and testing', 'Brake System', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 6.1.2', true, 12),
  ('1st POH', 'chk-1-013', 'Brake block examination and replacement (MUST CHANGE)', 'Brake System', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 6.1.4', true, 13),
  ('1st POH', 'chk-1-014', 'Rubber/Neoprene items in brake cylinder replacement (MUST CHANGE)', 'Brake System', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 6.1.5', true, 14),
  ('1st POH', 'chk-1-015', 'Rubber items in EP valve replacement (MUST CHANGE)', 'Brake System', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 6.1.6', true, 15)
ON CONFLICT (item_code) DO NOTHING;

-- Pantograph
INSERT INTO checklist_templates (poh_type, item_code, description, category, rdso_smi_reference, is_mandatory, execution_order) VALUES
  ('1st POH', 'chk-1-016', 'Pantograph inspection and carbon strip check', 'Pantograph', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 7.1.1', true, 16),
  ('1st POH', 'chk-1-017', 'Pantograph spring tension and alignment verification', 'Pantograph', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 7.1.2', false, 17)
ON CONFLICT (item_code) DO NOTHING;

-- Couplers
INSERT INTO checklist_templates (poh_type, item_code, description, category, rdso_smi_reference, is_mandatory, execution_order) VALUES
  ('1st POH', 'chk-1-018', 'Coupler inspection and wear measurement', 'Couplers', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 8.1.1', true, 18),
  ('1st POH', 'chk-1-019', 'Coupler alignment and locking mechanism check', 'Couplers', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 8.1.2', false, 19)
ON CONFLICT (item_code) DO NOTHING;

-- Body Shell
INSERT INTO checklist_templates (poh_type, item_code, description, category, rdso_smi_reference, is_mandatory, execution_order) VALUES
  ('1st POH', 'chk-1-020', 'Body shell structural inspection and corrosion check', 'Body Shell', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 9.1.1', true, 20),
  ('1st POH', 'chk-1-021', 'Floor and roof panel inspection', 'Body Shell', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 9.1.2', false, 21)
ON CONFLICT (item_code) DO NOTHING;

-- Auxiliary Systems
INSERT INTO checklist_templates (poh_type, item_code, description, category, rdso_smi_reference, is_mandatory, execution_order) VALUES
  ('1st POH', 'chk-1-022', 'Air spring flexible hoses replacement (3-phase only, MUST CHANGE)', 'Auxiliary Systems', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 10.1.1', true, 22),
  ('1st POH', 'chk-1-023', 'Compressor inspection and performance test', 'Auxiliary Systems', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 10.1.2', true, 23)
ON CONFLICT (item_code) DO NOTHING;

-- Final Testing
INSERT INTO checklist_templates (poh_type, item_code, description, category, rdso_smi_reference, is_mandatory, execution_order) VALUES
  ('1st POH', 'chk-1-024', 'Electrical insulation resistance test (Megger test)', 'Final Testing', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 11.1.1', true, 24),
  ('1st POH', 'chk-1-025', 'Brake power test and brake percentage calculation', 'Final Testing', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 11.1.2', true, 25),
  ('1st POH', 'chk-1-026', 'Trial run on test track (minimum 50 km)', 'Final Testing', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 11.1.3', true, 26),
  ('1st POH', 'chk-1-027', 'Final inspection and clearance certificate', 'Final Testing', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 11.1.4', true, 27)
ON CONFLICT (item_code) DO NOTHING;

-- 3. CHECKLIST TEMPLATES — 2nd POH (includes all 1st POH items plus additional)
INSERT INTO checklist_templates (poh_type, item_code, description, category, rdso_smi_reference, is_mandatory, execution_order) VALUES
  ('2nd POH', 'chk-2-001', 'Bogie frame inspection and crack detection (NDT)', 'Bogie & Suspension', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 4.1.1', true, 1),
  ('2nd POH', 'chk-2-002', 'Primary suspension springs examination and replacement', 'Bogie & Suspension', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 4.1.2', true, 2),
  ('2nd POH', 'chk-2-003', 'Intermediate bogie overhaul', 'Bogie & Suspension', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 4.1.5', true, 3),
  ('2nd POH', 'chk-2-004', 'Wheel profile measurement and re-profiling', 'Wheels & Axles', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 4.2.1', true, 4),
  ('2nd POH', 'chk-2-005', 'Axle ultrasonic testing (UST) for cracks', 'Wheels & Axles', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 4.2.2', true, 5),
  ('2nd POH', 'chk-2-006', 'Traction motor intermediate servicing', 'Traction Motor', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 5.1.4', true, 6),
  ('2nd POH', 'chk-2-007', 'Brake system intermediate overhaul', 'Brake System', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 6.1.3', true, 7),
  ('2nd POH', 'chk-2-008', 'Brake block replacement (MUST CHANGE)', 'Brake System', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 6.1.4', true, 8),
  ('2nd POH', 'chk-2-009', 'Battery (120 AH VRLA) replacement - age/condition basis', 'Electrical System', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 5.2.1', true, 9),
  ('2nd POH', 'chk-2-010', 'Electrical system detailed inspection', 'Electrical System', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 5.2.2', true, 10),
  ('2nd POH', 'chk-2-011', 'Bio-toilet tank rubber gasket replacement', 'Auxiliary Systems', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 10.2.1', true, 11),
  ('2nd POH', 'chk-2-012', 'Air dryer rubber items and desiccant replacement', 'Auxiliary Systems', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 10.2.2', true, 12),
  ('2nd POH', 'chk-2-013', 'Body shell repairs', 'Body Shell', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 9.1.3', true, 13),
  ('2nd POH', 'chk-2-014', 'Electrical insulation resistance test (Megger test)', 'Final Testing', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 11.1.1', true, 14),
  ('2nd POH', 'chk-2-015', 'Brake power test and brake percentage calculation', 'Final Testing', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 11.1.2', true, 15),
  ('2nd POH', 'chk-2-016', 'Trial run on test track (minimum 50 km)', 'Final Testing', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 11.1.3', true, 16),
  ('2nd POH', 'chk-2-017', 'Final inspection and clearance certificate', 'Final Testing', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 11.1.4', true, 17)
ON CONFLICT (item_code) DO NOTHING;

-- 4. CHECKLIST TEMPLATES — 3rd POH
INSERT INTO checklist_templates (poh_type, item_code, description, category, rdso_smi_reference, is_mandatory, execution_order) VALUES
  ('3rd POH', 'chk-3-001', 'Advanced bogie overhaul', 'Bogie & Suspension', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 4.1.6', true, 1),
  ('3rd POH', 'chk-3-002', 'Wheel profile measurement and re-profiling', 'Wheels & Axles', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 4.2.1', true, 2),
  ('3rd POH', 'chk-3-003', 'Traction motor advanced servicing', 'Traction Motor', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 5.1.5', true, 3),
  ('3rd POH', 'chk-3-004', 'Brake system complete overhaul', 'Brake System', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 6.1.7', true, 4),
  ('3rd POH', 'chk-3-005', 'Brake block replacement (MUST CHANGE)', 'Brake System', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 6.1.4', true, 5),
  ('3rd POH', 'chk-3-006', 'ACP wire rope replacement (MANDATORY - 72 months)', 'Couplers', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 8.2.1', true, 6),
  ('3rd POH', 'chk-3-007', 'Carriage fans replacement (as per codal life)', 'Auxiliary Systems', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 10.3.1', true, 7),
  ('3rd POH', 'chk-3-008', 'Air spring rubber packing replacement (100%)', 'Bogie & Suspension', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 4.1.7', true, 8),
  ('3rd POH', 'chk-3-009', 'Electrical system comprehensive check', 'Electrical System', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 5.2.3', true, 9),
  ('3rd POH', 'chk-3-010', 'Body shell major repairs', 'Body Shell', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 9.1.4', true, 10),
  ('3rd POH', 'chk-3-011', 'Electrical insulation resistance test (Megger test)', 'Final Testing', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 11.1.1', true, 11),
  ('3rd POH', 'chk-3-012', 'Brake power test and brake percentage calculation', 'Final Testing', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 11.1.2', true, 12),
  ('3rd POH', 'chk-3-013', 'Trial run on test track (minimum 50 km)', 'Final Testing', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 11.1.3', true, 13),
  ('3rd POH', 'chk-3-014', 'Final inspection and clearance certificate', 'Final Testing', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 11.1.4', true, 14)
ON CONFLICT (item_code) DO NOTHING;

-- 5. CHECKLIST TEMPLATES — 4th POH
INSERT INTO checklist_templates (poh_type, item_code, description, category, rdso_smi_reference, is_mandatory, execution_order) VALUES
  ('4th POH', 'chk-4-001', 'Complete bogie overhaul and replacement', 'Bogie & Suspension', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 4.1.8', true, 1),
  ('4th POH', 'chk-4-002', 'Wheel profile measurement and re-profiling', 'Wheels & Axles', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 4.2.1', true, 2),
  ('4th POH', 'chk-4-003', 'Traction motor complete overhaul', 'Traction Motor', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 5.1.6', true, 3),
  ('4th POH', 'chk-4-004', 'Traction motor bearing replacement (MANDATORY)', 'Traction Motor', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 5.1.7', true, 4),
  ('4th POH', 'chk-4-005', 'TM rubber sandwich packing replacement', 'Traction Motor', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 5.1.8', true, 5),
  ('4th POH', 'chk-4-006', 'Brake system complete replacement', 'Brake System', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 6.1.8', true, 6),
  ('4th POH', 'chk-4-007', 'Brake block replacement (MUST CHANGE)', 'Brake System', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 6.1.4', true, 7),
  ('4th POH', 'chk-4-008', 'All shock absorbers replacement (100%)', 'Bogie & Suspension', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 4.1.9', true, 8),
  ('4th POH', 'chk-4-009', 'RMVU/AHU blower motor bearings replacement', 'Auxiliary Systems', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 10.4.1', true, 9),
  ('4th POH', 'chk-4-010', 'TCU/ACU blower fans replacement', 'Auxiliary Systems', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 10.4.2', true, 10),
  ('4th POH', 'chk-4-011', 'Pantograph consumables replacement (as per OEM manual)', 'Pantograph', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 7.2.1', true, 11),
  ('4th POH', 'chk-4-012', 'Electrical system complete overhaul', 'Electrical System', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 5.2.4', true, 12),
  ('4th POH', 'chk-4-013', 'Body shell complete refurbishment', 'Body Shell', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 9.1.5', true, 13),
  ('4th POH', 'chk-4-014', 'Electrical insulation resistance test (Megger test)', 'Final Testing', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 11.1.1', true, 14),
  ('4th POH', 'chk-4-015', 'Brake power test and brake percentage calculation', 'Final Testing', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 11.1.2', true, 15),
  ('4th POH', 'chk-4-016', 'Trial run on test track (minimum 50 km)', 'Final Testing', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 11.1.3', true, 16),
  ('4th POH', 'chk-4-017', 'Final inspection and clearance certificate', 'Final Testing', 'RDSO/PE/EMU/0038-2021 Rev.2 - Section 11.1.4', true, 17)
ON CONFLICT (item_code) DO NOTHING;

-- ============================================
-- Test User: Section_Engineer with GZB-EMU shed
-- ============================================
-- NOTE: The Supabase Auth user must be created first via the Supabase Dashboard:
--   1. Go to Authentication > Users > Add User
--   2. Email: engineer@poh.test
--   3. Password: Engineer@123
--   4. Auto-confirm: Yes
--
-- The SQL below auto-provisions the users row and shed assignment
-- by looking up the auth user UUID by email. If the auth user does
-- not exist yet, the block is safely skipped.

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'engineer@poh.test';
  IF v_user_id IS NOT NULL THEN
    INSERT INTO users (id, email, full_name, role)
    VALUES (v_user_id, 'engineer@poh.test', 'Suresh Patel', 'Section_Engineer')
    ON CONFLICT (id) DO UPDATE SET role = 'Section_Engineer', full_name = 'Suresh Patel';

    INSERT INTO user_shed_assignments (user_id, shed_id, is_primary)
    VALUES (v_user_id, (SELECT id FROM sheds WHERE shed_code = 'GZB-EMU'), true)
    ON CONFLICT (user_id, shed_id) DO NOTHING;
  END IF;
END $$;

-- ============================================
-- Test User: Senior_Section_Engineer (SSE) with GZB-EMU shed
-- ============================================
-- NOTE: The Supabase Auth user must be created first via the Supabase Dashboard:
--   1. Go to Authentication > Users > Add User
--   2. Email: vijay.saini@poh.test
--   3. Password: Vijay@123
--   4. Auto-confirm: Yes
--
-- The SQL below auto-provisions the users row and shed assignment
-- by looking up the auth user UUID by email. If the auth user does
-- not exist yet, the block is safely skipped.

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'vijay.saini@poh.test';
  IF v_user_id IS NOT NULL THEN
    INSERT INTO users (id, email, full_name, role)
    VALUES (v_user_id, 'vijay.saini@poh.test', 'Vijay Saini', 'Senior_Section_Engineer')
    ON CONFLICT (id) DO UPDATE SET role = 'Senior_Section_Engineer', full_name = 'Vijay Saini';

    INSERT INTO user_shed_assignments (user_id, shed_id, is_primary)
    VALUES (v_user_id, (SELECT id FROM sheds WHERE shed_code = 'GZB-EMU'), true)
    ON CONFLICT (user_id, shed_id) DO NOTHING;
  END IF;
END $$;
