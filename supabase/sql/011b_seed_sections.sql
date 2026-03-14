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

