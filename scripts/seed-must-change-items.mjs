#!/usr/bin/env node
/**
 * Seed must_change_item_templates via Supabase REST API.
 * Run: node scripts/seed-must-change-items.mjs
 */

const SUPABASE_URL = 'https://zejuqchrfyrfpujmxnud.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  // Try reading from .env.local
  const fs = await import('fs');
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  const match = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
  if (match) {
    var KEY = match[1].trim();
  } else {
    console.error('SUPABASE_SERVICE_ROLE_KEY not found');
    process.exit(1);
  }
} else {
  var KEY = SERVICE_ROLE_KEY;
}

const headers = {
  'apikey': KEY,
  'Authorization': `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'resolution=ignore-duplicates',
};

// Section ID mapping
const SECTIONS = {
  M2: '300ad132-f795-4732-ac9f-c3b2e8b9df54',
  M3: '31794315-efb2-4026-87f5-ef20703c23c9',
  M5: 'f53b3498-0361-48a8-9626-a0a1eb46c8b9',
  M6: '545128ac-cee6-4fa6-b9e8-b542a6143346',
  M8: '89619071-3898-424a-8fda-d0df2f849f6b',
  E2: 'cb8811ac-e313-429d-b645-6cddca614a81',
  E3: '113779d6-6b83-4015-af8d-ce11071f45d1',
  E5: 'c8d8ff99-e858-45db-a97d-d01b25f86f5c',
};

// Helper: create rows for "Every POH" items
function everyPOH(sectionCode, itemName, rakeType, description) {
  return ['1st POH', '2nd POH', '3rd POH', '4th POH'].map(cycle => ({
    section_id: SECTIONS[sectionCode], item_name: itemName, poh_cycle: cycle, rake_type: rakeType, description,
  }));
}

// Helper: create rows for "Every 2nd POH" items (2nd + 4th)
function every2ndPOH(sectionCode, itemName, rakeType, description) {
  return ['2nd POH', '4th POH'].map(cycle => ({
    section_id: SECTIONS[sectionCode], item_name: itemName, poh_cycle: cycle, rake_type: rakeType, description,
  }));
}

// Helper: single POH cycle
function singlePOH(sectionCode, itemName, cycle, rakeType, description) {
  return [{ section_id: SECTIONS[sectionCode], item_name: itemName, poh_cycle: cycle, rake_type: rakeType, description }];
}

const items = [];

// ================================================================
// CONVENTIONAL EMU/MEMU — Must Change Items
// ================================================================

// 1. AUXILIARY MOTOR → E3
items.push(...singlePOH('E3', 'Needle Bearing for MCP (Aux Motor)', '4th POH', 'Conventional', 'Needle bearing for master controller pilot auxiliary motor'));
items.push(...singlePOH('E3', 'Oil Sealing Ring - Oil Pump', '4th POH', 'Conventional', 'Oil sealing ring for oil pump'));
items.push(...singlePOH('E3', 'Bearings - Aux Motors (Comp/Oil/Radiator/Rectifier)', '4th POH', 'Conventional', 'Bearings for compressor motor, aux comp motor, oil pump, radiator cooling fan motor and rectifier fan motor'));
items.push(...singlePOH('E3', 'Capacitors for AC Motors', '4th POH', 'Conventional', 'Capacitors for AC motors'));

// 2. COUPLER → M6
items.push(...everyPOH('M6', 'Polyamide Bush for Coupler', 'Conventional', 'Polyamide bush for coupler'));
items.push(...everyPOH('M6', 'Sliding Plate for Coupler', 'Conventional', 'Sliding plate for coupler'));

// 3. BOGIE → M6 (Every POH items)
items.push(...everyPOH('M6', 'Rubber Snubber for Axle Box', 'Conventional', 'Rubber snubber for axle box'));
items.push(...everyPOH('M6', 'Rubber Packing Ring - Axle Guide', 'Conventional', 'Rubber packing ring for axle guide'));
items.push(...everyPOH('M6', 'Nylon Rubbing Plate', 'Conventional', 'Nylon rubbing plate for bogie'));
items.push(...everyPOH('M6', 'Guide Bush for Axle Guide', 'Conventional', 'Guide bush for axle guide'));
items.push(...everyPOH('M6', 'Hanger - Bolster Suspension Swing Link', 'Conventional', 'Hanger for bolster suspension swing link and hanger block'));
items.push(...everyPOH('M6', 'Brake Beam Hanger Inner', 'Conventional', 'Brake beam hanger inner'));
items.push(...everyPOH('M6', 'Steel Rubbing Plate', 'Conventional', 'Steel rubbing plate for bogie'));
// Bogie 4th POH items
items.push(...singlePOH('M6', 'Brake Beam', '4th POH', 'Conventional', 'Brake beam replacement'));
items.push(...singlePOH('M6', 'Brake Hanger Bush', '4th POH', 'Conventional', 'Brake hanger bush'));
items.push(...singlePOH('M6', 'Brake Shoe Bush', '4th POH', 'Conventional', 'Brake shoe bush'));

// 4. BOGIE ASSEMBLY → M6 (Every POH)
items.push(...everyPOH('M6', 'Wick Pad - Axle Lubricating Assembly', 'Conventional', 'Wick pad for axle lubricating assembly'));
items.push(...everyPOH('M6', 'Felt for Dust Guard', 'Conventional', 'Felt for dust guard'));
items.push(...everyPOH('M6', 'Felt for Gear Case', 'Conventional', 'Felt for dust guard gear case'));
items.push(...everyPOH('M6', 'Sandwich Rubber Pad - Nose Suspension', 'Conventional', 'Sandwich rubber pad for nose suspension unit'));
items.push(...everyPOH('M6', 'Lower Rubber Washer', 'Conventional', 'Lower rubber washer'));
items.push(...everyPOH('M6', 'Upper Rubber Washer for TC', 'Conventional', 'Upper rubber washer for TC'));
items.push(...everyPOH('M6', 'Hytrel Washer for TC', 'Conventional', 'Hytrel washer for TC'));
items.push(...everyPOH('M6', 'Shock Absorber for MC', 'Conventional', 'Shock absorber for MC'));
items.push(...everyPOH('M6', 'Sealing Cap - Centre Pivot TC', 'Conventional', 'Sealing cap for center pivot of TC'));
items.push(...everyPOH('M6', 'Felt Ring for Axle Box', 'Conventional', 'Felt ring for axle box'));
items.push(...everyPOH('M6', 'Axle Lubricating Assembly', 'Conventional', 'Axle lubricating assembly'));
items.push(...everyPOH('M6', 'Dust Guard', 'Conventional', 'Dust guard'));
// Bogie Assembly 4th POH
items.push(...singlePOH('M6', 'Top/Bottom Spring Plate - Nose Suspension', '4th POH', 'Conventional', 'Extreme top and bottom spring plate for nose suspension unit'));
items.push(...singlePOH('M6', 'Steel Bush - Nose Suspension', '4th POH', 'Conventional', 'Steel bush for nose suspension unit'));
items.push(...singlePOH('M6', 'Suspension Bearing', '4th POH', 'Conventional', 'Suspension bearing'));
items.push(...singlePOH('M6', 'Shock Absorber for TC (OH Kit)', '4th POH', 'Conventional', 'Shock absorber for TC overhauled using proper kit'));
items.push(...singlePOH('M6', 'Silent Block - Anchor Link', '4th POH', 'Conventional', 'Silent block for anchor link'));
items.push(...singlePOH('M6', 'Axle Shield', '4th POH', 'Conventional', 'Axle shield'));
items.push(...singlePOH('M6', 'Helical Spring', '4th POH', 'Conventional', 'Helical spring'));
items.push(...singlePOH('M6', 'Silent Block - Centre Pivot', '4th POH', 'Conventional', 'Silent block for centre pivot'));
items.push(...singlePOH('M6', 'Gear Case', '4th POH', 'Conventional', 'Gear case'));
items.push(...singlePOH('M6', 'Split Ring Clamp - Centre Pivot', '4th POH', 'Conventional', 'Split ring clamp for centre pivot'));
items.push(...singlePOH('M6', 'Safety Sling', '4th POH', 'Conventional', 'Safety sling'));

// 5. COMPRESSOR → M8
items.push(...everyPOH('M8', 'Valve Plates & Packing Ring - Aux Compressor', 'Conventional', 'Valve plates and packing ring for aux compressor'));
items.push(...everyPOH('M8', 'Compressor OH Kit (Every POH) per OEM', 'Conventional', 'Overhauling kit every POH for compressor as per OEM'));
items.push(...every2ndPOH('M8', 'Compressor OH Kit (Alternate POH) per OEM', 'Conventional', 'Overhauling kit alternate POH for compressor as per OEM'));
items.push(...singlePOH('M8', 'Compressor OH Kit (Every 3rd POH) per OEM', '3rd POH', 'Conventional', 'Overhauling kit every third POH for compressor as per OEM'));
items.push(...everyPOH('M8', 'Gasket - NRV Main Compressor', 'Conventional', 'Gasket for non-return valve for main compressor'));
items.push(...everyPOH('M8', 'Filter Element - Centrifugal Dirt Collector', 'Conventional', 'Filter element for centrifugal dirt collector'));

// 6. HEAD LIGHT → E5
items.push(...everyPOH('E5', 'Reflector for Head Light', 'Conventional', 'Reflector for head light'));
items.push(...everyPOH('E5', 'Holder Assembly for Head Light', 'Conventional', 'Holder assembly for head light'));
items.push(...everyPOH('E5', 'Rotary Switch for Head Light', 'Conventional', 'Rotary switch for head light'));

// 7. LT PANEL → E2
items.push(...everyPOH('E2', 'Fixed & Moving Contact for CC1', 'Conventional', 'Fixed and moving contact for CC1'));
items.push(...everyPOH('E2', 'Spring for CC1', 'Conventional', 'Spring for CC1'));
items.push(...everyPOH('E2', 'Fixed & Moving Contact - Light Contactor', 'Conventional', 'Fixed and moving contact for light contactor'));
items.push(...everyPOH('E2', 'Arc Chute for CC1', 'Conventional', 'Arc chute for CC1'));

// 8. MASTER CONTROLLER → E2
items.push(...everyPOH('E2', 'Springs for Master Controller', 'Conventional', 'Springs for master controller'));
items.push(...everyPOH('E2', 'Contact Screw - Master Controller', 'Conventional', 'Contact screw for master controller'));
items.push(...everyPOH('E2', 'Valve Stem - Master Controller', 'Conventional', 'Valve stem for master controller'));
items.push(...singlePOH('E2', 'Cam for Master Controller', '4th POH', 'Conventional', 'Cam for master controller'));
items.push(...singlePOH('E2', 'Contact Finger Assembly - Master Controller', '4th POH', 'Conventional', 'Contact finger assembly for master controller'));

// 9. PANTOGRAPH → M3
items.push(...everyPOH('M3', 'Joint Perfect Rubber for Panto', 'Conventional', 'Joint perfect rubber for pantograph'));
items.push(...everyPOH('M3', 'OH Kit Rubber for Panto (OEM)', 'Conventional', 'Overhauling kit rubber for panto as per OEM'));
items.push(...everyPOH('M3', 'OH Kit for Panto Valve (Rotex)', 'Conventional', 'Overhauling for panto valve as per OEM Rotex'));
items.push(...everyPOH('M3', 'Long & Short Shunts for Panto', 'Conventional', 'Long and short shunts for pantograph'));
items.push(...everyPOH('M3', 'Latching Spring - Panto Valve (BHEL)', 'Conventional', 'Latching spring for panto valve BHEL'));
// Panto 4th POH
items.push(...singlePOH('M3', 'Top Mounting Sub-Assembly Part A/B', '4th POH', 'Conventional', 'Top mounting subassembly part A B'));
items.push(...singlePOH('M3', 'Bearing for Yoke Assembly', '4th POH', 'Conventional', 'Bearing for yoke assembly'));
items.push(...singlePOH('M3', 'Plunger Box Assembly', '4th POH', 'Conventional', 'Plunger box assembly for pantograph'));
items.push(...singlePOH('M3', 'Valve for Panto Operating (BHEL)', '4th POH', 'Conventional', 'Valve for panto operating valve BHEL'));
items.push(...singlePOH('M3', 'Bearings - Pedestal/Push Rod/Articulation', '4th POH', 'Conventional', 'Bearings for pedestal, push rod, lower and middle articulation'));

// 10. PNEUMATIC ITEMS → M5 (Every POH)
items.push(...everyPOH('M5', 'OH Kit - EP Unit (OEM)', 'Conventional', 'Overhauling kit for EP unit as per OEM'));
items.push(...everyPOH('M5', 'OH Kit - Brake Controller (OEM)', 'Conventional', 'Overhauling kit for brake controller as per OEM'));
items.push(...everyPOH('M5', 'O-Ring & Spring - Horn Valve', 'Conventional', 'O ring and spring for foot operated horn valve'));
items.push(...everyPOH('M5', 'Diaphragm for Horn', 'Conventional', 'Diaphragm for horn'));
items.push(...everyPOH('M5', 'OH Kit - Emergency/Dead Man Valve', 'Conventional', 'Overhauling kit for emergency valve / dead mans valve'));
items.push(...everyPOH('M5', 'Piston Packing - Duplex Check Valve', 'Conventional', 'Piston packing for duplex check valve'));
items.push(...everyPOH('M5', 'Packing Rubber - Release Valve', 'Conventional', 'Packing rubber for release valve'));
items.push(...everyPOH('M5', 'Piston Packing Ring - Brake Cylinder', 'Conventional', 'Piston packing ring for brake cylinder'));
items.push(...everyPOH('M5', 'Dust Excluder - Brake Cylinder', 'Conventional', 'Dust excluder for brake cylinder'));
items.push(...everyPOH('M5', 'Gasket - Centrifugal Dirt Collector', 'Conventional', 'Gasket for centrifugal dirt collector'));
items.push(...everyPOH('M5', 'Nylon Filter Elements', 'Conventional', 'Nylon filter elements'));
items.push(...everyPOH('M5', 'All Filter Elements - Pneumatic Circuit', 'Conventional', 'All filter elements of pneumatic circuit'));
items.push(...everyPOH('M5', 'Rubber Braided Hose SAE 100 R1', 'Conventional', 'Rubber braided hose of SAE 100 R1'));
items.push(...everyPOH('M5', 'Wiper Blade', 'Conventional', 'Wiper blade'));
items.push(...everyPOH('M5', 'Wiper Arm', 'Conventional', 'Wiper arm'));
items.push(...everyPOH('M5', 'Valve Guide - Holding/Application Magnet Valve', 'Conventional', 'Valve guide for holding and application magnet valve'));
// Pneumatic 4th POH items
items.push(...singlePOH('M5', 'Foot Operated Horn Valve', '4th POH', 'Conventional', 'Foot operated horn valve'));
items.push(...singlePOH('M5', 'Operating & Locking Pawl - BC', '4th POH', 'Conventional', 'Operating and locking pawl for brake cylinder'));
items.push(...singlePOH('M5', 'Brass Bush - Dust Excluder BC', '4th POH', 'Conventional', 'Brass bush for dust excluder for BC'));
items.push(...singlePOH('M5', 'Seats for Non-Return Valve', '4th POH', 'Conventional', 'Seats for non-return valve'));
items.push(...singlePOH('M5', 'Gauges', '4th POH', 'Conventional', 'Gauges'));
items.push(...singlePOH('M5', 'Magnet Valve for EP Unit', '4th POH', 'Conventional', 'Magnet valve for EP unit'));
items.push(...singlePOH('M5', 'Pressure Switches', '4th POH', 'Conventional', 'Pressure switches'));
items.push(...every2ndPOH('M5', 'Safety Valves', 'Conventional', 'Safety valves'));
items.push(...singlePOH('M5', 'Angle Cocks', '4th POH', 'Conventional', 'Angle cocks'));

// 11. RELAY → E2
items.push(...everyPOH('E2', 'Spring for MT Relays', 'Conventional', 'Spring for MT relays'));
items.push(...everyPOH('E2', 'Moving Contacts for MT Relays', 'Conventional', 'Moving contacts for MT relays'));
items.push(...everyPOH('E2', 'Spring for Overload Relays', 'Conventional', 'Spring for overload relays'));
items.push(...everyPOH('E2', 'Spring for CLR Relay', 'Conventional', 'Spring for CLR relay'));
items.push(...singlePOH('E2', 'Fixed Contacts for MT Relay', '4th POH', 'Conventional', 'Fixed contacts for MT relay'));
items.push(...singlePOH('E2', 'Fingers with Pin - Overload Relays', '4th POH', 'Conventional', 'Short and long fingers with pin for overload relays'));
items.push(...singlePOH('E2', 'Fixed Contacts - Overload Relays', '4th POH', 'Conventional', 'Fixed contacts for overload relays'));
items.push(...singlePOH('E2', 'Finger Assembly - CLR Relay', '4th POH', 'Conventional', 'Finger assembly for CLR relay'));
items.push(...singlePOH('E2', 'Contact Carrier - CLR Relay', '4th POH', 'Conventional', 'Contact carrier for CLR relay'));

// 12. TRACTION MOTOR → E3
items.push(...everyPOH('E3', 'Carbon Brushes - TM', 'Conventional', 'Carbon brushes for traction motor'));
items.push(...everyPOH('E3', 'Earth Brush - TM', 'Conventional', 'Earth brush for traction motor'));
items.push(...everyPOH('E3', 'Felt Ring - TM', 'Conventional', 'Felt ring for traction motor'));
items.push(...everyPOH('E3', 'Oil Seal - TM', 'Conventional', 'Oil seal for traction motor'));
items.push(...everyPOH('E3', 'Mounting Bush - Nose Suspension', 'Conventional', 'Mounting bush for nose suspension'));
items.push(...singlePOH('E3', 'Bearing - TM', '4th POH', 'Conventional', 'Bearing for traction motor'));

// 13. CONTROL GEAR → E2
items.push(...everyPOH('E2', 'Arc Chute - M Contactors', 'Conventional', 'Arc chute for M contactors'));
items.push(...everyPOH('E2', 'Fixed & Moving Contacts - M Contactors', 'Conventional', 'Fixed and moving contacts for M contactors'));
items.push(...everyPOH('E2', 'Return Spring - Contactors', 'Conventional', 'Return spring for contactors'));
items.push(...singlePOH('E2', 'Interlock Spring - Contactors', '4th POH', 'Conventional', 'Interlock spring for contactors'));
items.push(...singlePOH('E2', 'Aux Contact - Contactors', '4th POH', 'Conventional', 'Aux contact for contactors'));

// 14. TRANSFORMER → E2
items.push(...everyPOH('E2', 'Silica Gel - Transformer', 'Conventional', 'Silica gel for transformer'));
items.push(...singlePOH('E2', 'Radiator Blower Motor Foundation Dampers', '4th POH', 'Conventional', 'Radiator heat exchanger blower motor foundation dampers'));

// 15. RECTIFIER → E2
items.push(...singlePOH('E2', 'Capacitors - Rectifier', '4th POH', 'Conventional', 'Capacitors for rectifier'));
items.push(...singlePOH('E2', 'Diodes - Rectifier', '4th POH', 'Conventional', 'Diodes for rectifier'));

// 16. BATTERY → E5
items.push(...every2ndPOH('E5', 'Battery Cells (Condition Based)', 'Conventional', 'Battery cells - condition based replacement'));

// 17. CONSUMABLE ITEMS
items.push(...everyPOH('M5', 'Brake Blocks', 'Conventional', 'Brake blocks - consumable'));
items.push(...everyPOH('M3', 'Panto Strip', 'Conventional', 'Pantograph carbon strip - consumable'));

// 20. VCB → E2
items.push(...everyPOH('E2', 'VCB AOH Kit (2yr periodicity)', 'Conventional', 'VCB overhauling AOH kit - 2 years periodicity'));
items.push(...every2ndPOH('E2', 'VCB IOH Kit (4yr periodicity)', 'Conventional', 'VCB overhauling IOH kit - 4 years periodicity'));
items.push(...singlePOH('E2', 'VCB Complete Pressure Regulator', '4th POH', 'Conventional', 'Complete pressure regulator for VCB'));
items.push(...singlePOH('E2', 'VCB Rear & Front Horizontal Sleeve', '4th POH', 'Conventional', 'Rear and front horizontal sleeve of VCB'));
items.push(...singlePOH('E2', 'OH Kit - Air Drier VCB', '4th POH', 'Conventional', 'OH kit of air-drier VCB'));

// ================================================================
// 3-PHASE EMU/MEMU — Must Change Items
// ================================================================

// 1. BRAKE EQUIPMENT → M5 (3-Phase) - Every POH
items.push(...everyPOH('M5', 'Worm Drive Hose Clips - BC Dust Excluder', '3-Phase', 'Worm drive hose clips for brake cylinder dust excluder big/small'));
items.push(...everyPOH('M5', 'OH Kit - EP Unit (OEM)', '3-Phase', 'Overhauling kit for EP unit as per OEM'));
items.push(...everyPOH('M5', 'Set of Rubber - Modified PRV', '3-Phase', 'Set of rubber for modified PRV'));
items.push(...everyPOH('M5', 'Set of Rubber - Triple Valve', '3-Phase', 'Set of rubber for triple valve'));
items.push(...everyPOH('M5', 'Kit - N1 PRV Parking Brake', '3-Phase', 'Kit of rubber components for N1 type pressure reducing valve for parking brake'));
items.push(...everyPOH('M5', 'Maintenance Kit - Leveling Valve', '3-Phase', 'Maintenance kit of leveling valve'));
items.push(...everyPOH('M5', 'OH Kit - Emergency/Dead Man Valve', '3-Phase', 'Overhauling kit for emergency valve / dead mans valve'));
items.push(...everyPOH('M5', 'OH Kit - Brake Controller (OEM)', '3-Phase', 'Overhauling kit for brake controller as per OEM'));
items.push(...everyPOH('M5', 'Foot Operated Horn Valve', '3-Phase', 'Foot operated horn valve'));
items.push(...everyPOH('M5', 'Diaphragm for Horn OH Kit', '3-Phase', 'Diaphragm for horn overhauling kit'));
items.push(...everyPOH('M5', 'Piston Packing - Duplex Piston Valve Air Drier', '3-Phase', 'Piston packing for duplex piston valve of air drier'));
// More 3-Phase Brake (1.12-1.32)
items.push(...everyPOH('M5', 'Brake Release Valve', '3-Phase', 'Brake release valve'));
items.push(...everyPOH('M5', 'Rubber Kit - Solenoid Valve Parking Brake', '3-Phase', 'Rubber kit of solenoid valve of parking brake'));
items.push(...everyPOH('M5', 'Piston Packing Ring - Brake Cylinder', '3-Phase', 'Piston packing ring of brake cylinder'));
items.push(...everyPOH('M5', 'Dust Excluder', '3-Phase', 'Dust excluder for brake cylinder'));
items.push(...everyPOH('M5', 'Parking Brake Cylinder Rubber Kit', '3-Phase', 'Parking brake cylinder rubber kit'));
items.push(...everyPOH('M5', 'OH Kit - AWS/DMH (Rotex/KBIL/Escort)', '3-Phase', 'OH kit for AWS/DMH Rotex/KBIL/Escort'));
items.push(...everyPOH('M5', 'OH Kit - ADV Magnet Valve (Rotex)', '3-Phase', 'OH kit for ADV magnet valve Rotex'));
items.push(...everyPOH('M5', 'OH Kit - Hooter Magnet Valve', '3-Phase', 'OH kit for hooter magnet valve'));
items.push(...everyPOH('M5', 'Guards Emergency Valve', '3-Phase', 'Guards emergency valve'));
items.push(...everyPOH('M5', 'Hose Connection', '3-Phase', 'Hose connection'));

// 2. VCB → E2 (3-Phase)
items.push(...everyPOH('E2', 'VCB AOH Kit (2yr periodicity)', '3-Phase', 'VCB overhauling AOH kit - 2 years periodicity'));
items.push(...every2ndPOH('E2', 'VCB IOH Kit (4yr periodicity)', '3-Phase', 'VCB overhauling IOH kit - 4 years periodicity'));
items.push(...singlePOH('E2', 'VCB Complete Pressure Regulator', '4th POH', '3-Phase', 'Complete pressure regulator for VCB'));
items.push(...singlePOH('E2', 'VCB Rear & Front Horizontal Sleeve', '4th POH', '3-Phase', 'Rear and front horizontal sleeve of VCB'));
items.push(...singlePOH('E2', 'OH Kit - Air Drier VCB', '4th POH', '3-Phase', 'OH kit of air-drier VCB'));

// 3. TRANSFORMER → E2 (3-Phase)
items.push(...everyPOH('E2', 'Silica Gel - Transformer', '3-Phase', 'Silica gel orange spherical beads 3-5mm'));
items.push(...singlePOH('E2', 'Radiator Blower Motor Foundation Dampers', '4th POH', '3-Phase', 'Radiator heat exchanger blower motor foundation dampers'));

// 4. OTHER ITEMS → M2 (3-Phase)
items.push(...everyPOH('M2', 'All Connector Rubber Gaskets', '3-Phase', 'Replacement of all connector rubber gasket'));

// 5. PANTOGRAPH → M3 (3-Phase)
items.push(...everyPOH('M3', 'Rubber Kit - Pressure Regulator/Throttle Valve/Filter', '3-Phase', 'Rubber kit of pressure regulator throttle valve and inlet filter'));
items.push(...everyPOH('M3', 'All Flexible Shunts', '3-Phase', 'All flexible shunts for pantograph'));
items.push(...everyPOH('M3', 'Rocker Box Assembly Leaf Spring', '3-Phase', 'Rocker box assembly leaf spring'));
items.push(...everyPOH('M3', 'Rubber Kit & Spring - Quick Exhaust Valve', '3-Phase', 'Rubber kit and spring in quick exhaust valve'));
items.push(...everyPOH('M3', 'Rubber Bellow', '3-Phase', 'Rubber bellow for pantograph'));
// Panto 3-Phase 4th POH
items.push(...singlePOH('M3', 'Set of Bearings - Panto WBL 22.03', '4th POH', '3-Phase', 'Set of bearings for pantograph type WBL 22.03'));
items.push(...singlePOH('M3', 'Flexible Shunt - AC Panto WBL 22.03', '4th POH', '3-Phase', 'Flexible shunt for AC panto type WBL 22.03'));
items.push(...singlePOH('M3', 'Insulating Hoses', '4th POH', '3-Phase', 'Insulating hoses for pantograph'));

// 6. BOGIE ITEMS → M6 (3-Phase)
items.push(...everyPOH('M6', 'Rubber Packing - Axle Guide', '3-Phase', 'Rubber packing for axle guide'));
items.push(...everyPOH('M6', 'Nylon Rubbing Plate', '3-Phase', 'Nylon rubbing plate'));
items.push(...everyPOH('M6', 'Guide Bush for Axle Guide', '3-Phase', 'Guide bush for axle guide'));
items.push(...everyPOH('M6', 'Rubber Snubber for Axle Box', '3-Phase', 'Rubber snubber for axle box'));
items.push(...everyPOH('M6', 'Felt Ring for Axle Box', '3-Phase', 'Felt ring for axle box'));
items.push(...everyPOH('M6', 'Shock Absorber', '3-Phase', 'Shock absorber'));
// Bogie 3-Phase 4th POH
items.push(...singlePOH('M6', 'Silent Block - Anchor Link', '4th POH', '3-Phase', 'Silent block for anchor link'));
items.push(...singlePOH('M6', 'Silent Block - Centre Pivot', '4th POH', '3-Phase', 'Silent block for centre pivot'));
items.push(...singlePOH('M6', 'Helical Spring', '4th POH', '3-Phase', 'Helical spring'));
items.push(...singlePOH('M6', 'Axle Shield', '4th POH', '3-Phase', 'Axle shield'));

// 7. HVAC SYSTEM → E5 (3-Phase)
items.push(...everyPOH('E5', 'HVAC Filter Elements', '3-Phase', 'HVAC filter elements'));
items.push(...singlePOH('E5', 'HVAC Compressor OH Kit', '4th POH', '3-Phase', 'HVAC compressor overhauling kit'));
items.push(...every2ndPOH('E5', 'HVAC Blower Bearings', '3-Phase', 'HVAC blower bearings'));

// 8. AUTOMATIC DOOR CLOSER → M2 (3-Phase)
items.push(...everyPOH('M2', 'Door Closer OH Kit', '3-Phase', 'Automatic door closer overhauling kit'));
items.push(...singlePOH('M2', 'Door Closer Bearings', '4th POH', '3-Phase', 'Automatic door closer bearings'));

// 9. BATTERY CHARGER → E5 (3-Phase)
items.push(...singlePOH('E5', 'Battery Charger Capacitors', '4th POH', '3-Phase', 'Battery charger capacitors'));
items.push(...every2ndPOH('E5', 'Battery Cells (Condition Based)', '3-Phase', 'Battery cells - condition based replacement'));

// 10. COUPLERS → M6 (3-Phase)
items.push(...everyPOH('M6', 'Polyamide Bush for Coupler', '3-Phase', 'Polyamide bush for coupler'));
items.push(...everyPOH('M6', 'Sliding Plate for Coupler', '3-Phase', 'Sliding plate for coupler'));

// 11. WHEELS & AXLES → M6 (3-Phase)
items.push(...singlePOH('M6', 'Axle Box Bearings', '4th POH', '3-Phase', 'Axle box bearings'));
items.push(...everyPOH('M6', 'Axle Box Grease', '3-Phase', 'Axle box grease'));

// 12. CONVERTERS & INVERTERS → E2 (3-Phase)
items.push(...singlePOH('E2', 'Converter Capacitors', '4th POH', '3-Phase', 'Converter capacitors'));
items.push(...singlePOH('E2', 'Inverter IGBT Modules', '4th POH', '3-Phase', 'Inverter IGBT modules'));
items.push(...everyPOH('E2', 'Converter/Inverter Filter Elements', '3-Phase', 'Converter and inverter filter elements'));

// 13. COMPRESSOR ITEMS → M8 (3-Phase)
items.push(...everyPOH('M8', 'Compressor OH Kit (Every POH) per OEM', '3-Phase', 'Overhauling kit every POH for compressor as per OEM'));
items.push(...every2ndPOH('M8', 'Compressor OH Kit (Alternate POH) per OEM', '3-Phase', 'Overhauling kit alternate POH for compressor as per OEM'));
items.push(...everyPOH('M8', 'Compressor Air Filter Element', '3-Phase', 'Compressor air filter element'));
items.push(...everyPOH('M8', 'Compressor Oil Filter Element', '3-Phase', 'Compressor oil filter element'));
items.push(...singlePOH('M8', 'Compressor Bearings', '4th POH', '3-Phase', 'Compressor bearings'));
items.push(...everyPOH('M8', 'Compressor Valve Plates', '3-Phase', 'Compressor valve plates'));

// 14. AIR DRYER → M5 (3-Phase)
items.push(...everyPOH('M5', 'Air Dryer Desiccant Kit', '3-Phase', 'Desiccant kit for air dryer'));
items.push(...every2ndPOH('M5', 'Air Dryer IOH Kit', '3-Phase', 'IOH kit for air dryer'));
items.push(...singlePOH('M5', 'Air Dryer OH Maintenance Kit', '3rd POH', '3-Phase', 'OH maintenance kit for air dryer'));
items.push(...singlePOH('M5', 'Air Dryer Bearings', '4th POH', '3-Phase', 'Air dryer bearings'));

// 15. AUXILIARY EQUIPMENT → E5 (3-Phase)
items.push(...singlePOH('E5', 'Bearing 6204 AHU', '4th POH', '3-Phase', 'Bearing 6204 for AHU'));
items.push(...everyPOH('E5', 'Oil Pump O-Ring', '3-Phase', 'Oil pump O ring'));
items.push(...singlePOH('E5', 'Oil Pump Bearing', '4th POH', '3-Phase', 'Oil pump bearing'));
items.push(...singlePOH('E5', 'Radiator Blower Bearing', '4th POH', '3-Phase', 'Radiator blower bearing'));

// ================================================================
// INSERT ALL ITEMS
// ================================================================

console.log(`Total must-change item rows to insert: ${items.length}`);

// Insert in batches of 50
const BATCH_SIZE = 50;
let inserted = 0;
let errors = 0;

for (let i = 0; i < items.length; i += BATCH_SIZE) {
  const batch = items.slice(i, i + BATCH_SIZE);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/must_change_item_templates`, {
    method: 'POST',
    headers,
    body: JSON.stringify(batch),
  });

  if (res.ok) {
    inserted += batch.length;
    process.stdout.write(`\rInserted: ${inserted}/${items.length}`);
  } else {
    const errText = await res.text();
    console.error(`\nBatch ${Math.floor(i/BATCH_SIZE)+1} failed: ${res.status} ${errText}`);
    errors++;
  }
}

console.log(`\n\nDone! Inserted ${inserted} rows, ${errors} batch errors.`);

// Verify count
const verifyRes = await fetch(`${SUPABASE_URL}/rest/v1/must_change_item_templates?select=count`, {
  headers: { ...headers, 'Prefer': 'count=exact' },
});
const verifyData = await verifyRes.json();
console.log(`Total rows in must_change_item_templates: ${verifyData[0]?.count ?? 'unknown'}`);
