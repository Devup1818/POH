-- ============================================
-- Seed: must_change_item_templates
-- ============================================
-- Complete must-change items from RDSO SMI RDSO/PE/EMU/0038-2021 (Rev.2)
-- EMU Car Shed, Northern Railway, Ghaziabad
--
-- Two lists:
--   1. Conventional EMU/MEMU must-change items
--   2. 3-Phase EMU/MEMU must-change items
--
-- poh_cycle: '1st POH','2nd POH','3rd POH','4th POH'
-- The generate_job_card function matches on exact poh_cycle,
-- so items applicable "Every POH" are inserted for all 4 cycles.
-- Items "Every 2nd POH" → 2nd + 4th cycles.
-- Items "Every 3rd POH" → 3rd cycle only.
-- Items "Every 4th POH" → 4th cycle only.
-- ============================================

DO $
DECLARE
  v_m2  UUID; v_m3  UUID; v_m5  UUID; v_m6  UUID;
  v_m8  UUID; v_e2  UUID; v_e3  UUID; v_e5  UUID;
BEGIN
  SELECT id INTO v_m2 FROM workshop_sections WHERE section_code = 'M2';
  SELECT id INTO v_m3 FROM workshop_sections WHERE section_code = 'M3';
  SELECT id INTO v_m5 FROM workshop_sections WHERE section_code = 'M5';
  SELECT id INTO v_m6 FROM workshop_sections WHERE section_code = 'M6';
  SELECT id INTO v_m8 FROM workshop_sections WHERE section_code = 'M8';
  SELECT id INTO v_e2 FROM workshop_sections WHERE section_code = 'E2';
  SELECT id INTO v_e3 FROM workshop_sections WHERE section_code = 'E3';
  SELECT id INTO v_e5 FROM workshop_sections WHERE section_code = 'E5';

-- ================================================================
-- CONVENTIONAL EMU/MEMU — Must Change Items
-- ================================================================

-- ---- E3: Traction Motor Section (Conventional) ----
-- 1. AUXILIARY MOTOR items → E3
  -- 1.1 Needle bearing for MCP — Every 4th POH
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_e3, 'Needle Bearing for MCP (Aux Motor)', '4th POH', 'Conventional', 'Needle bearing for master controller pilot auxiliary motor')
  ON CONFLICT DO NOTHING;
  -- 1.2 Oil sealing ring for Oil pump — Every 4th POH
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_e3, 'Oil Sealing Ring - Oil Pump', '4th POH', 'Conventional', 'Oil sealing ring for oil pump')
  ON CONFLICT DO NOTHING;
  -- 1.3 Bearings for Compressor motor, Aux comp motor, Oil pump, Radiator fan, Rectifier fan — Every 4th POH
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_e3, 'Bearings - Aux Motors (Comp/Oil/Radiator/Rectifier)', '4th POH', 'Conventional', 'Bearings for compressor motor, aux comp motor, oil pump, radiator cooling fan motor and rectifier fan motor')
  ON CONFLICT DO NOTHING;
  -- 1.4 Capacitors for AC motors — Every 4th POH
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_e3, 'Capacitors for AC Motors', '4th POH', 'Conventional', 'Capacitors for AC motors')
  ON CONFLICT DO NOTHING;

-- ---- M6: Bogie & Mechanical Section (Conventional) ----
-- 2. COUPLER items → M6
  -- 2.1 Polyamide bush — Every POH
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m6, 'Polyamide Bush for Coupler', '1st POH', 'Conventional', 'Polyamide bush for coupler'),
    (v_m6, 'Polyamide Bush for Coupler', '2nd POH', 'Conventional', 'Polyamide bush for coupler'),
    (v_m6, 'Polyamide Bush for Coupler', '3rd POH', 'Conventional', 'Polyamide bush for coupler'),
    (v_m6, 'Polyamide Bush for Coupler', '4th POH', 'Conventional', 'Polyamide bush for coupler')
  ON CONFLICT DO NOTHING;
  -- 2.2 Sliding plate — Every POH
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m6, 'Sliding Plate for Coupler', '1st POH', 'Conventional', 'Sliding plate for coupler'),
    (v_m6, 'Sliding Plate for Coupler', '2nd POH', 'Conventional', 'Sliding plate for coupler'),
    (v_m6, 'Sliding Plate for Coupler', '3rd POH', 'Conventional', 'Sliding plate for coupler'),
    (v_m6, 'Sliding Plate for Coupler', '4th POH', 'Conventional', 'Sliding plate for coupler')
  ON CONFLICT DO NOTHING;

-- 3. BOGIE items → M6
  -- 3.1-3.10 Bogie rubber/nylon/bush items — Every POH
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m6, 'Rubber Snubber for Axle Box', '1st POH', 'Conventional', 'Rubber snubber for axle box'),
    (v_m6, 'Rubber Snubber for Axle Box', '2nd POH', 'Conventional', 'Rubber snubber for axle box'),
    (v_m6, 'Rubber Snubber for Axle Box', '3rd POH', 'Conventional', 'Rubber snubber for axle box'),
    (v_m6, 'Rubber Snubber for Axle Box', '4th POH', 'Conventional', 'Rubber snubber for axle box'),
    (v_m6, 'Rubber Packing Ring - Axle Guide', '1st POH', 'Conventional', 'Rubber packing ring for axle guide'),
    (v_m6, 'Rubber Packing Ring - Axle Guide', '2nd POH', 'Conventional', 'Rubber packing ring for axle guide'),
    (v_m6, 'Rubber Packing Ring - Axle Guide', '3rd POH', 'Conventional', 'Rubber packing ring for axle guide'),
    (v_m6, 'Rubber Packing Ring - Axle Guide', '4th POH', 'Conventional', 'Rubber packing ring for axle guide'),
    (v_m6, 'Nylon Rubbing Plate', '1st POH', 'Conventional', 'Nylon rubbing plate for bogie'),
    (v_m6, 'Nylon Rubbing Plate', '2nd POH', 'Conventional', 'Nylon rubbing plate for bogie'),
    (v_m6, 'Nylon Rubbing Plate', '3rd POH', 'Conventional', 'Nylon rubbing plate for bogie'),
    (v_m6, 'Nylon Rubbing Plate', '4th POH', 'Conventional', 'Nylon rubbing plate for bogie'),
    (v_m6, 'Guide Bush for Axle Guide', '1st POH', 'Conventional', 'Guide bush for axle guide'),
    (v_m6, 'Guide Bush for Axle Guide', '2nd POH', 'Conventional', 'Guide bush for axle guide'),
    (v_m6, 'Guide Bush for Axle Guide', '3rd POH', 'Conventional', 'Guide bush for axle guide'),
    (v_m6, 'Guide Bush for Axle Guide', '4th POH', 'Conventional', 'Guide bush for axle guide'),
    (v_m6, 'Hanger - Bolster Suspension Swing Link', '1st POH', 'Conventional', 'Hanger for bolster suspension swing link and hanger block'),
    (v_m6, 'Hanger - Bolster Suspension Swing Link', '2nd POH', 'Conventional', 'Hanger for bolster suspension swing link and hanger block'),
    (v_m6, 'Hanger - Bolster Suspension Swing Link', '3rd POH', 'Conventional', 'Hanger for bolster suspension swing link and hanger block'),
    (v_m6, 'Hanger - Bolster Suspension Swing Link', '4th POH', 'Conventional', 'Hanger for bolster suspension swing link and hanger block'),
    (v_m6, 'Brake Beam Hanger Inner', '1st POH', 'Conventional', 'Brake beam hanger inner'),
    (v_m6, 'Brake Beam Hanger Inner', '2nd POH', 'Conventional', 'Brake beam hanger inner'),
    (v_m6, 'Brake Beam Hanger Inner', '3rd POH', 'Conventional', 'Brake beam hanger inner'),
    (v_m6, 'Brake Beam Hanger Inner', '4th POH', 'Conventional', 'Brake beam hanger inner'),
    (v_m6, 'Steel Rubbing Plate', '1st POH', 'Conventional', 'Steel rubbing plate for bogie'),
    (v_m6, 'Steel Rubbing Plate', '2nd POH', 'Conventional', 'Steel rubbing plate for bogie'),
    (v_m6, 'Steel Rubbing Plate', '3rd POH', 'Conventional', 'Steel rubbing plate for bogie'),
    (v_m6, 'Steel Rubbing Plate', '4th POH', 'Conventional', 'Steel rubbing plate for bogie')
  ON CONFLICT DO NOTHING;

  -- 3.8-3.10 Brake beam, hanger bush, shoe bush — Every 4th POH
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m6, 'Brake Beam', '4th POH', 'Conventional', 'Brake beam replacement'),
    (v_m6, 'Brake Hanger Bush', '4th POH', 'Conventional', 'Brake hanger bush'),
    (v_m6, 'Brake Shoe Bush', '4th POH', 'Conventional', 'Brake shoe bush')
  ON CONFLICT DO NOTHING;

-- 4. BOGIE ASSEMBLY items → M6
  -- 4.1-4.12 Every POH items
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m6, 'Wick Pad - Axle Lubricating Assembly', '1st POH', 'Conventional', 'Wick pad for axle lubricating assembly'),
    (v_m6, 'Wick Pad - Axle Lubricating Assembly', '2nd POH', 'Conventional', 'Wick pad for axle lubricating assembly'),
    (v_m6, 'Wick Pad - Axle Lubricating Assembly', '3rd POH', 'Conventional', 'Wick pad for axle lubricating assembly'),
    (v_m6, 'Wick Pad - Axle Lubricating Assembly', '4th POH', 'Conventional', 'Wick pad for axle lubricating assembly'),
    (v_m6, 'Felt for Dust Guard', '1st POH', 'Conventional', 'Felt for dust guard'),
    (v_m6, 'Felt for Dust Guard', '2nd POH', 'Conventional', 'Felt for dust guard'),
    (v_m6, 'Felt for Dust Guard', '3rd POH', 'Conventional', 'Felt for dust guard'),
    (v_m6, 'Felt for Dust Guard', '4th POH', 'Conventional', 'Felt for dust guard'),
    (v_m6, 'Felt for Gear Case', '1st POH', 'Conventional', 'Felt for dust guard gear case'),
    (v_m6, 'Felt for Gear Case', '2nd POH', 'Conventional', 'Felt for dust guard gear case'),
    (v_m6, 'Felt for Gear Case', '3rd POH', 'Conventional', 'Felt for dust guard gear case'),
    (v_m6, 'Felt for Gear Case', '4th POH', 'Conventional', 'Felt for dust guard gear case'),
    (v_m6, 'Sandwich Rubber Pad - Nose Suspension', '1st POH', 'Conventional', 'Sandwich rubber pad for nose suspension unit'),
    (v_m6, 'Sandwich Rubber Pad - Nose Suspension', '2nd POH', 'Conventional', 'Sandwich rubber pad for nose suspension unit'),
    (v_m6, 'Sandwich Rubber Pad - Nose Suspension', '3rd POH', 'Conventional', 'Sandwich rubber pad for nose suspension unit'),
    (v_m6, 'Sandwich Rubber Pad - Nose Suspension', '4th POH', 'Conventional', 'Sandwich rubber pad for nose suspension unit'),
    (v_m6, 'Lower Rubber Washer', '1st POH', 'Conventional', 'Lower rubber washer'),
    (v_m6, 'Lower Rubber Washer', '2nd POH', 'Conventional', 'Lower rubber washer'),
    (v_m6, 'Lower Rubber Washer', '3rd POH', 'Conventional', 'Lower rubber washer'),
    (v_m6, 'Lower Rubber Washer', '4th POH', 'Conventional', 'Lower rubber washer'),
    (v_m6, 'Upper Rubber Washer for TC', '1st POH', 'Conventional', 'Upper rubber washer for TC'),
    (v_m6, 'Upper Rubber Washer for TC', '2nd POH', 'Conventional', 'Upper rubber washer for TC'),
    (v_m6, 'Upper Rubber Washer for TC', '3rd POH', 'Conventional', 'Upper rubber washer for TC'),
    (v_m6, 'Upper Rubber Washer for TC', '4th POH', 'Conventional', 'Upper rubber washer for TC'),
    (v_m6, 'Hytrel Washer for TC', '1st POH', 'Conventional', 'Hytrel washer for TC'),
    (v_m6, 'Hytrel Washer for TC', '2nd POH', 'Conventional', 'Hytrel washer for TC'),
    (v_m6, 'Hytrel Washer for TC', '3rd POH', 'Conventional', 'Hytrel washer for TC'),
    (v_m6, 'Hytrel Washer for TC', '4th POH', 'Conventional', 'Hytrel washer for TC'),
    (v_m6, 'Shock Absorber for MC', '1st POH', 'Conventional', 'Shock absorber for MC'),
    (v_m6, 'Shock Absorber for MC', '2nd POH', 'Conventional', 'Shock absorber for MC'),
    (v_m6, 'Shock Absorber for MC', '3rd POH', 'Conventional', 'Shock absorber for MC'),
    (v_m6, 'Shock Absorber for MC', '4th POH', 'Conventional', 'Shock absorber for MC'),
    (v_m6, 'Sealing Cap - Centre Pivot TC', '1st POH', 'Conventional', 'Sealing cap for center pivot of TC'),
    (v_m6, 'Sealing Cap - Centre Pivot TC', '2nd POH', 'Conventional', 'Sealing cap for center pivot of TC'),
    (v_m6, 'Sealing Cap - Centre Pivot TC', '3rd POH', 'Conventional', 'Sealing cap for center pivot of TC'),
    (v_m6, 'Sealing Cap - Centre Pivot TC', '4th POH', 'Conventional', 'Sealing cap for center pivot of TC'),
    (v_m6, 'Felt Ring for Axle Box', '1st POH', 'Conventional', 'Felt ring for axle box'),
    (v_m6, 'Felt Ring for Axle Box', '2nd POH', 'Conventional', 'Felt ring for axle box'),
    (v_m6, 'Felt Ring for Axle Box', '3rd POH', 'Conventional', 'Felt ring for axle box'),
    (v_m6, 'Felt Ring for Axle Box', '4th POH', 'Conventional', 'Felt ring for axle box'),
    (v_m6, 'Axle Lubricating Assembly', '1st POH', 'Conventional', 'Axle lubricating assembly'),
    (v_m6, 'Axle Lubricating Assembly', '2nd POH', 'Conventional', 'Axle lubricating assembly'),
    (v_m6, 'Axle Lubricating Assembly', '3rd POH', 'Conventional', 'Axle lubricating assembly'),
    (v_m6, 'Axle Lubricating Assembly', '4th POH', 'Conventional', 'Axle lubricating assembly'),
    (v_m6, 'Dust Guard', '1st POH', 'Conventional', 'Dust guard'),
    (v_m6, 'Dust Guard', '2nd POH', 'Conventional', 'Dust guard'),
    (v_m6, 'Dust Guard', '3rd POH', 'Conventional', 'Dust guard'),
    (v_m6, 'Dust Guard', '4th POH', 'Conventional', 'Dust guard')
  ON CONFLICT DO NOTHING;

  -- 4.13-4.23 Bogie Assembly — Every 4th POH
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m6, 'Top/Bottom Spring Plate - Nose Suspension', '4th POH', 'Conventional', 'Extreme top and bottom spring plate for nose suspension unit'),
    (v_m6, 'Steel Bush - Nose Suspension', '4th POH', 'Conventional', 'Steel bush for nose suspension unit'),
    (v_m6, 'Suspension Bearing', '4th POH', 'Conventional', 'Suspension bearing'),
    (v_m6, 'Shock Absorber for TC (OH Kit)', '4th POH', 'Conventional', 'Shock absorber for TC overhauled using proper kit'),
    (v_m6, 'Silent Block - Anchor Link', '4th POH', 'Conventional', 'Silent block for anchor link'),
    (v_m6, 'Axle Shield', '4th POH', 'Conventional', 'Axle shield'),
    (v_m6, 'Helical Spring', '4th POH', 'Conventional', 'Helical spring'),
    (v_m6, 'Silent Block - Centre Pivot', '4th POH', 'Conventional', 'Silent block for centre pivot'),
    (v_m6, 'Gear Case', '4th POH', 'Conventional', 'Gear case'),
    (v_m6, 'Split Ring Clamp - Centre Pivot', '4th POH', 'Conventional', 'Split ring clamp for centre pivot'),
    (v_m6, 'Safety Sling', '4th POH', 'Conventional', 'Safety sling')
  ON CONFLICT DO NOTHING;

-- ---- M8: Compressor Section (Conventional) ----
-- 5. COMPRESSOR items → M8
  -- 5.1 Valve plates and packing ring for Aux compressor — Every POH
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m8, 'Valve Plates & Packing Ring - Aux Compressor', '1st POH', 'Conventional', 'Valve plates and packing ring for aux compressor'),
    (v_m8, 'Valve Plates & Packing Ring - Aux Compressor', '2nd POH', 'Conventional', 'Valve plates and packing ring for aux compressor'),
    (v_m8, 'Valve Plates & Packing Ring - Aux Compressor', '3rd POH', 'Conventional', 'Valve plates and packing ring for aux compressor'),
    (v_m8, 'Valve Plates & Packing Ring - Aux Compressor', '4th POH', 'Conventional', 'Valve plates and packing ring for aux compressor')
  ON CONFLICT DO NOTHING;
  -- 5.2 OH kit every POH for compressor as per OEM
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m8, 'Compressor OH Kit (Every POH) per OEM', '1st POH', 'Conventional', 'Overhauling kit every POH for compressor as per OEM'),
    (v_m8, 'Compressor OH Kit (Every POH) per OEM', '2nd POH', 'Conventional', 'Overhauling kit every POH for compressor as per OEM'),
    (v_m8, 'Compressor OH Kit (Every POH) per OEM', '3rd POH', 'Conventional', 'Overhauling kit every POH for compressor as per OEM'),
    (v_m8, 'Compressor OH Kit (Every POH) per OEM', '4th POH', 'Conventional', 'Overhauling kit every POH for compressor as per OEM')
  ON CONFLICT DO NOTHING;
  -- 5.3 OH kit alternate POH — Every 2nd POH
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m8, 'Compressor OH Kit (Alternate POH) per OEM', '2nd POH', 'Conventional', 'Overhauling kit alternate POH for compressor as per OEM'),
    (v_m8, 'Compressor OH Kit (Alternate POH) per OEM', '4th POH', 'Conventional', 'Overhauling kit alternate POH for compressor as per OEM')
  ON CONFLICT DO NOTHING;
  -- 5.4 OH kit every 3rd POH
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m8, 'Compressor OH Kit (Every 3rd POH) per OEM', '3rd POH', 'Conventional', 'Overhauling kit every third POH for compressor as per OEM')
  ON CONFLICT DO NOTHING;
  -- 5.5 Gasket for NRV — Every POH
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m8, 'Gasket - NRV Main Compressor', '1st POH', 'Conventional', 'Gasket for non-return valve for main compressor'),
    (v_m8, 'Gasket - NRV Main Compressor', '2nd POH', 'Conventional', 'Gasket for non-return valve for main compressor'),
    (v_m8, 'Gasket - NRV Main Compressor', '3rd POH', 'Conventional', 'Gasket for non-return valve for main compressor'),
    (v_m8, 'Gasket - NRV Main Compressor', '4th POH', 'Conventional', 'Gasket for non-return valve for main compressor')
  ON CONFLICT DO NOTHING;
  -- 5.6 Filter element for centrifugal dirt collector — Every POH
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m8, 'Filter Element - Centrifugal Dirt Collector', '1st POH', 'Conventional', 'Filter element for centrifugal dirt collector'),
    (v_m8, 'Filter Element - Centrifugal Dirt Collector', '2nd POH', 'Conventional', 'Filter element for centrifugal dirt collector'),
    (v_m8, 'Filter Element - Centrifugal Dirt Collector', '3rd POH', 'Conventional', 'Filter element for centrifugal dirt collector'),
    (v_m8, 'Filter Element - Centrifugal Dirt Collector', '4th POH', 'Conventional', 'Filter element for centrifugal dirt collector')
  ON CONFLICT DO NOTHING;

-- ---- E5: Train Lighting & LT (Conventional) ----
-- 6. HEAD LIGHT → E5
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_e5, 'Reflector for Head Light', '1st POH', 'Conventional', 'Reflector for head light'),
    (v_e5, 'Reflector for Head Light', '2nd POH', 'Conventional', 'Reflector for head light'),
    (v_e5, 'Reflector for Head Light', '3rd POH', 'Conventional', 'Reflector for head light'),
    (v_e5, 'Reflector for Head Light', '4th POH', 'Conventional', 'Reflector for head light'),
    (v_e5, 'Holder Assembly for Head Light', '1st POH', 'Conventional', 'Holder assembly for head light'),
    (v_e5, 'Holder Assembly for Head Light', '2nd POH', 'Conventional', 'Holder assembly for head light'),
    (v_e5, 'Holder Assembly for Head Light', '3rd POH', 'Conventional', 'Holder assembly for head light'),
    (v_e5, 'Holder Assembly for Head Light', '4th POH', 'Conventional', 'Holder assembly for head light'),
    (v_e5, 'Rotary Switch for Head Light', '1st POH', 'Conventional', 'Rotary switch for head light'),
    (v_e5, 'Rotary Switch for Head Light', '2nd POH', 'Conventional', 'Rotary switch for head light'),
    (v_e5, 'Rotary Switch for Head Light', '3rd POH', 'Conventional', 'Rotary switch for head light'),
    (v_e5, 'Rotary Switch for Head Light', '4th POH', 'Conventional', 'Rotary switch for head light')
  ON CONFLICT DO NOTHING;

-- ---- E2: HT Electrical Section (Conventional) ----
-- 7. LT PANEL → E2
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_e2, 'Fixed & Moving Contact for CC1', '1st POH', 'Conventional', 'Fixed and moving contact for CC1'),
    (v_e2, 'Fixed & Moving Contact for CC1', '2nd POH', 'Conventional', 'Fixed and moving contact for CC1'),
    (v_e2, 'Fixed & Moving Contact for CC1', '3rd POH', 'Conventional', 'Fixed and moving contact for CC1'),
    (v_e2, 'Fixed & Moving Contact for CC1', '4th POH', 'Conventional', 'Fixed and moving contact for CC1'),
    (v_e2, 'Spring for CC1', '1st POH', 'Conventional', 'Spring for CC1'),
    (v_e2, 'Spring for CC1', '2nd POH', 'Conventional', 'Spring for CC1'),
    (v_e2, 'Spring for CC1', '3rd POH', 'Conventional', 'Spring for CC1'),
    (v_e2, 'Spring for CC1', '4th POH', 'Conventional', 'Spring for CC1'),
    (v_e2, 'Fixed & Moving Contact - Light Contactor', '1st POH', 'Conventional', 'Fixed and moving contact for light contactor'),
    (v_e2, 'Fixed & Moving Contact - Light Contactor', '2nd POH', 'Conventional', 'Fixed and moving contact for light contactor'),
    (v_e2, 'Fixed & Moving Contact - Light Contactor', '3rd POH', 'Conventional', 'Fixed and moving contact for light contactor'),
    (v_e2, 'Fixed & Moving Contact - Light Contactor', '4th POH', 'Conventional', 'Fixed and moving contact for light contactor'),
    (v_e2, 'Arc Chute for CC1', '1st POH', 'Conventional', 'Arc chute for CC1'),
    (v_e2, 'Arc Chute for CC1', '2nd POH', 'Conventional', 'Arc chute for CC1'),
    (v_e2, 'Arc Chute for CC1', '3rd POH', 'Conventional', 'Arc chute for CC1'),
    (v_e2, 'Arc Chute for CC1', '4th POH', 'Conventional', 'Arc chute for CC1')
  ON CONFLICT DO NOTHING;

-- 8. MASTER CONTROLLER → E2
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_e2, 'Springs for Master Controller', '1st POH', 'Conventional', 'Springs for master controller'),
    (v_e2, 'Springs for Master Controller', '2nd POH', 'Conventional', 'Springs for master controller'),
    (v_e2, 'Springs for Master Controller', '3rd POH', 'Conventional', 'Springs for master controller'),
    (v_e2, 'Springs for Master Controller', '4th POH', 'Conventional', 'Springs for master controller'),
    (v_e2, 'Contact Screw - Master Controller', '1st POH', 'Conventional', 'Contact screw for master controller'),
    (v_e2, 'Contact Screw - Master Controller', '2nd POH', 'Conventional', 'Contact screw for master controller'),
    (v_e2, 'Contact Screw - Master Controller', '3rd POH', 'Conventional', 'Contact screw for master controller'),
    (v_e2, 'Contact Screw - Master Controller', '4th POH', 'Conventional', 'Contact screw for master controller'),
    (v_e2, 'Valve Stem - Master Controller', '1st POH', 'Conventional', 'Valve stem for master controller'),
    (v_e2, 'Valve Stem - Master Controller', '2nd POH', 'Conventional', 'Valve stem for master controller'),
    (v_e2, 'Valve Stem - Master Controller', '3rd POH', 'Conventional', 'Valve stem for master controller'),
    (v_e2, 'Valve Stem - Master Controller', '4th POH', 'Conventional', 'Valve stem for master controller'),
    (v_e2, 'Cam for Master Controller', '4th POH', 'Conventional', 'Cam for master controller'),
    (v_e2, 'Contact Finger Assembly - Master Controller', '4th POH', 'Conventional', 'Contact finger assembly for master controller')
  ON CONFLICT DO NOTHING;

-- 9. PANTOGRAPH → M3
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m3, 'Joint Perfect Rubber for Panto', '1st POH', 'Conventional', 'Joint perfect rubber for pantograph'),
    (v_m3, 'Joint Perfect Rubber for Panto', '2nd POH', 'Conventional', 'Joint perfect rubber for pantograph'),
    (v_m3, 'Joint Perfect Rubber for Panto', '3rd POH', 'Conventional', 'Joint perfect rubber for pantograph'),
    (v_m3, 'Joint Perfect Rubber for Panto', '4th POH', 'Conventional', 'Joint perfect rubber for pantograph'),
    (v_m3, 'OH Kit Rubber for Panto (OEM)', '1st POH', 'Conventional', 'Overhauling kit rubber for panto as per OEM'),
    (v_m3, 'OH Kit Rubber for Panto (OEM)', '2nd POH', 'Conventional', 'Overhauling kit rubber for panto as per OEM'),
    (v_m3, 'OH Kit Rubber for Panto (OEM)', '3rd POH', 'Conventional', 'Overhauling kit rubber for panto as per OEM'),
    (v_m3, 'OH Kit Rubber for Panto (OEM)', '4th POH', 'Conventional', 'Overhauling kit rubber for panto as per OEM'),
    (v_m3, 'OH Kit for Panto Valve (Rotex)', '1st POH', 'Conventional', 'Overhauling for panto valve as per OEM Rotex'),
    (v_m3, 'OH Kit for Panto Valve (Rotex)', '2nd POH', 'Conventional', 'Overhauling for panto valve as per OEM Rotex'),
    (v_m3, 'OH Kit for Panto Valve (Rotex)', '3rd POH', 'Conventional', 'Overhauling for panto valve as per OEM Rotex'),
    (v_m3, 'OH Kit for Panto Valve (Rotex)', '4th POH', 'Conventional', 'Overhauling for panto valve as per OEM Rotex'),
    (v_m3, 'Long & Short Shunts for Panto', '1st POH', 'Conventional', 'Long and short shunts for pantograph'),
    (v_m3, 'Long & Short Shunts for Panto', '2nd POH', 'Conventional', 'Long and short shunts for pantograph'),
    (v_m3, 'Long & Short Shunts for Panto', '3rd POH', 'Conventional', 'Long and short shunts for pantograph'),
    (v_m3, 'Long & Short Shunts for Panto', '4th POH', 'Conventional', 'Long and short shunts for pantograph'),
    (v_m3, 'Latching Spring - Panto Valve (BHEL)', '1st POH', 'Conventional', 'Latching spring for panto valve BHEL'),
    (v_m3, 'Latching Spring - Panto Valve (BHEL)', '2nd POH', 'Conventional', 'Latching spring for panto valve BHEL'),
    (v_m3, 'Latching Spring - Panto Valve (BHEL)', '3rd POH', 'Conventional', 'Latching spring for panto valve BHEL'),
    (v_m3, 'Latching Spring - Panto Valve (BHEL)', '4th POH', 'Conventional', 'Latching spring for panto valve BHEL')
  ON CONFLICT DO NOTHING;
  -- 9.6-9.10 Panto items — Every 4th POH
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m3, 'Top Mounting Sub-Assembly Part A/B', '4th POH', 'Conventional', 'Top mounting subassembly part A B'),
    (v_m3, 'Bearing for Yoke Assembly', '4th POH', 'Conventional', 'Bearing for yoke assembly'),
    (v_m3, 'Plunger Box Assembly', '4th POH', 'Conventional', 'Plunger box assembly for pantograph'),
    (v_m3, 'Valve for Panto Operating (BHEL)', '4th POH', 'Conventional', 'Valve for panto operating valve BHEL'),
    (v_m3, 'Bearings - Pedestal/Push Rod/Articulation', '4th POH', 'Conventional', 'Bearings for pedestal, push rod, lower and middle articulation')
  ON CONFLICT DO NOTHING;

-- 10. PNEUMATIC ITEMS → M5
  -- 10.1-10.16 Every POH
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m5, 'OH Kit - EP Unit (OEM)', '1st POH', 'Conventional', 'Overhauling kit for EP unit as per OEM'),
    (v_m5, 'OH Kit - EP Unit (OEM)', '2nd POH', 'Conventional', 'Overhauling kit for EP unit as per OEM'),
    (v_m5, 'OH Kit - EP Unit (OEM)', '3rd POH', 'Conventional', 'Overhauling kit for EP unit as per OEM'),
    (v_m5, 'OH Kit - EP Unit (OEM)', '4th POH', 'Conventional', 'Overhauling kit for EP unit as per OEM'),
    (v_m5, 'OH Kit - Brake Controller (OEM)', '1st POH', 'Conventional', 'Overhauling kit for brake controller as per OEM'),
    (v_m5, 'OH Kit - Brake Controller (OEM)', '2nd POH', 'Conventional', 'Overhauling kit for brake controller as per OEM'),
    (v_m5, 'OH Kit - Brake Controller (OEM)', '3rd POH', 'Conventional', 'Overhauling kit for brake controller as per OEM'),
    (v_m5, 'OH Kit - Brake Controller (OEM)', '4th POH', 'Conventional', 'Overhauling kit for brake controller as per OEM'),
    (v_m5, 'O-Ring & Spring - Horn Valve', '1st POH', 'Conventional', 'O ring and spring for foot operated horn valve'),
    (v_m5, 'O-Ring & Spring - Horn Valve', '2nd POH', 'Conventional', 'O ring and spring for foot operated horn valve'),
    (v_m5, 'O-Ring & Spring - Horn Valve', '3rd POH', 'Conventional', 'O ring and spring for foot operated horn valve'),
    (v_m5, 'O-Ring & Spring - Horn Valve', '4th POH', 'Conventional', 'O ring and spring for foot operated horn valve'),
    (v_m5, 'Diaphragm for Horn', '1st POH', 'Conventional', 'Diaphragm for horn'),
    (v_m5, 'Diaphragm for Horn', '2nd POH', 'Conventional', 'Diaphragm for horn'),
    (v_m5, 'Diaphragm for Horn', '3rd POH', 'Conventional', 'Diaphragm for horn'),
    (v_m5, 'Diaphragm for Horn', '4th POH', 'Conventional', 'Diaphragm for horn'),
    (v_m5, 'OH Kit - Emergency/Dead Man Valve', '1st POH', 'Conventional', 'Overhauling kit for emergency valve / dead mans valve'),
    (v_m5, 'OH Kit - Emergency/Dead Man Valve', '2nd POH', 'Conventional', 'Overhauling kit for emergency valve / dead mans valve'),
    (v_m5, 'OH Kit - Emergency/Dead Man Valve', '3rd POH', 'Conventional', 'Overhauling kit for emergency valve / dead mans valve'),
    (v_m5, 'OH Kit - Emergency/Dead Man Valve', '4th POH', 'Conventional', 'Overhauling kit for emergency valve / dead mans valve'),
    (v_m5, 'Piston Packing - Duplex Check Valve', '1st POH', 'Conventional', 'Piston packing for duplex check valve'),
    (v_m5, 'Piston Packing - Duplex Check Valve', '2nd POH', 'Conventional', 'Piston packing for duplex check valve'),
    (v_m5, 'Piston Packing - Duplex Check Valve', '3rd POH', 'Conventional', 'Piston packing for duplex check valve'),
    (v_m5, 'Piston Packing - Duplex Check Valve', '4th POH', 'Conventional', 'Piston packing for duplex check valve'),
    (v_m5, 'Packing Rubber - Release Valve', '1st POH', 'Conventional', 'Packing rubber for release valve'),
    (v_m5, 'Packing Rubber - Release Valve', '2nd POH', 'Conventional', 'Packing rubber for release valve'),
    (v_m5, 'Packing Rubber - Release Valve', '3rd POH', 'Conventional', 'Packing rubber for release valve'),
    (v_m5, 'Packing Rubber - Release Valve', '4th POH', 'Conventional', 'Packing rubber for release valve'),
    (v_m5, 'Piston Packing Ring - Brake Cylinder', '1st POH', 'Conventional', 'Piston packing ring for brake cylinder'),
    (v_m5, 'Piston Packing Ring - Brake Cylinder', '2nd POH', 'Conventional', 'Piston packing ring for brake cylinder'),
    (v_m5, 'Piston Packing Ring - Brake Cylinder', '3rd POH', 'Conventional', 'Piston packing ring for brake cylinder'),
    (v_m5, 'Piston Packing Ring - Brake Cylinder', '4th POH', 'Conventional', 'Piston packing ring for brake cylinder'),
    (v_m5, 'Dust Excluder - Brake Cylinder', '1st POH', 'Conventional', 'Dust excluder for brake cylinder'),
    (v_m5, 'Dust Excluder - Brake Cylinder', '2nd POH', 'Conventional', 'Dust excluder for brake cylinder'),
    (v_m5, 'Dust Excluder - Brake Cylinder', '3rd POH', 'Conventional', 'Dust excluder for brake cylinder'),
    (v_m5, 'Dust Excluder - Brake Cylinder', '4th POH', 'Conventional', 'Dust excluder for brake cylinder'),
    (v_m5, 'Gasket - Centrifugal Dirt Collector', '1st POH', 'Conventional', 'Gasket for centrifugal dirt collector'),
    (v_m5, 'Gasket - Centrifugal Dirt Collector', '2nd POH', 'Conventional', 'Gasket for centrifugal dirt collector'),
    (v_m5, 'Gasket - Centrifugal Dirt Collector', '3rd POH', 'Conventional', 'Gasket for centrifugal dirt collector'),
    (v_m5, 'Gasket - Centrifugal Dirt Collector', '4th POH', 'Conventional', 'Gasket for centrifugal dirt collector'),
    (v_m5, 'Nylon Filter Elements', '1st POH', 'Conventional', 'Nylon filter elements'),
    (v_m5, 'Nylon Filter Elements', '2nd POH', 'Conventional', 'Nylon filter elements'),
    (v_m5, 'Nylon Filter Elements', '3rd POH', 'Conventional', 'Nylon filter elements'),
    (v_m5, 'Nylon Filter Elements', '4th POH', 'Conventional', 'Nylon filter elements'),
    (v_m5, 'All Filter Elements - Pneumatic Circuit', '1st POH', 'Conventional', 'All filter elements of pneumatic circuit'),
    (v_m5, 'All Filter Elements - Pneumatic Circuit', '2nd POH', 'Conventional', 'All filter elements of pneumatic circuit'),
    (v_m5, 'All Filter Elements - Pneumatic Circuit', '3rd POH', 'Conventional', 'All filter elements of pneumatic circuit'),
    (v_m5, 'All Filter Elements - Pneumatic Circuit', '4th POH', 'Conventional', 'All filter elements of pneumatic circuit')
  ON CONFLICT DO NOTHING;

  -- 10.13-10.16 More pneumatic Every POH items
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m5, 'Rubber Braided Hose SAE 100 R1', '1st POH', 'Conventional', 'Rubber braided hose of SAE 100 R1'),
    (v_m5, 'Rubber Braided Hose SAE 100 R1', '2nd POH', 'Conventional', 'Rubber braided hose of SAE 100 R1'),
    (v_m5, 'Rubber Braided Hose SAE 100 R1', '3rd POH', 'Conventional', 'Rubber braided hose of SAE 100 R1'),
    (v_m5, 'Rubber Braided Hose SAE 100 R1', '4th POH', 'Conventional', 'Rubber braided hose of SAE 100 R1'),
    (v_m5, 'Wiper Blade', '1st POH', 'Conventional', 'Wiper blade'),
    (v_m5, 'Wiper Blade', '2nd POH', 'Conventional', 'Wiper blade'),
    (v_m5, 'Wiper Blade', '3rd POH', 'Conventional', 'Wiper blade'),
    (v_m5, 'Wiper Blade', '4th POH', 'Conventional', 'Wiper blade'),
    (v_m5, 'Wiper Arm', '1st POH', 'Conventional', 'Wiper arm'),
    (v_m5, 'Wiper Arm', '2nd POH', 'Conventional', 'Wiper arm'),
    (v_m5, 'Wiper Arm', '3rd POH', 'Conventional', 'Wiper arm'),
    (v_m5, 'Wiper Arm', '4th POH', 'Conventional', 'Wiper arm'),
    (v_m5, 'Valve Guide - Holding/Application Magnet Valve', '1st POH', 'Conventional', 'Valve guide for holding and application magnet valve'),
    (v_m5, 'Valve Guide - Holding/Application Magnet Valve', '2nd POH', 'Conventional', 'Valve guide for holding and application magnet valve'),
    (v_m5, 'Valve Guide - Holding/Application Magnet Valve', '3rd POH', 'Conventional', 'Valve guide for holding and application magnet valve'),
    (v_m5, 'Valve Guide - Holding/Application Magnet Valve', '4th POH', 'Conventional', 'Valve guide for holding and application magnet valve')
  ON CONFLICT DO NOTHING;

  -- 10.17-10.25 Pneumatic items — Every 4th POH (and some 2nd)
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m5, 'Foot Operated Horn Valve', '4th POH', 'Conventional', 'Foot operated horn valve'),
    (v_m5, 'Operating & Locking Pawl - BC', '4th POH', 'Conventional', 'Operating and locking pawl for brake cylinder'),
    (v_m5, 'Brass Bush - Dust Excluder BC', '4th POH', 'Conventional', 'Brass bush for dust excluder for BC'),
    (v_m5, 'Seats for Non-Return Valve', '4th POH', 'Conventional', 'Seats for non-return valve'),
    (v_m5, 'Gauges', '4th POH', 'Conventional', 'Gauges'),
    (v_m5, 'Magnet Valve for EP Unit', '4th POH', 'Conventional', 'Magnet valve for EP unit'),
    (v_m5, 'Pressure Switches', '4th POH', 'Conventional', 'Pressure switches'),
    (v_m5, 'Safety Valves', '2nd POH', 'Conventional', 'Safety valves'),
    (v_m5, 'Safety Valves', '4th POH', 'Conventional', 'Safety valves'),
    (v_m5, 'Angle Cocks', '4th POH', 'Conventional', 'Angle cocks')
  ON CONFLICT DO NOTHING;

-- 11. RELAY → E2
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_e2, 'Spring for MT Relays', '1st POH', 'Conventional', 'Spring for MT relays'),
    (v_e2, 'Spring for MT Relays', '2nd POH', 'Conventional', 'Spring for MT relays'),
    (v_e2, 'Spring for MT Relays', '3rd POH', 'Conventional', 'Spring for MT relays'),
    (v_e2, 'Spring for MT Relays', '4th POH', 'Conventional', 'Spring for MT relays'),
    (v_e2, 'Moving Contacts for MT Relays', '1st POH', 'Conventional', 'Moving contacts for MT relays'),
    (v_e2, 'Moving Contacts for MT Relays', '2nd POH', 'Conventional', 'Moving contacts for MT relays'),
    (v_e2, 'Moving Contacts for MT Relays', '3rd POH', 'Conventional', 'Moving contacts for MT relays'),
    (v_e2, 'Moving Contacts for MT Relays', '4th POH', 'Conventional', 'Moving contacts for MT relays'),
    (v_e2, 'Spring for Overload Relays', '1st POH', 'Conventional', 'Spring for overload relays'),
    (v_e2, 'Spring for Overload Relays', '2nd POH', 'Conventional', 'Spring for overload relays'),
    (v_e2, 'Spring for Overload Relays', '3rd POH', 'Conventional', 'Spring for overload relays'),
    (v_e2, 'Spring for Overload Relays', '4th POH', 'Conventional', 'Spring for overload relays'),
    (v_e2, 'Spring for CLR Relay', '1st POH', 'Conventional', 'Spring for CLR relay'),
    (v_e2, 'Spring for CLR Relay', '2nd POH', 'Conventional', 'Spring for CLR relay'),
    (v_e2, 'Spring for CLR Relay', '3rd POH', 'Conventional', 'Spring for CLR relay'),
    (v_e2, 'Spring for CLR Relay', '4th POH', 'Conventional', 'Spring for CLR relay'),
    (v_e2, 'Fixed Contacts for MT Relay', '4th POH', 'Conventional', 'Fixed contacts for MT relay'),
    (v_e2, 'Fingers with Pin - Overload Relays', '4th POH', 'Conventional', 'Short and long fingers with pin for overload relays'),
    (v_e2, 'Fixed Contacts - Overload Relays', '4th POH', 'Conventional', 'Fixed contacts for overload relays'),
    (v_e2, 'Finger Assembly - CLR Relay', '4th POH', 'Conventional', 'Finger assembly for CLR relay'),
    (v_e2, 'Contact Carrier - CLR Relay', '4th POH', 'Conventional', 'Contact carrier for CLR relay')
  ON CONFLICT DO NOTHING;

-- 12. TRACTION MOTOR → E3
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_e3, 'Carbon Brushes - TM', '1st POH', 'Conventional', 'Carbon brushes for traction motor'),
    (v_e3, 'Carbon Brushes - TM', '2nd POH', 'Conventional', 'Carbon brushes for traction motor'),
    (v_e3, 'Carbon Brushes - TM', '3rd POH', 'Conventional', 'Carbon brushes for traction motor'),
    (v_e3, 'Carbon Brushes - TM', '4th POH', 'Conventional', 'Carbon brushes for traction motor'),
    (v_e3, 'Earth Brush - TM', '1st POH', 'Conventional', 'Earth brush for traction motor'),
    (v_e3, 'Earth Brush - TM', '2nd POH', 'Conventional', 'Earth brush for traction motor'),
    (v_e3, 'Earth Brush - TM', '3rd POH', 'Conventional', 'Earth brush for traction motor'),
    (v_e3, 'Earth Brush - TM', '4th POH', 'Conventional', 'Earth brush for traction motor'),
    (v_e3, 'Felt Ring - TM', '1st POH', 'Conventional', 'Felt ring for traction motor'),
    (v_e3, 'Felt Ring - TM', '2nd POH', 'Conventional', 'Felt ring for traction motor'),
    (v_e3, 'Felt Ring - TM', '3rd POH', 'Conventional', 'Felt ring for traction motor'),
    (v_e3, 'Felt Ring - TM', '4th POH', 'Conventional', 'Felt ring for traction motor'),
    (v_e3, 'Oil Seal - TM', '1st POH', 'Conventional', 'Oil seal for traction motor'),
    (v_e3, 'Oil Seal - TM', '2nd POH', 'Conventional', 'Oil seal for traction motor'),
    (v_e3, 'Oil Seal - TM', '3rd POH', 'Conventional', 'Oil seal for traction motor'),
    (v_e3, 'Oil Seal - TM', '4th POH', 'Conventional', 'Oil seal for traction motor'),
    (v_e3, 'Mounting Bush - Nose Suspension', '1st POH', 'Conventional', 'Mounting bush for nose suspension'),
    (v_e3, 'Mounting Bush - Nose Suspension', '2nd POH', 'Conventional', 'Mounting bush for nose suspension'),
    (v_e3, 'Mounting Bush - Nose Suspension', '3rd POH', 'Conventional', 'Mounting bush for nose suspension'),
    (v_e3, 'Mounting Bush - Nose Suspension', '4th POH', 'Conventional', 'Mounting bush for nose suspension'),
    (v_e3, 'Bearing - TM', '4th POH', 'Conventional', 'Bearing for traction motor')
  ON CONFLICT DO NOTHING;

-- 13. CONTROL GEAR → E2
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_e2, 'Arc Chute - M Contactors', '1st POH', 'Conventional', 'Arc chute for M contactors'),
    (v_e2, 'Arc Chute - M Contactors', '2nd POH', 'Conventional', 'Arc chute for M contactors'),
    (v_e2, 'Arc Chute - M Contactors', '3rd POH', 'Conventional', 'Arc chute for M contactors'),
    (v_e2, 'Arc Chute - M Contactors', '4th POH', 'Conventional', 'Arc chute for M contactors'),
    (v_e2, 'Fixed & Moving Contacts - M Contactors', '1st POH', 'Conventional', 'Fixed and moving contacts for M contactors'),
    (v_e2, 'Fixed & Moving Contacts - M Contactors', '2nd POH', 'Conventional', 'Fixed and moving contacts for M contactors'),
    (v_e2, 'Fixed & Moving Contacts - M Contactors', '3rd POH', 'Conventional', 'Fixed and moving contacts for M contactors'),
    (v_e2, 'Fixed & Moving Contacts - M Contactors', '4th POH', 'Conventional', 'Fixed and moving contacts for M contactors'),
    (v_e2, 'Return Spring - Contactors', '1st POH', 'Conventional', 'Return spring for contactors'),
    (v_e2, 'Return Spring - Contactors', '2nd POH', 'Conventional', 'Return spring for contactors'),
    (v_e2, 'Return Spring - Contactors', '3rd POH', 'Conventional', 'Return spring for contactors'),
    (v_e2, 'Return Spring - Contactors', '4th POH', 'Conventional', 'Return spring for contactors'),
    (v_e2, 'Interlock Spring - Contactors', '4th POH', 'Conventional', 'Interlock spring for contactors'),
    (v_e2, 'Aux Contact - Contactors', '4th POH', 'Conventional', 'Aux contact for contactors')
  ON CONFLICT DO NOTHING;

-- 14. TRANSFORMER → E2
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_e2, 'Silica Gel - Transformer', '1st POH', 'Conventional', 'Silica gel for transformer'),
    (v_e2, 'Silica Gel - Transformer', '2nd POH', 'Conventional', 'Silica gel for transformer'),
    (v_e2, 'Silica Gel - Transformer', '3rd POH', 'Conventional', 'Silica gel for transformer'),
    (v_e2, 'Silica Gel - Transformer', '4th POH', 'Conventional', 'Silica gel for transformer'),
    (v_e2, 'Radiator Blower Motor Foundation Dampers', '4th POH', 'Conventional', 'Radiator heat exchanger blower motor foundation dampers')
  ON CONFLICT DO NOTHING;

-- 15. RECTIFIER → E2
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_e2, 'Capacitors - Rectifier', '4th POH', 'Conventional', 'Capacitors for rectifier'),
    (v_e2, 'Diodes - Rectifier', '4th POH', 'Conventional', 'Diodes for rectifier')
  ON CONFLICT DO NOTHING;

-- 16. BATTERY → E5
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_e5, 'Battery Cells (Condition Based)', '2nd POH', 'Conventional', 'Battery cells - condition based replacement'),
    (v_e5, 'Battery Cells (Condition Based)', '4th POH', 'Conventional', 'Battery cells - condition based replacement')
  ON CONFLICT DO NOTHING;

-- 17. CONSUMABLE ITEMS (cross-section)
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m5, 'Brake Blocks', '1st POH', 'Conventional', 'Brake blocks - consumable'),
    (v_m5, 'Brake Blocks', '2nd POH', 'Conventional', 'Brake blocks - consumable'),
    (v_m5, 'Brake Blocks', '3rd POH', 'Conventional', 'Brake blocks - consumable'),
    (v_m5, 'Brake Blocks', '4th POH', 'Conventional', 'Brake blocks - consumable'),
    (v_m3, 'Panto Strip', '1st POH', 'Conventional', 'Pantograph carbon strip - consumable'),
    (v_m3, 'Panto Strip', '2nd POH', 'Conventional', 'Pantograph carbon strip - consumable'),
    (v_m3, 'Panto Strip', '3rd POH', 'Conventional', 'Pantograph carbon strip - consumable'),
    (v_m3, 'Panto Strip', '4th POH', 'Conventional', 'Pantograph carbon strip - consumable')
  ON CONFLICT DO NOTHING;

-- 20. VCB → E2
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_e2, 'VCB AOH Kit (2yr periodicity)', '1st POH', 'Conventional', 'VCB overhauling AOH kit - 2 years periodicity'),
    (v_e2, 'VCB AOH Kit (2yr periodicity)', '2nd POH', 'Conventional', 'VCB overhauling AOH kit - 2 years periodicity'),
    (v_e2, 'VCB AOH Kit (2yr periodicity)', '3rd POH', 'Conventional', 'VCB overhauling AOH kit - 2 years periodicity'),
    (v_e2, 'VCB AOH Kit (2yr periodicity)', '4th POH', 'Conventional', 'VCB overhauling AOH kit - 2 years periodicity'),
    (v_e2, 'VCB IOH Kit (4yr periodicity)', '2nd POH', 'Conventional', 'VCB overhauling IOH kit - 4 years periodicity'),
    (v_e2, 'VCB IOH Kit (4yr periodicity)', '4th POH', 'Conventional', 'VCB overhauling IOH kit - 4 years periodicity'),
    (v_e2, 'VCB Complete Pressure Regulator', '4th POH', 'Conventional', 'Complete pressure regulator for VCB'),
    (v_e2, 'VCB Rear & Front Horizontal Sleeve', '4th POH', 'Conventional', 'Rear and front horizontal sleeve of VCB'),
    (v_e2, 'OH Kit - Air Drier VCB', '4th POH', 'Conventional', 'OH kit of air-drier VCB')
  ON CONFLICT DO NOTHING;

-- ================================================================
-- 3-PHASE EMU/MEMU — Must Change Items
-- ================================================================

-- 1. BRAKE EQUIPMENT → M5 (3-Phase)
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m5, 'Worm Drive Hose Clips - BC Dust Excluder', '1st POH', '3-Phase', 'Worm drive hose clips for brake cylinder dust excluder big/small'),
    (v_m5, 'Worm Drive Hose Clips - BC Dust Excluder', '2nd POH', '3-Phase', 'Worm drive hose clips for brake cylinder dust excluder big/small'),
    (v_m5, 'Worm Drive Hose Clips - BC Dust Excluder', '3rd POH', '3-Phase', 'Worm drive hose clips for brake cylinder dust excluder big/small'),
    (v_m5, 'Worm Drive Hose Clips - BC Dust Excluder', '4th POH', '3-Phase', 'Worm drive hose clips for brake cylinder dust excluder big/small'),
    (v_m5, 'OH Kit - EP Unit (OEM)', '1st POH', '3-Phase', 'Overhauling kit for EP unit as per OEM'),
    (v_m5, 'OH Kit - EP Unit (OEM)', '2nd POH', '3-Phase', 'Overhauling kit for EP unit as per OEM'),
    (v_m5, 'OH Kit - EP Unit (OEM)', '3rd POH', '3-Phase', 'Overhauling kit for EP unit as per OEM'),
    (v_m5, 'OH Kit - EP Unit (OEM)', '4th POH', '3-Phase', 'Overhauling kit for EP unit as per OEM'),
    (v_m5, 'Set of Rubber - Modified PRV', '1st POH', '3-Phase', 'Set of rubber for modified PRV'),
    (v_m5, 'Set of Rubber - Modified PRV', '2nd POH', '3-Phase', 'Set of rubber for modified PRV'),
    (v_m5, 'Set of Rubber - Modified PRV', '3rd POH', '3-Phase', 'Set of rubber for modified PRV'),
    (v_m5, 'Set of Rubber - Modified PRV', '4th POH', '3-Phase', 'Set of rubber for modified PRV'),
    (v_m5, 'Set of Rubber - Triple Valve', '1st POH', '3-Phase', 'Set of rubber for triple valve'),
    (v_m5, 'Set of Rubber - Triple Valve', '2nd POH', '3-Phase', 'Set of rubber for triple valve'),
    (v_m5, 'Set of Rubber - Triple Valve', '3rd POH', '3-Phase', 'Set of rubber for triple valve'),
    (v_m5, 'Set of Rubber - Triple Valve', '4th POH', '3-Phase', 'Set of rubber for triple valve'),
    (v_m5, 'Kit - N1 PRV Parking Brake', '1st POH', '3-Phase', 'Kit of rubber components for N1 type pressure reducing valve for parking brake'),
    (v_m5, 'Kit - N1 PRV Parking Brake', '2nd POH', '3-Phase', 'Kit of rubber components for N1 type pressure reducing valve for parking brake'),
    (v_m5, 'Kit - N1 PRV Parking Brake', '3rd POH', '3-Phase', 'Kit of rubber components for N1 type pressure reducing valve for parking brake'),
    (v_m5, 'Kit - N1 PRV Parking Brake', '4th POH', '3-Phase', 'Kit of rubber components for N1 type pressure reducing valve for parking brake'),
    (v_m5, 'Maintenance Kit - Leveling Valve', '1st POH', '3-Phase', 'Maintenance kit of leveling valve'),
    (v_m5, 'Maintenance Kit - Leveling Valve', '2nd POH', '3-Phase', 'Maintenance kit of leveling valve'),
    (v_m5, 'Maintenance Kit - Leveling Valve', '3rd POH', '3-Phase', 'Maintenance kit of leveling valve'),
    (v_m5, 'Maintenance Kit - Leveling Valve', '4th POH', '3-Phase', 'Maintenance kit of leveling valve'),
    (v_m5, 'OH Kit - Emergency/Dead Man Valve', '1st POH', '3-Phase', 'Overhauling kit for emergency valve / dead mans valve'),
    (v_m5, 'OH Kit - Emergency/Dead Man Valve', '2nd POH', '3-Phase', 'Overhauling kit for emergency valve / dead mans valve'),
    (v_m5, 'OH Kit - Emergency/Dead Man Valve', '3rd POH', '3-Phase', 'Overhauling kit for emergency valve / dead mans valve'),
    (v_m5, 'OH Kit - Emergency/Dead Man Valve', '4th POH', '3-Phase', 'Overhauling kit for emergency valve / dead mans valve'),
    (v_m5, 'OH Kit - Brake Controller (OEM)', '1st POH', '3-Phase', 'Overhauling kit for brake controller as per OEM'),
    (v_m5, 'OH Kit - Brake Controller (OEM)', '2nd POH', '3-Phase', 'Overhauling kit for brake controller as per OEM'),
    (v_m5, 'OH Kit - Brake Controller (OEM)', '3rd POH', '3-Phase', 'Overhauling kit for brake controller as per OEM'),
    (v_m5, 'OH Kit - Brake Controller (OEM)', '4th POH', '3-Phase', 'Overhauling kit for brake controller as per OEM'),
    (v_m5, 'Foot Operated Horn Valve', '1st POH', '3-Phase', 'Foot operated horn valve'),
    (v_m5, 'Foot Operated Horn Valve', '2nd POH', '3-Phase', 'Foot operated horn valve'),
    (v_m5, 'Foot Operated Horn Valve', '3rd POH', '3-Phase', 'Foot operated horn valve'),
    (v_m5, 'Foot Operated Horn Valve', '4th POH', '3-Phase', 'Foot operated horn valve'),
    (v_m5, 'Diaphragm for Horn OH Kit', '1st POH', '3-Phase', 'Diaphragm for horn overhauling kit'),
    (v_m5, 'Diaphragm for Horn OH Kit', '2nd POH', '3-Phase', 'Diaphragm for horn overhauling kit'),
    (v_m5, 'Diaphragm for Horn OH Kit', '3rd POH', '3-Phase', 'Diaphragm for horn overhauling kit'),
    (v_m5, 'Diaphragm for Horn OH Kit', '4th POH', '3-Phase', 'Diaphragm for horn overhauling kit'),
    (v_m5, 'Piston Packing - Duplex Piston Valve Air Drier', '1st POH', '3-Phase', 'Piston packing for duplex piston valve of air drier'),
    (v_m5, 'Piston Packing - Duplex Piston Valve Air Drier', '2nd POH', '3-Phase', 'Piston packing for duplex piston valve of air drier'),
    (v_m5, 'Piston Packing - Duplex Piston Valve Air Drier', '3rd POH', '3-Phase', 'Piston packing for duplex piston valve of air drier'),
    (v_m5, 'Piston Packing - Duplex Piston Valve Air Drier', '4th POH', '3-Phase', 'Piston packing for duplex piston valve of air drier')
  ON CONFLICT DO NOTHING;

  -- More 3-Phase Brake Equipment (1.12-1.32) — Every POH
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m5, 'Brake Release Valve', '1st POH', '3-Phase', 'Brake release valve'),
    (v_m5, 'Brake Release Valve', '2nd POH', '3-Phase', 'Brake release valve'),
    (v_m5, 'Brake Release Valve', '3rd POH', '3-Phase', 'Brake release valve'),
    (v_m5, 'Brake Release Valve', '4th POH', '3-Phase', 'Brake release valve'),
    (v_m5, 'Rubber Kit - Solenoid Valve Parking Brake', '1st POH', '3-Phase', 'Rubber kit of solenoid valve of parking brake'),
    (v_m5, 'Rubber Kit - Solenoid Valve Parking Brake', '2nd POH', '3-Phase', 'Rubber kit of solenoid valve of parking brake'),
    (v_m5, 'Rubber Kit - Solenoid Valve Parking Brake', '3rd POH', '3-Phase', 'Rubber kit of solenoid valve of parking brake'),
    (v_m5, 'Rubber Kit - Solenoid Valve Parking Brake', '4th POH', '3-Phase', 'Rubber kit of solenoid valve of parking brake'),
    (v_m5, 'Piston Packing Ring - Brake Cylinder', '1st POH', '3-Phase', 'Piston packing ring of brake cylinder'),
    (v_m5, 'Piston Packing Ring - Brake Cylinder', '2nd POH', '3-Phase', 'Piston packing ring of brake cylinder'),
    (v_m5, 'Piston Packing Ring - Brake Cylinder', '3rd POH', '3-Phase', 'Piston packing ring of brake cylinder'),
    (v_m5, 'Piston Packing Ring - Brake Cylinder', '4th POH', '3-Phase', 'Piston packing ring of brake cylinder'),
    (v_m5, 'Dust Excluder', '1st POH', '3-Phase', 'Dust excluder for brake cylinder'),
    (v_m5, 'Dust Excluder', '2nd POH', '3-Phase', 'Dust excluder for brake cylinder'),
    (v_m5, 'Dust Excluder', '3rd POH', '3-Phase', 'Dust excluder for brake cylinder'),
    (v_m5, 'Dust Excluder', '4th POH', '3-Phase', 'Dust excluder for brake cylinder'),
    (v_m5, 'Parking Brake Cylinder Rubber Kit', '1st POH', '3-Phase', 'Parking brake cylinder rubber kit'),
    (v_m5, 'Parking Brake Cylinder Rubber Kit', '2nd POH', '3-Phase', 'Parking brake cylinder rubber kit'),
    (v_m5, 'Parking Brake Cylinder Rubber Kit', '3rd POH', '3-Phase', 'Parking brake cylinder rubber kit'),
    (v_m5, 'Parking Brake Cylinder Rubber Kit', '4th POH', '3-Phase', 'Parking brake cylinder rubber kit'),
    (v_m5, 'OH Kit - AWS/DMH (Rotex/KBIL/Escort)', '1st POH', '3-Phase', 'OH kit for AWS/DMH Rotex/KBIL/Escort'),
    (v_m5, 'OH Kit - AWS/DMH (Rotex/KBIL/Escort)', '2nd POH', '3-Phase', 'OH kit for AWS/DMH Rotex/KBIL/Escort'),
    (v_m5, 'OH Kit - AWS/DMH (Rotex/KBIL/Escort)', '3rd POH', '3-Phase', 'OH kit for AWS/DMH Rotex/KBIL/Escort'),
    (v_m5, 'OH Kit - AWS/DMH (Rotex/KBIL/Escort)', '4th POH', '3-Phase', 'OH kit for AWS/DMH Rotex/KBIL/Escort'),
    (v_m5, 'OH Kit - ADV Magnet Valve (Rotex)', '1st POH', '3-Phase', 'OH kit for ADV magnet valve Rotex'),
    (v_m5, 'OH Kit - ADV Magnet Valve (Rotex)', '2nd POH', '3-Phase', 'OH kit for ADV magnet valve Rotex'),
    (v_m5, 'OH Kit - ADV Magnet Valve (Rotex)', '3rd POH', '3-Phase', 'OH kit for ADV magnet valve Rotex'),
    (v_m5, 'OH Kit - ADV Magnet Valve (Rotex)', '4th POH', '3-Phase', 'OH kit for ADV magnet valve Rotex'),
    (v_m5, 'OH Kit - Hooter Magnet Valve', '1st POH', '3-Phase', 'OH kit for hooter magnet valve'),
    (v_m5, 'OH Kit - Hooter Magnet Valve', '2nd POH', '3-Phase', 'OH kit for hooter magnet valve'),
    (v_m5, 'OH Kit - Hooter Magnet Valve', '3rd POH', '3-Phase', 'OH kit for hooter magnet valve'),
    (v_m5, 'OH Kit - Hooter Magnet Valve', '4th POH', '3-Phase', 'OH kit for hooter magnet valve'),
    (v_m5, 'Guards Emergency Valve', '1st POH', '3-Phase', 'Guards emergency valve'),
    (v_m5, 'Guards Emergency Valve', '2nd POH', '3-Phase', 'Guards emergency valve'),
    (v_m5, 'Guards Emergency Valve', '3rd POH', '3-Phase', 'Guards emergency valve'),
    (v_m5, 'Guards Emergency Valve', '4th POH', '3-Phase', 'Guards emergency valve'),
    (v_m5, 'Hose Connection', '1st POH', '3-Phase', 'Hose connection'),
    (v_m5, 'Hose Connection', '2nd POH', '3-Phase', 'Hose connection'),
    (v_m5, 'Hose Connection', '3rd POH', '3-Phase', 'Hose connection'),
    (v_m5, 'Hose Connection', '4th POH', '3-Phase', 'Hose connection')
  ON CONFLICT DO NOTHING;

-- 2. VCB → E2 (3-Phase)
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_e2, 'VCB AOH Kit (2yr periodicity)', '1st POH', '3-Phase', 'VCB overhauling AOH kit - 2 years periodicity'),
    (v_e2, 'VCB AOH Kit (2yr periodicity)', '2nd POH', '3-Phase', 'VCB overhauling AOH kit - 2 years periodicity'),
    (v_e2, 'VCB AOH Kit (2yr periodicity)', '3rd POH', '3-Phase', 'VCB overhauling AOH kit - 2 years periodicity'),
    (v_e2, 'VCB AOH Kit (2yr periodicity)', '4th POH', '3-Phase', 'VCB overhauling AOH kit - 2 years periodicity'),
    (v_e2, 'VCB IOH Kit (4yr periodicity)', '2nd POH', '3-Phase', 'VCB overhauling IOH kit - 4 years periodicity'),
    (v_e2, 'VCB IOH Kit (4yr periodicity)', '4th POH', '3-Phase', 'VCB overhauling IOH kit - 4 years periodicity'),
    (v_e2, 'VCB Complete Pressure Regulator', '4th POH', '3-Phase', 'Complete pressure regulator for VCB'),
    (v_e2, 'VCB Rear & Front Horizontal Sleeve', '4th POH', '3-Phase', 'Rear and front horizontal sleeve of VCB'),
    (v_e2, 'OH Kit - Air Drier VCB', '4th POH', '3-Phase', 'OH kit of air-drier VCB')
  ON CONFLICT DO NOTHING;

-- 3. TRANSFORMER → E2 (3-Phase)
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_e2, 'Silica Gel - Transformer', '1st POH', '3-Phase', 'Silica gel orange spherical beads 3-5mm'),
    (v_e2, 'Silica Gel - Transformer', '2nd POH', '3-Phase', 'Silica gel orange spherical beads 3-5mm'),
    (v_e2, 'Silica Gel - Transformer', '3rd POH', '3-Phase', 'Silica gel orange spherical beads 3-5mm'),
    (v_e2, 'Silica Gel - Transformer', '4th POH', '3-Phase', 'Silica gel orange spherical beads 3-5mm'),
    (v_e2, 'Radiator Blower Motor Foundation Dampers', '4th POH', '3-Phase', 'Radiator heat exchanger blower motor foundation dampers')
  ON CONFLICT DO NOTHING;

-- 4. OTHER ITEMS → M2 (3-Phase)
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m2, 'All Connector Rubber Gaskets', '1st POH', '3-Phase', 'Replacement of all connector rubber gasket'),
    (v_m2, 'All Connector Rubber Gaskets', '2nd POH', '3-Phase', 'Replacement of all connector rubber gasket'),
    (v_m2, 'All Connector Rubber Gaskets', '3rd POH', '3-Phase', 'Replacement of all connector rubber gasket'),
    (v_m2, 'All Connector Rubber Gaskets', '4th POH', '3-Phase', 'Replacement of all connector rubber gasket')
  ON CONFLICT DO NOTHING;

-- 5. PANTOGRAPH → M3 (3-Phase)
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m3, 'Rubber Kit - Pressure Regulator/Throttle Valve/Filter', '1st POH', '3-Phase', 'Rubber kit of pressure regulator throttle valve and inlet filter'),
    (v_m3, 'Rubber Kit - Pressure Regulator/Throttle Valve/Filter', '2nd POH', '3-Phase', 'Rubber kit of pressure regulator throttle valve and inlet filter'),
    (v_m3, 'Rubber Kit - Pressure Regulator/Throttle Valve/Filter', '3rd POH', '3-Phase', 'Rubber kit of pressure regulator throttle valve and inlet filter'),
    (v_m3, 'Rubber Kit - Pressure Regulator/Throttle Valve/Filter', '4th POH', '3-Phase', 'Rubber kit of pressure regulator throttle valve and inlet filter'),
    (v_m3, 'All Flexible Shunts', '1st POH', '3-Phase', 'All flexible shunts for pantograph'),
    (v_m3, 'All Flexible Shunts', '2nd POH', '3-Phase', 'All flexible shunts for pantograph'),
    (v_m3, 'All Flexible Shunts', '3rd POH', '3-Phase', 'All flexible shunts for pantograph'),
    (v_m3, 'All Flexible Shunts', '4th POH', '3-Phase', 'All flexible shunts for pantograph'),
    (v_m3, 'Rocker Box Assembly Leaf Spring', '1st POH', '3-Phase', 'Rocker box assembly leaf spring'),
    (v_m3, 'Rocker Box Assembly Leaf Spring', '2nd POH', '3-Phase', 'Rocker box assembly leaf spring'),
    (v_m3, 'Rocker Box Assembly Leaf Spring', '3rd POH', '3-Phase', 'Rocker box assembly leaf spring'),
    (v_m3, 'Rocker Box Assembly Leaf Spring', '4th POH', '3-Phase', 'Rocker box assembly leaf spring'),
    (v_m3, 'Rubber Kit & Spring - Quick Exhaust Valve', '1st POH', '3-Phase', 'Rubber kit and spring in quick exhaust valve'),
    (v_m3, 'Rubber Kit & Spring - Quick Exhaust Valve', '2nd POH', '3-Phase', 'Rubber kit and spring in quick exhaust valve'),
    (v_m3, 'Rubber Kit & Spring - Quick Exhaust Valve', '3rd POH', '3-Phase', 'Rubber kit and spring in quick exhaust valve'),
    (v_m3, 'Rubber Kit & Spring - Quick Exhaust Valve', '4th POH', '3-Phase', 'Rubber kit and spring in quick exhaust valve'),
    (v_m3, 'Rubber Bellow', '1st POH', '3-Phase', 'Rubber bellow for pantograph'),
    (v_m3, 'Rubber Bellow', '2nd POH', '3-Phase', 'Rubber bellow for pantograph'),
    (v_m3, 'Rubber Bellow', '3rd POH', '3-Phase', 'Rubber bellow for pantograph'),
    (v_m3, 'Rubber Bellow', '4th POH', '3-Phase', 'Rubber bellow for pantograph')
  ON CONFLICT DO NOTHING;

  -- 5.6-5.8 Panto 3-Phase — Every 4th POH
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m3, 'Set of Bearings - Panto WBL 22.03', '4th POH', '3-Phase', 'Set of bearings for pantograph type WBL 22.03'),
    (v_m3, 'Flexible Shunt - AC Panto WBL 22.03', '4th POH', '3-Phase', 'Flexible shunt for AC panto type WBL 22.03'),
    (v_m3, 'Insulating Hoses', '4th POH', '3-Phase', 'Insulating hoses for pantograph')
  ON CONFLICT DO NOTHING;

-- 6. BOGIE ITEMS → M6 (3-Phase)
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m6, 'Rubber Packing - Axle Guide', '1st POH', '3-Phase', 'Rubber packing for axle guide'),
    (v_m6, 'Rubber Packing - Axle Guide', '2nd POH', '3-Phase', 'Rubber packing for axle guide'),
    (v_m6, 'Rubber Packing - Axle Guide', '3rd POH', '3-Phase', 'Rubber packing for axle guide'),
    (v_m6, 'Rubber Packing - Axle Guide', '4th POH', '3-Phase', 'Rubber packing for axle guide'),
    (v_m6, 'Nylon Rubbing Plate', '1st POH', '3-Phase', 'Nylon rubbing plate'),
    (v_m6, 'Nylon Rubbing Plate', '2nd POH', '3-Phase', 'Nylon rubbing plate'),
    (v_m6, 'Nylon Rubbing Plate', '3rd POH', '3-Phase', 'Nylon rubbing plate'),
    (v_m6, 'Nylon Rubbing Plate', '4th POH', '3-Phase', 'Nylon rubbing plate'),
    (v_m6, 'Guide Bush for Axle Guide', '1st POH', '3-Phase', 'Guide bush for axle guide'),
    (v_m6, 'Guide Bush for Axle Guide', '2nd POH', '3-Phase', 'Guide bush for axle guide'),
    (v_m6, 'Guide Bush for Axle Guide', '3rd POH', '3-Phase', 'Guide bush for axle guide'),
    (v_m6, 'Guide Bush for Axle Guide', '4th POH', '3-Phase', 'Guide bush for axle guide'),
    (v_m6, 'Side Bearer Oil Well Seal', '1st POH', '3-Phase', 'Side bearer oil well seal'),
    (v_m6, 'Side Bearer Oil Well Seal', '2nd POH', '3-Phase', 'Side bearer oil well seal'),
    (v_m6, 'Side Bearer Oil Well Seal', '3rd POH', '3-Phase', 'Side bearer oil well seal'),
    (v_m6, 'Side Bearer Oil Well Seal', '4th POH', '3-Phase', 'Side bearer oil well seal')
  ON CONFLICT DO NOTHING;

-- 7. HVAC SYSTEM → E5 (3-Phase)
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_e5, 'HVAC Filters', '1st POH', '3-Phase', 'HVAC filters'),
    (v_e5, 'HVAC Filters', '2nd POH', '3-Phase', 'HVAC filters'),
    (v_e5, 'HVAC Filters', '3rd POH', '3-Phase', 'HVAC filters'),
    (v_e5, 'HVAC Filters', '4th POH', '3-Phase', 'HVAC filters'),
    (v_e5, 'HVAC Blower Bearings', '4th POH', '3-Phase', 'HVAC blower bearings'),
    (v_e5, 'HVAC Compressor Oil', '4th POH', '3-Phase', 'HVAC compressor oil')
  ON CONFLICT DO NOTHING;

-- 8. AUTOMATIC DOOR CLOSER → M2 (3-Phase)
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m2, 'Door Closer Rubber Components Kit', '1st POH', '3-Phase', 'Door closer rubber components kit'),
    (v_m2, 'Door Closer Rubber Components Kit', '2nd POH', '3-Phase', 'Door closer rubber components kit'),
    (v_m2, 'Door Closer Rubber Components Kit', '3rd POH', '3-Phase', 'Door closer rubber components kit'),
    (v_m2, 'Door Closer Rubber Components Kit', '4th POH', '3-Phase', 'Door closer rubber components kit'),
    (v_m2, 'Door Closer Sensors', '4th POH', '3-Phase', 'Door closer sensors')
  ON CONFLICT DO NOTHING;

-- 9. BATTERY CHARGER → E5 (3-Phase)
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_e5, 'Battery Charger Capacitors', '4th POH', '3-Phase', 'Battery charger capacitors'),
    (v_e5, 'Battery Charger Diodes', '4th POH', '3-Phase', 'Battery charger diodes')
  ON CONFLICT DO NOTHING;

-- 10. COUPLERS → M6 (3-Phase)
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m6, 'Coupler Rubber Components', '1st POH', '3-Phase', 'Coupler rubber components'),
    (v_m6, 'Coupler Rubber Components', '2nd POH', '3-Phase', 'Coupler rubber components'),
    (v_m6, 'Coupler Rubber Components', '3rd POH', '3-Phase', 'Coupler rubber components'),
    (v_m6, 'Coupler Rubber Components', '4th POH', '3-Phase', 'Coupler rubber components'),
    (v_m6, 'Coupler Mechanical Parts', '4th POH', '3-Phase', 'Coupler mechanical parts')
  ON CONFLICT DO NOTHING;

-- 11. WHEELS & AXLES → M6 (3-Phase)
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m6, 'Axle Bearings (Condition Based)', '4th POH', '3-Phase', 'Axle bearings - condition based replacement'),
    (v_m6, 'Wheel Re-profiling (Condition Based)', '4th POH', '3-Phase', 'Wheel re-profiling - condition based')
  ON CONFLICT DO NOTHING;

-- 12. CONVERTERS & INVERTERS → E2 (3-Phase)
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_e2, 'Converter Capacitors', '4th POH', '3-Phase', 'Converter capacitors'),
    (v_e2, 'Converter IGBT Modules (Condition Based)', '4th POH', '3-Phase', 'Converter IGBT modules - condition based'),
    (v_e2, 'Converter Cooling Fans', '4th POH', '3-Phase', 'Converter cooling fans')
  ON CONFLICT DO NOTHING;

-- 13. COMPRESSOR ITEMS → M8 (3-Phase)
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m8, 'Main Compressor OH Kit', '1st POH', '3-Phase', 'Main compressor overhauling kit'),
    (v_m8, 'Main Compressor OH Kit', '2nd POH', '3-Phase', 'Main compressor overhauling kit'),
    (v_m8, 'Main Compressor OH Kit', '3rd POH', '3-Phase', 'Main compressor overhauling kit'),
    (v_m8, 'Main Compressor OH Kit', '4th POH', '3-Phase', 'Main compressor overhauling kit'),
    (v_m8, 'Main Compressor Oil Filter', '1st POH', '3-Phase', 'Main compressor oil filter'),
    (v_m8, 'Main Compressor Oil Filter', '2nd POH', '3-Phase', 'Main compressor oil filter'),
    (v_m8, 'Main Compressor Oil Filter', '3rd POH', '3-Phase', 'Main compressor oil filter'),
    (v_m8, 'Main Compressor Oil Filter', '4th POH', '3-Phase', 'Main compressor oil filter'),
    (v_m8, 'Main Compressor Suction Filter', '1st POH', '3-Phase', 'Main compressor suction filter'),
    (v_m8, 'Main Compressor Suction Filter', '2nd POH', '3-Phase', 'Main compressor suction filter'),
    (v_m8, 'Main Compressor Suction Filter', '3rd POH', '3-Phase', 'Main compressor suction filter'),
    (v_m8, 'Main Compressor Suction Filter', '4th POH', '3-Phase', 'Main compressor suction filter'),
    (v_m8, 'Main Compressor Oil', '1st POH', '3-Phase', 'Main compressor oil'),
    (v_m8, 'Main Compressor Oil', '2nd POH', '3-Phase', 'Main compressor oil'),
    (v_m8, 'Main Compressor Oil', '3rd POH', '3-Phase', 'Main compressor oil'),
    (v_m8, 'Main Compressor Oil', '4th POH', '3-Phase', 'Main compressor oil'),
    (v_m8, 'Main Compressor Safety Valve', '1st POH', '3-Phase', 'Main compressor safety valve'),
    (v_m8, 'Main Compressor Safety Valve', '2nd POH', '3-Phase', 'Main compressor safety valve'),
    (v_m8, 'Main Compressor Safety Valve', '3rd POH', '3-Phase', 'Main compressor safety valve'),
    (v_m8, 'Main Compressor Safety Valve', '4th POH', '3-Phase', 'Main compressor safety valve'),
    (v_m8, 'Main Compressor NRV Gasket', '1st POH', '3-Phase', 'Main compressor non-return valve gasket'),
    (v_m8, 'Main Compressor NRV Gasket', '2nd POH', '3-Phase', 'Main compressor non-return valve gasket'),
    (v_m8, 'Main Compressor NRV Gasket', '3rd POH', '3-Phase', 'Main compressor non-return valve gasket'),
    (v_m8, 'Main Compressor NRV Gasket', '4th POH', '3-Phase', 'Main compressor non-return valve gasket')
  ON CONFLICT DO NOTHING;

  -- More M8 3-Phase compressor items
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m8, 'Aux Compressor OH Kit', '1st POH', '3-Phase', 'Aux compressor overhauling kit'),
    (v_m8, 'Aux Compressor OH Kit', '2nd POH', '3-Phase', 'Aux compressor overhauling kit'),
    (v_m8, 'Aux Compressor OH Kit', '3rd POH', '3-Phase', 'Aux compressor overhauling kit'),
    (v_m8, 'Aux Compressor OH Kit', '4th POH', '3-Phase', 'Aux compressor overhauling kit'),
    (v_m8, 'Aux Compressor Valve Plates', '1st POH', '3-Phase', 'Aux compressor valve plates'),
    (v_m8, 'Aux Compressor Valve Plates', '2nd POH', '3-Phase', 'Aux compressor valve plates'),
    (v_m8, 'Aux Compressor Valve Plates', '3rd POH', '3-Phase', 'Aux compressor valve plates'),
    (v_m8, 'Aux Compressor Valve Plates', '4th POH', '3-Phase', 'Aux compressor valve plates'),
    (v_m8, 'LP-HP Valve Set - Oil Free Compressor', '1st POH', '3-Phase', 'Set of LP-HP valve for oil free compressor'),
    (v_m8, 'LP-HP Valve Set - Oil Free Compressor', '2nd POH', '3-Phase', 'Set of LP-HP valve for oil free compressor'),
    (v_m8, 'LP-HP Valve Set - Oil Free Compressor', '3rd POH', '3-Phase', 'Set of LP-HP valve for oil free compressor'),
    (v_m8, 'LP-HP Valve Set - Oil Free Compressor', '4th POH', '3-Phase', 'Set of LP-HP valve for oil free compressor'),
    (v_m8, 'Cylinder Valve Plate', '1st POH', '3-Phase', 'Cylinder valve plate for compressor'),
    (v_m8, 'Cylinder Valve Plate', '2nd POH', '3-Phase', 'Cylinder valve plate for compressor'),
    (v_m8, 'Cylinder Valve Plate', '3rd POH', '3-Phase', 'Cylinder valve plate for compressor'),
    (v_m8, 'Cylinder Valve Plate', '4th POH', '3-Phase', 'Cylinder valve plate for compressor'),
    (v_m8, 'Suction Filters', '1st POH', '3-Phase', 'Suction filters for compressor'),
    (v_m8, 'Suction Filters', '2nd POH', '3-Phase', 'Suction filters for compressor'),
    (v_m8, 'Suction Filters', '3rd POH', '3-Phase', 'Suction filters for compressor'),
    (v_m8, 'Suction Filters', '4th POH', '3-Phase', 'Suction filters for compressor'),
    (v_m8, 'Oil Breather Filter', '1st POH', '3-Phase', 'Oil breather filter'),
    (v_m8, 'Oil Breather Filter', '2nd POH', '3-Phase', 'Oil breather filter'),
    (v_m8, 'Oil Breather Filter', '3rd POH', '3-Phase', 'Oil breather filter'),
    (v_m8, 'Oil Breather Filter', '4th POH', '3-Phase', 'Oil breather filter'),
    (v_m8, 'Compressor Bearings', '4th POH', '3-Phase', 'Compressor bearings'),
    (v_m8, 'Compressor Oil', '1st POH', '3-Phase', 'Compressor oil'),
    (v_m8, 'Compressor Oil', '2nd POH', '3-Phase', 'Compressor oil'),
    (v_m8, 'Compressor Oil', '3rd POH', '3-Phase', 'Compressor oil'),
    (v_m8, 'Compressor Oil', '4th POH', '3-Phase', 'Compressor oil'),
    (v_m8, 'Micro Filter Element - Air Dryer Final Filter', '1st POH', '3-Phase', 'Micro filter element for final filter assembly of air dryer'),
    (v_m8, 'Micro Filter Element - Air Dryer Final Filter', '2nd POH', '3-Phase', 'Micro filter element for final filter assembly of air dryer'),
    (v_m8, 'Micro Filter Element - Air Dryer Final Filter', '3rd POH', '3-Phase', 'Micro filter element for final filter assembly of air dryer'),
    (v_m8, 'Micro Filter Element - Air Dryer Final Filter', '4th POH', '3-Phase', 'Micro filter element for final filter assembly of air dryer')
  ON CONFLICT DO NOTHING;

-- 14. AIR DRYER → M5 (3-Phase)
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_m5, 'Air Dryer Desiccant Kit', '1st POH', '3-Phase', 'Desiccant kit for air dryer'),
    (v_m5, 'Air Dryer Desiccant Kit', '2nd POH', '3-Phase', 'Desiccant kit for air dryer'),
    (v_m5, 'Air Dryer Desiccant Kit', '3rd POH', '3-Phase', 'Desiccant kit for air dryer'),
    (v_m5, 'Air Dryer Desiccant Kit', '4th POH', '3-Phase', 'Desiccant kit for air dryer'),
    (v_m5, 'Air Dryer IOH Kit', '2nd POH', '3-Phase', 'IOH kit for air dryer'),
    (v_m5, 'Air Dryer IOH Kit', '4th POH', '3-Phase', 'IOH kit for air dryer'),
    (v_m5, 'Air Dryer OH Maintenance Kit', '3rd POH', '3-Phase', 'OH maintenance kit for air dryer'),
    (v_m5, 'Air Dryer Bearings', '4th POH', '3-Phase', 'Air dryer bearings')
  ON CONFLICT DO NOTHING;

-- 15. AUXILIARY EQUIPMENT → E5 (3-Phase)
  INSERT INTO must_change_item_templates (section_id, item_name, poh_cycle, rake_type, description) VALUES
    (v_e5, 'Bearing 6204 AHU', '4th POH', '3-Phase', 'Bearing 6204 for AHU'),
    (v_e5, 'Oil Pump O-Ring', '1st POH', '3-Phase', 'Oil pump O ring'),
    (v_e5, 'Oil Pump O-Ring', '2nd POH', '3-Phase', 'Oil pump O ring'),
    (v_e5, 'Oil Pump O-Ring', '3rd POH', '3-Phase', 'Oil pump O ring'),
    (v_e5, 'Oil Pump O-Ring', '4th POH', '3-Phase', 'Oil pump O ring'),
    (v_e5, 'Oil Pump Bearing', '4th POH', '3-Phase', 'Oil pump bearing'),
    (v_e5, 'Radiator Blower Bearing', '4th POH', '3-Phase', 'Radiator blower bearing')
  ON CONFLICT DO NOTHING;

END $;
