-- ============================================
-- Seed Rakes & Coaches (from mock-data.ts)
-- ============================================
-- Inserts 5 rakes with 52 coaches total across 3 sheds.
-- Uses shed_code lookups so UUIDs are resolved dynamically.
-- ============================================

-- Rake 1: GZB-EMU, 8 coaches, EMU, 1st POH (intake 5 days ago)
INSERT INTO rakes (rake_number, rake_type, poh_type, shed_id, total_coaches, status, intake_date)
SELECT 'GZB-EMU-2024-001', 'EMU', '1st POH', s.id, 8, 'Active', NOW() - INTERVAL '5 days'
FROM sheds s WHERE s.shed_code = 'GZB-EMU'
ON CONFLICT DO NOTHING;

-- Rake 2: GZB-EMU, 12 coaches, MEMU, 2nd POH (intake 12 days ago)
INSERT INTO rakes (rake_number, rake_type, poh_type, shed_id, total_coaches, status, intake_date)
SELECT 'GZB-MEMU-2024-002', 'MEMU', '2nd POH', s.id, 12, 'Active', NOW() - INTERVAL '12 days'
FROM sheds s WHERE s.shed_code = 'GZB-EMU'
ON CONFLICT DO NOTHING;

-- Rake 3: VR-EMU, 16 coaches, EMU, 3rd POH (intake 18 days ago)
INSERT INTO rakes (rake_number, rake_type, poh_type, shed_id, total_coaches, status, intake_date)
SELECT 'VR-EMU-2024-003', 'EMU', '3rd POH', s.id, 16, 'Active', NOW() - INTERVAL '18 days'
FROM sheds s WHERE s.shed_code = 'VR-EMU'
ON CONFLICT DO NOTHING;

-- Rake 4: VR-EMU, 10 coaches, MEMU, 1st POH (intake 2 days ago)
INSERT INTO rakes (rake_number, rake_type, poh_type, shed_id, total_coaches, status, intake_date)
SELECT 'VR-MEMU-2024-004', 'MEMU', '1st POH', s.id, 10, 'Active', NOW() - INTERVAL '2 days'
FROM sheds s WHERE s.shed_code = 'VR-EMU'
ON CONFLICT DO NOTHING;

-- Rake 5: LKO-MEMU, 6 coaches, EMU, 4th POH (intake 10 days ago)
INSERT INTO rakes (rake_number, rake_type, poh_type, shed_id, total_coaches, status, intake_date)
SELECT 'LKO-EMU-2024-005', 'EMU', '4th POH', s.id, 6, 'Active', NOW() - INTERVAL '10 days'
FROM sheds s WHERE s.shed_code = 'LKO-MEMU'
ON CONFLICT DO NOTHING;


-- ============================================
-- Coaches for Rake 1 (GZB-EMU-2024-001) - 8 coaches
-- ============================================
INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '100001', 'Dismantling', NOW() - INTERVAL '4 days'
FROM rakes r WHERE r.rake_number = 'GZB-EMU-2024-001'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '100002', 'Dismantling', NOW() - INTERVAL '4 days'
FROM rakes r WHERE r.rake_number = 'GZB-EMU-2024-001'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '100003', 'Inspection', NOW() - INTERVAL '2 days'
FROM rakes r WHERE r.rake_number = 'GZB-EMU-2024-001'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '100004', 'Intake', NOW() - INTERVAL '5 days'
FROM rakes r WHERE r.rake_number = 'GZB-EMU-2024-001'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '100005', 'Dismantling', NOW() - INTERVAL '4 days'
FROM rakes r WHERE r.rake_number = 'GZB-EMU-2024-001'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '100006', 'Intake', NOW() - INTERVAL '5 days'
FROM rakes r WHERE r.rake_number = 'GZB-EMU-2024-001'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '100007', 'Dismantling', NOW() - INTERVAL '3 days'
FROM rakes r WHERE r.rake_number = 'GZB-EMU-2024-001'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '100008', 'Inspection', NOW() - INTERVAL '2 days'
FROM rakes r WHERE r.rake_number = 'GZB-EMU-2024-001'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

-- ============================================
-- Coaches for Rake 2 (GZB-MEMU-2024-002) - 12 coaches
-- ============================================
INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '200001', 'Reassembly', NOW() - INTERVAL '3 days'
FROM rakes r WHERE r.rake_number = 'GZB-MEMU-2024-002'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '200002', 'Inspection', NOW() - INTERVAL '8 days'
FROM rakes r WHERE r.rake_number = 'GZB-MEMU-2024-002'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '200003', 'Reassembly', NOW() - INTERVAL '2 days'
FROM rakes r WHERE r.rake_number = 'GZB-MEMU-2024-002'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '200004', 'Finishing', NOW() - INTERVAL '1 day'
FROM rakes r WHERE r.rake_number = 'GZB-MEMU-2024-002'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '200005', 'Inspection', NOW() - INTERVAL '9 days'
FROM rakes r WHERE r.rake_number = 'GZB-MEMU-2024-002'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '200006', 'Reassembly', NOW() - INTERVAL '3 days'
FROM rakes r WHERE r.rake_number = 'GZB-MEMU-2024-002'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '200007', 'Inspection', NOW() - INTERVAL '7 days'
FROM rakes r WHERE r.rake_number = 'GZB-MEMU-2024-002'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '200008', 'Dismantling', NOW() - INTERVAL '11 days'
FROM rakes r WHERE r.rake_number = 'GZB-MEMU-2024-002'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '200009', 'Reassembly', NOW() - INTERVAL '3 days'
FROM rakes r WHERE r.rake_number = 'GZB-MEMU-2024-002'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '200010', 'Finishing', NOW() - INTERVAL '2 days'
FROM rakes r WHERE r.rake_number = 'GZB-MEMU-2024-002'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '200011', 'Inspection', NOW() - INTERVAL '9 days'
FROM rakes r WHERE r.rake_number = 'GZB-MEMU-2024-002'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '200012', 'Reassembly', NOW() - INTERVAL '3 days'
FROM rakes r WHERE r.rake_number = 'GZB-MEMU-2024-002'
ON CONFLICT (rake_id, coach_number) DO NOTHING;


-- ============================================
-- Coaches for Rake 3 (VR-EMU-2024-003) - 16 coaches, near completion
-- ============================================
INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '300001', 'Testing', NOW() - INTERVAL '1 day'
FROM rakes r WHERE r.rake_number = 'VR-EMU-2024-003'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '300002', 'Trial', NOW() - INTERVAL '1 day'
FROM rakes r WHERE r.rake_number = 'VR-EMU-2024-003'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '300003', 'Release', NOW() - INTERVAL '0 days'
FROM rakes r WHERE r.rake_number = 'VR-EMU-2024-003'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '300004', 'Testing', NOW() - INTERVAL '1 day'
FROM rakes r WHERE r.rake_number = 'VR-EMU-2024-003'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '300005', 'Finishing', NOW() - INTERVAL '5 days'
FROM rakes r WHERE r.rake_number = 'VR-EMU-2024-003'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '300006', 'Testing', NOW() - INTERVAL '2 days'
FROM rakes r WHERE r.rake_number = 'VR-EMU-2024-003'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '300007', 'Trial', NOW() - INTERVAL '1 day'
FROM rakes r WHERE r.rake_number = 'VR-EMU-2024-003'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '300008', 'Testing', NOW() - INTERVAL '2 days'
FROM rakes r WHERE r.rake_number = 'VR-EMU-2024-003'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '300009', 'Finishing', NOW() - INTERVAL '5 days'
FROM rakes r WHERE r.rake_number = 'VR-EMU-2024-003'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '300010', 'Testing', NOW() - INTERVAL '2 days'
FROM rakes r WHERE r.rake_number = 'VR-EMU-2024-003'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '300011', 'Trial', NOW() - INTERVAL '1 day'
FROM rakes r WHERE r.rake_number = 'VR-EMU-2024-003'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '300012', 'Release', NOW() - INTERVAL '0 days'
FROM rakes r WHERE r.rake_number = 'VR-EMU-2024-003'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '300013', 'Testing', NOW() - INTERVAL '2 days'
FROM rakes r WHERE r.rake_number = 'VR-EMU-2024-003'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '300014', 'Trial', NOW() - INTERVAL '1 day'
FROM rakes r WHERE r.rake_number = 'VR-EMU-2024-003'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '300015', 'Finishing', NOW() - INTERVAL '5 days'
FROM rakes r WHERE r.rake_number = 'VR-EMU-2024-003'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '300016', 'Testing', NOW() - INTERVAL '2 days'
FROM rakes r WHERE r.rake_number = 'VR-EMU-2024-003'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

-- ============================================
-- Coaches for Rake 4 (VR-MEMU-2024-004) - 10 coaches, just started
-- ============================================
INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '400001', 'Intake', NOW() - INTERVAL '2 days'
FROM rakes r WHERE r.rake_number = 'VR-MEMU-2024-004'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '400002', 'Intake', NOW() - INTERVAL '2 days'
FROM rakes r WHERE r.rake_number = 'VR-MEMU-2024-004'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '400003', 'Intake', NOW() - INTERVAL '2 days'
FROM rakes r WHERE r.rake_number = 'VR-MEMU-2024-004'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '400004', 'Intake', NOW() - INTERVAL '2 days'
FROM rakes r WHERE r.rake_number = 'VR-MEMU-2024-004'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '400005', 'Intake', NOW() - INTERVAL '2 days'
FROM rakes r WHERE r.rake_number = 'VR-MEMU-2024-004'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '400006', 'Intake', NOW() - INTERVAL '2 days'
FROM rakes r WHERE r.rake_number = 'VR-MEMU-2024-004'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '400007', 'Dismantling', NOW() - INTERVAL '1 day'
FROM rakes r WHERE r.rake_number = 'VR-MEMU-2024-004'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '400008', 'Dismantling', NOW() - INTERVAL '1 day'
FROM rakes r WHERE r.rake_number = 'VR-MEMU-2024-004'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '400009', 'Dismantling', NOW() - INTERVAL '1 day'
FROM rakes r WHERE r.rake_number = 'VR-MEMU-2024-004'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '400010', 'Dismantling', NOW() - INTERVAL '1 day'
FROM rakes r WHERE r.rake_number = 'VR-MEMU-2024-004'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

-- ============================================
-- Coaches for Rake 5 (LKO-EMU-2024-005) - 6 coaches, mixed progress
-- ============================================
INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '500001', 'Finishing', NOW() - INTERVAL '1 day'
FROM rakes r WHERE r.rake_number = 'LKO-EMU-2024-005'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '500002', 'Inspection', NOW() - INTERVAL '7 days'
FROM rakes r WHERE r.rake_number = 'LKO-EMU-2024-005'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '500003', 'Reassembly', NOW() - INTERVAL '1 day'
FROM rakes r WHERE r.rake_number = 'LKO-EMU-2024-005'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '500004', 'Dismantling', NOW() - INTERVAL '8 days'
FROM rakes r WHERE r.rake_number = 'LKO-EMU-2024-005'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '500005', 'Testing', NOW() - INTERVAL '1 day'
FROM rakes r WHERE r.rake_number = 'LKO-EMU-2024-005'
ON CONFLICT (rake_id, coach_number) DO NOTHING;

INSERT INTO coaches (rake_id, coach_number, current_stage, stage_start_date)
SELECT r.id, '500006', 'Inspection', NOW() - INTERVAL '5 days'
FROM rakes r WHERE r.rake_number = 'LKO-EMU-2024-005'
ON CONFLICT (rake_id, coach_number) DO NOTHING;
