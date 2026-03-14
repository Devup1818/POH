# Requirements Document - जॉब कार्ड सेक्शन एनालिसिस

## परिचय (Introduction)

यह फीचर Railway POH Management System में **जॉब कार्ड सेक्शन एनालिसिस** की कार्यक्षमता जोड़ता है। EMU Car Shed, Ghaziabad (Northern Railway) में POH के दौरान हर कोच पर जो काम होता है, वह 10 वर्कशॉप सेक्शन्स में बँटा होता है। हर सेक्शन की अपनी Work Instructions (WI) होती हैं जो rake type (Conventional EMU/MEMU vs 3-Phase EMU/MEMU) और coach type (MC, TC, DTC, DMC, NDTC) के अनुसार अलग-अलग होती हैं।

Reference: RDSO Letter no. EL/4.6.1/3 Phase, dated 08.07.2024

वर्तमान सिस्टम में कोच-लेवल स्टेज ट्रैकिंग, पार्ट्स मैनेजमेंट, और चेकलिस्ट है, लेकिन **सेक्शन-वार कार्य विभाजन** (section-wise work breakdown) की कमी है। जॉब कार्ड सेक्शन एनालिसिस से Section Engineers को पता चलेगा कि कौन सा सेक्शन कौन सा काम करता है, किस सेक्शन में कितना काम बाकी है, Must Change Items कौन से हैं, और कहाँ bottleneck है। इसमें Painting सेक्शन (पूर्ण कोच पेंटिंग) और M4 — M&P / Machinery सेक्शन (सपोर्ट/मशीनरी ऑपरेशन्स) भी शामिल हैं।

## शब्दावली (Glossary)

- **Job_Card**: एक कोच के POH के दौरान किए जाने वाले सभी कार्यों का विस्तृत दस्तावेज़
- **Workshop_Section**: वर्कशॉप का एक विशिष्ट कार्य क्षेत्र जिसका अपना section code होता है (M5, M6, M8, E2, E3, E5, M2, M3, Painting, M4)
- **Work_Instruction (WI)**: किसी सेक्शन के लिए RDSO द्वारा निर्धारित कार्य निर्देश, जिसका एक WI number (e.g., W/M5/01) और VERSION number होता है
- **Must_Change_Item**: वह पार्ट जो POH cycle (1st/2nd/3rd/4th) के अनुसार अनिवार्य रूप से बदलना होता है
- **Rake_Type**: रेक का प्रकार — Conventional EMU/MEMU या 3-Phase EMU/MEMU
- **Coach_Type**: कोच का प्रकार — MC (Motor Coach), TC (Trailer Coach), DTC (Driving Trailer Coach), DMC (Driving Motor Coach), NDTC (Non-Driving Trailer Coach)
- **POH_Cycle**: POH का क्रम — 1st POH, 2nd POH, 3rd POH, 4th POH — जिसके अनुसार Must Change Items बदलते हैं
- **Section_Dashboard**: सभी 10 सेक्शन्स की प्रगति और स्थिति दिखाने वाला दृश्य (view)
- **Painting_Section**: पेंटिंग सेक्शन — POH के दौरान पूरे कोच की पेंटिंग (प्राइमर, पुट्टी, सरफेस प्रिपरेशन, फाइनल कोट, लिवरी मार्किंग) करने वाला सेक्शन
- **M4_Section**: M&P / Machinery सेक्शन — लिफ्टिंग जैक, क्रेन आदि मशीनरी सपोर्ट प्रदान करने वाला cross-cutting सपोर्ट सेक्शन जो अन्य सभी सेक्शन्स को सहायता देता है
- **Section_Engineer**: शेड में POH कार्यों की निगरानी करने वाला अधिकारी
- **Section_Progress**: किसी सेक्शन में पूर्ण हुए कार्यों का प्रतिशत
- **POH_System**: Railway Periodic Overhaul Management System (EMU Car Shed, Ghaziabad)
- **Coach**: रेक का एक व्यक्तिगत डिब्बा जिस पर POH हो रहा है
- **Testing_Format**: प्रत्येक सेक्शन के लिए निर्धारित परीक्षण प्रारूप और पैरामीटर्स
- **SSE (Senior_Section_Engineer)**: वरिष्ठ सेक्शन इंजीनियर — प्रत्येक Workshop_Section का एक SSE होता है जो अपने सेक्शन का जॉब कार्ड डेटा भरता है। Admin द्वारा user creation के समय SSE को उसका assigned section निर्धारित किया जाता है।

## आवश्यकताएँ (Requirements)

### Requirement 1: वर्कशॉप सेक्शन परिभाषा और संरचना (Workshop Section Definition & Structure)

**User Story:** As a Section_Engineer, I want to see all 10 workshop sections with their defined responsibilities and Work Instructions, so that I know which section handles which work during POH.

#### Acceptance Criteria

1. THE POH_System SHALL define the following 10 standard Workshop_Sections:
   - M5 — Brake/Pneumatic Section (ब्रेक/न्यूमैटिक सेक्शन)
   - M6 — Bogie & Mechanical Section (बोगी और मैकेनिकल सेक्शन)
   - M8 — Compressor Section (कम्प्रेसर सेक्शन)
   - E2 — HT Electrical Section (HT इलेक्ट्रिकल सेक्शन)
   - E3 — Traction Motor Section (ट्रैक्शन मोटर सेक्शन)
   - E5 — Train Lighting & LT Electrical Section (ट्रेन लाइटिंग और LT इलेक्ट्रिकल सेक्शन)
   - M2 — Furnishing & Body Section (फर्निशिंग और बॉडी सेक्शन)
   - M3 — Pantograph & Speedometer Section (पैंटोग्राफ और स्पीडोमीटर सेक्शन)
   - Painting — Painting Section (पेंटिंग सेक्शन)
   - M4 — M&P / Machinery Section (M&P / मशीनरी सेक्शन)
2. THE POH_System SHALL store each Workshop_Section with a unique section code, Hindi name, English name, and description of responsibilities.
3. WHEN a new rake is registered for POH, THE POH_System SHALL automatically generate a Job_Card for each Coach containing all applicable Workshop_Sections based on the Coach_Type.
4. THE POH_System SHALL associate each Workshop_Section with its relevant Work_Instructions based on the Rake_Type and Coach_Type.

### Requirement 2: M5 — ब्रेक/न्यूमैटिक सेक्शन (Brake/Pneumatic Section)

**User Story:** As a Section_Engineer, I want to manage brake and pneumatic system overhaul work through section M5, so that brake system integrity is maintained per RDSO standards.

#### Acceptance Criteria

1. THE POH_System SHALL define M5 Workshop_Section with Work_Instructions W/M5/01 through W/M5/05.
2. THE POH_System SHALL maintain separate Work_Instructions for Conventional EMU/MEMU and 3-Phase EMU/MEMU Rake_Types within M5.
3. THE POH_System SHALL associate M5 Work_Instructions with Coach_Types MC, TC, DTC, DMC, and NDTC as applicable.
4. THE POH_System SHALL define M5 scope covering: brake system, pneumatic equipment, distributor valve, brake cylinder, slack adjuster, air dryer, MU valve, angle cock, and hose pipe.
5. THE POH_System SHALL maintain M5 Must_Change_Items that vary by POH_Cycle (1st, 2nd, 3rd, 4th POH).
6. THE POH_System SHALL define M5 testing formats including: brake continuity test, leakage test, BP pressure test, and FP pressure test.
7. WHEN an M5 Work_Instruction is viewed, THE POH_System SHALL display the WI number, VERSION number, applicable Rake_Type, applicable Coach_Types, and the list of Must_Change_Items for the current POH_Cycle.

### Requirement 3: M6 — बोगी और मैकेनिकल सेक्शन (Bogie & Mechanical Section)

**User Story:** As a Section_Engineer, I want to manage bogie and mechanical overhaul work through section M6, so that bogie integrity and wheel safety are ensured.

#### Acceptance Criteria

1. THE POH_System SHALL define M6 Workshop_Section with Work_Instructions W/M6/01 and W/M6/02.
2. THE POH_System SHALL maintain separate Work_Instructions for Conventional EMU/MEMU and 3-Phase EMU/MEMU Rake_Types within M6.
3. THE POH_System SHALL associate M6 Work_Instructions with Coach_Types MC, TC, DTC, DMC, and NDTC as applicable.
4. THE POH_System SHALL define M6 scope covering: bogie overhaul, bolster spring, axle box, center pivot, side bearer, wheel set, axle, and bearing.
5. THE POH_System SHALL maintain M6 Must_Change_Items that vary by POH_Cycle (1st, 2nd, 3rd, 4th POH).
6. THE POH_System SHALL define M6 testing formats including: bogie dimension check and wheel profile measurement.
7. WHEN an M6 Work_Instruction is viewed, THE POH_System SHALL display the WI number, VERSION number, applicable Rake_Type, applicable Coach_Types, and the list of Must_Change_Items for the current POH_Cycle.

### Requirement 4: M8 — कम्प्रेसर सेक्शन (Compressor Section)

**User Story:** As a Section_Engineer, I want to manage compressor overhaul work through section M8, so that air supply systems function reliably.

#### Acceptance Criteria

1. THE POH_System SHALL define M8 Workshop_Section with Work_Instructions W/M8/01 and W/M8/02.
2. THE POH_System SHALL maintain separate Work_Instructions for Conventional EMU/MEMU and 3-Phase EMU/MEMU Rake_Types within M8.
3. THE POH_System SHALL associate M8 Work_Instructions with Coach_Type MC only (compressor coaches).
4. THE POH_System SHALL define M8 scope covering: compressor overhaul, motor overhaul, unloader valve, safety valve, and NRV.
5. THE POH_System SHALL maintain M8 Must_Change_Items that vary by POH_Cycle (1st, 2nd, 3rd, 4th POH).
6. THE POH_System SHALL define M8 testing formats including: compressor output test and pressure build-up time test.
7. WHEN an M8 Work_Instruction is viewed, THE POH_System SHALL display the WI number, VERSION number, applicable Rake_Type, applicable Coach_Types, and the list of Must_Change_Items for the current POH_Cycle.

### Requirement 5: E2 — HT इलेक्ट्रिकल सेक्शन (HT Electrical Section)

**User Story:** As a Section_Engineer, I want to manage HT electrical equipment overhaul through section E2, so that high tension electrical safety is maintained.

#### Acceptance Criteria

1. THE POH_System SHALL define E2 Workshop_Section with Work_Instructions W/E2/05 and W/E2/06.
2. THE POH_System SHALL maintain separate Work_Instructions for Conventional EMU/MEMU and 3-Phase EMU/MEMU Rake_Types within E2.
3. THE POH_System SHALL associate E2 Work_Instructions with Coach_Types MC, TC, DTC, and DMC as applicable.
4. THE POH_System SHALL define E2 scope covering: HT equipment, transformer, tap changer, HT cable, circuit breaker, and lightning arrester.
5. THE POH_System SHALL maintain E2 Must_Change_Items that vary by POH_Cycle (1st, 2nd, 3rd, 4th POH).
6. THE POH_System SHALL define E2 testing formats including: HT insulation test, megger test, and HV test.
7. WHEN an E2 Work_Instruction is viewed, THE POH_System SHALL display the WI number, VERSION number, applicable Rake_Type, applicable Coach_Types, and the list of Must_Change_Items for the current POH_Cycle.

### Requirement 6: E3 — ट्रैक्शन मोटर सेक्शन (Traction Motor Section)

**User Story:** As a Section_Engineer, I want to manage traction motor overhaul through section E3, so that motor coaches maintain reliable traction performance.

#### Acceptance Criteria

1. THE POH_System SHALL define E3 Workshop_Section with Work_Instructions W/E3/05 and W/E3/06.
2. THE POH_System SHALL maintain separate Work_Instructions for Conventional EMU/MEMU and 3-Phase EMU/MEMU Rake_Types within E3.
3. THE POH_System SHALL associate E3 Work_Instructions with Coach_Types MC and DMC only (motor coaches).
4. THE POH_System SHALL define E3 scope covering: traction motor overhaul, armature, field coil, brush gear, bearing, and gear case.
5. THE POH_System SHALL maintain E3 Must_Change_Items that vary by POH_Cycle (1st, 2nd, 3rd, 4th POH).
6. THE POH_System SHALL define E3 testing formats including: no-load test and insulation resistance test.
7. WHEN an E3 Work_Instruction is viewed, THE POH_System SHALL display the WI number, VERSION number, applicable Rake_Type, applicable Coach_Types, and the list of Must_Change_Items for the current POH_Cycle.

### Requirement 7: E5 — ट्रेन लाइटिंग और LT इलेक्ट्रिकल सेक्शन (Train Lighting & LT Electrical Section)

**User Story:** As a Section_Engineer, I want to manage train lighting and LT electrical work through section E5, so that passenger amenities and electrical systems are properly overhauled.

#### Acceptance Criteria

1. THE POH_System SHALL define E5 Workshop_Section with Work_Instructions W/E5/05 and W/E5/06.
2. THE POH_System SHALL maintain separate Work_Instructions for Conventional EMU/MEMU and 3-Phase EMU/MEMU Rake_Types within E5.
3. THE POH_System SHALL associate E5 Work_Instructions with Coach_Types MC, TC, DTC, DMC, and NDTC as applicable.
4. THE POH_System SHALL define E5 scope covering: train lighting, battery, charger, LT wiring, fan, destination board, PA system, and CCTV.
5. THE POH_System SHALL maintain E5 Must_Change_Items that vary by POH_Cycle (1st, 2nd, 3rd, 4th POH).
6. THE POH_System SHALL define E5 testing formats including: battery capacity test, insulation test, and lighting lux test.
7. WHEN an E5 Work_Instruction is viewed, THE POH_System SHALL display the WI number, VERSION number, applicable Rake_Type, applicable Coach_Types, and the list of Must_Change_Items for the current POH_Cycle.

### Requirement 8: M2 — फर्निशिंग और बॉडी सेक्शन (Furnishing & Body Section)

**User Story:** As a Section_Engineer, I want to manage body repair and furnishing work through section M2, so that coach body and interior are restored to standard condition.

#### Acceptance Criteria

1. THE POH_System SHALL define M2 Workshop_Section with Work_Instructions W/M2/01 and W/M2/02.
2. THE POH_System SHALL maintain separate Work_Instructions for Conventional EMU/MEMU and 3-Phase EMU/MEMU Rake_Types within M2.
3. THE POH_System SHALL associate M2 Work_Instructions with Coach_Types MC, TC, DTC, DMC, and NDTC as applicable.
4. THE POH_System SHALL define M2 scope covering: body repair, furnishing, seat, window, door, flooring, and roof.
5. THE POH_System SHALL maintain M2 Must_Change_Items that vary by POH_Cycle (1st, 2nd, 3rd, 4th POH).
6. THE POH_System SHALL define M2 testing formats including: door operation test and window fitment check.
7. WHEN an M2 Work_Instruction is viewed, THE POH_System SHALL display the WI number, VERSION number, applicable Rake_Type, applicable Coach_Types, and the list of Must_Change_Items for the current POH_Cycle.

### Requirement 9: M3 — पैंटोग्राफ और स्पीडोमीटर सेक्शन (Pantograph & Speedometer Section)

**User Story:** As a Section_Engineer, I want to manage pantograph and speedometer overhaul through section M3, so that current collection and speed recording systems are reliable.

#### Acceptance Criteria

1. THE POH_System SHALL define M3 Workshop_Section with Work_Instructions W/M3/07 and W/M3/08.
2. THE POH_System SHALL maintain separate Work_Instructions for Conventional EMU/MEMU and 3-Phase EMU/MEMU Rake_Types within M3.
3. THE POH_System SHALL associate M3 pantograph Work_Instructions with Coach_Types MC and DMC (pantograph coaches), and speedometer Work_Instructions with all Coach_Types.
4. THE POH_System SHALL define M3 scope covering: pantograph overhaul, speedometer, speed recorder, and carbon strip.
5. THE POH_System SHALL maintain M3 Must_Change_Items that vary by POH_Cycle (1st, 2nd, 3rd, 4th POH).
6. THE POH_System SHALL define M3 testing formats including: pantograph rise/lower test and contact pressure test.
7. WHEN an M3 Work_Instruction is viewed, THE POH_System SHALL display the WI number, VERSION number, applicable Rake_Type, applicable Coach_Types, and the list of Must_Change_Items for the current POH_Cycle.

### Requirement 10: Painting — पेंटिंग सेक्शन (Painting Section)

**User Story:** As a Section_Engineer, I want to manage full coach painting work through the Painting section, so that every coach receives proper surface preparation and livery during POH.

#### Acceptance Criteria

1. THE POH_System SHALL define Painting Workshop_Section with section code "Painting".
2. THE POH_System SHALL associate the Painting Workshop_Section with Coach_Types MC, TC, DTC, DMC, and NDTC (all coach types).
3. THE POH_System SHALL define Painting scope covering: surface preparation, primer application, putty work, final coat painting, and livery marking.
4. THE POH_System SHALL include the Painting Workshop_Section in every POH Job_Card regardless of Rake_Type.
5. THE POH_System SHALL provide placeholder Work_Instruction entries for the Painting Workshop_Section to be populated when specific WI numbers become available.
6. THE POH_System SHALL define Painting testing formats including: paint thickness measurement and surface finish inspection.
7. WHEN Painting Work_Instruction data becomes available, THE POH_System SHALL allow updating the placeholder entries with actual WI numbers and VERSION numbers without affecting existing Job_Cards.

> **Note:** Painting सेक्शन का जॉब कार्ड डेटा अभी उपलब्ध नहीं है। यह placeholder requirement है — जब WI numbers मिलेंगे तब अपडेट किया जाएगा।

### Requirement 11: M4 — M&P / मशीनरी सेक्शन (M&P / Machinery Section)

**User Story:** As a Section_Engineer, I want to track M4 machinery and plant support operations, so that lifting, crane, and other M&P activities are coordinated across all sections during POH.

#### Acceptance Criteria

1. THE POH_System SHALL define M4 Workshop_Section with section code "M4" and designation "M&P / Machinery Section".
2. THE POH_System SHALL associate the M4 Workshop_Section with all Coach_Types (MC, TC, DTC, DMC, NDTC) as a cross-cutting support section.
3. THE POH_System SHALL define M4 scope covering: lifting jack operations, crane operations, M&P (Machinery & Plant) equipment coordination, and support to all other Workshop_Sections.
4. THE POH_System SHALL mark M4 as a support/coordination section that does not have its own independent work items but aligns with and supports all other Workshop_Sections.
5. THE POH_System SHALL track M4 activities (lifting, lowering, shifting) as coordination entries linked to the Workshop_Sections they support.
6. THE POH_System SHALL display M4 status on the Section_Dashboard based on the completion of its coordination activities across all supported sections.
7. WHEN M4 coordination activity data becomes available, THE POH_System SHALL allow updating the section with specific activity definitions and tracking parameters.

> **Note:** M4 एक cross-cutting सपोर्ट सेक्शन है — इसके अपने स्वतंत्र जॉब कार्ड work items नहीं हैं। यह अन्य सभी सेक्शन्स को मशीनरी सपोर्ट (लिफ्टिंग जैक, क्रेन आदि) प्रदान करता है। विशिष्ट WI numbers उपलब्ध नहीं हैं।

### Requirement 12: Work Instruction वर्शनिंग और Rake/Coach Type मैपिंग (WI Versioning & Type Mapping)

**User Story:** As a Section_Engineer, I want Work Instructions to be versioned and correctly mapped to rake types and coach types, so that the right WI is applied to the right coach.

#### Acceptance Criteria

1. THE POH_System SHALL store each Work_Instruction with a WI number (e.g., W/M5/01), a VERSION number (e.g., VERSION: 01), applicable Rake_Type, and applicable Coach_Types.
2. WHEN a Coach is opened for section work, THE POH_System SHALL display only the Work_Instructions applicable to that Coach based on its Coach_Type and the rake's Rake_Type.
3. THE POH_System SHALL maintain two WI variants for each Workshop_Section: one for Conventional EMU/MEMU and one for 3-Phase EMU/MEMU.
4. IF a Work_Instruction VERSION is updated, THEN THE POH_System SHALL retain the previous version for audit purposes and apply the new version to newly created Job_Cards only.
5. THE POH_System SHALL validate that every Coach in a rake has the correct Work_Instructions assigned based on its Coach_Type before allowing section work to begin.

### Requirement 13: Must Change Items और POH Cycle प्रबंधन (Must Change Items & POH Cycle Management)

**User Story:** As a Section_Engineer, I want to see which parts must be changed based on the POH cycle, so that mandatory replacements are not missed.

#### Acceptance Criteria

1. THE POH_System SHALL maintain a Must_Change_Item list for each Workshop_Section that varies by POH_Cycle (1st, 2nd, 3rd, 4th POH).
2. WHEN a Job_Card is generated, THE POH_System SHALL populate the Must_Change_Items for each Workshop_Section based on the current POH_Cycle of the coach.
3. THE POH_System SHALL display Must_Change_Items as a separate checklist within each Workshop_Section view, distinct from regular work items.
4. WHEN a Must_Change_Item is marked as replaced, THE POH_System SHALL record the replacement timestamp, the replacing technician identity, and the old/new part details.
5. IF a Workshop_Section is marked as "Completed" while any Must_Change_Item for that section remains unreplaced, THEN THE POH_System SHALL prevent completion and display a validation error listing the pending Must_Change_Items.
6. THE POH_System SHALL display the POH_Cycle number (1st/2nd/3rd/4th) prominently on the Job_Card header and on each Workshop_Section view.

### Requirement 14: सेक्शन-वार टेस्टिंग प्रबंधन (Section-wise Testing Management)

**User Story:** As a Section_Engineer, I want each section's testing formats and parameters to be defined and tracked, so that all mandatory tests are completed before section sign-off.

#### Acceptance Criteria

1. THE POH_System SHALL define specific Testing_Formats for each Workshop_Section:
   - M5: brake continuity test, leakage test, BP pressure test, FP pressure test
   - M6: bogie dimension check, wheel profile measurement
   - M8: compressor output test, pressure build-up time test
   - E2: HT insulation test, megger test, HV test
   - E3: no-load test, insulation resistance test
   - E5: battery capacity test, insulation test, lighting lux test
   - M2: door operation test, window fitment check
   - M3: pantograph rise/lower test, contact pressure test
   - Painting: paint thickness measurement, surface finish inspection
   - M4: N/A (support/coordination section — testing tracked via supported sections)
2. WHEN a Workshop_Section's work items are completed, THE POH_System SHALL present the applicable Testing_Formats for that section as a mandatory step before section completion.
3. THE POH_System SHALL record test results with test name, measured values, pass/fail status, testing timestamp, and tester identity for each Testing_Format.
4. IF any mandatory test within a Workshop_Section fails, THEN THE POH_System SHALL prevent section completion and flag the failed test for rework.
5. THE POH_System SHALL display test completion status on the Section_Dashboard alongside Section_Progress for each Workshop_Section.

### Requirement 15: सेक्शन डैशबोर्ड व्यू (Section Dashboard View)

**User Story:** As a Section_Engineer, I want a dashboard that shows all 10 workshop sections and their status for a coach, so that I can get a quick overview of the entire job card.

#### Acceptance Criteria

1. WHEN a Coach detail page is opened, THE POH_System SHALL display a Section_Dashboard showing all applicable Workshop_Sections in a grid or card layout.
2. THE POH_System SHALL display for each Workshop_Section on the Section_Dashboard: section code, section name (Hindi and English), Section_Progress percentage, total work items count, completed work items count, Must_Change_Items completion status, and testing status.
3. THE POH_System SHALL color-code each Workshop_Section card based on its status: green for "Completed" (all work items, Must_Change_Items, and tests done), blue for "In Progress" (progress above 50%), yellow for "In Progress" (progress 50% or below), and grey for "Not Started".
4. WHEN a Senior_Section_Engineer clicks on a Workshop_Section card, THE POH_System SHALL navigate to the detailed section view showing all Work_Instructions, work items, Must_Change_Items, and Testing_Formats for that section.
5. WHILE a Senior_Section_Engineer is viewing the Section_Dashboard, THE POH_System SHALL display all Workshop_Sections with their progress data in read-only mode.
6. WHEN a Senior_Section_Engineer clicks on a Workshop_Section card that is assigned to that Senior_Section_Engineer, THE POH_System SHALL open the section detail view in editable mode.
7. WHEN a Senior_Section_Engineer clicks on a Workshop_Section card that is NOT assigned to that Senior_Section_Engineer, THE POH_System SHALL open the section detail view in read-only mode.
8. THE POH_System SHALL display an aggregate job card completion percentage calculated from all applicable Workshop_Sections combined.
9. THE POH_System SHALL show the applicable Coach_Type and Rake_Type on the Section_Dashboard header.

### Requirement 16: सेक्शन-वार तुलनात्मक विश्लेषण (Section-wise Comparative Analysis)

**User Story:** As a Section_Engineer, I want to compare section progress across all coaches in a rake, so that I can identify which sections are consistently slow and need attention.

#### Acceptance Criteria

1. WHEN a rake detail page is opened, THE POH_System SHALL provide a "Section Analysis" view that shows Section_Progress for each Workshop_Section across all coaches in the rake.
2. THE POH_System SHALL display the section comparison in a matrix format with coaches as rows and Workshop_Sections (M5, M6, M8, E2, E3, E5, M2, M3, Painting, M4) as columns, showing progress percentage in each cell.
3. WHEN a Workshop_Section is not applicable to a Coach_Type (e.g., M8 not applicable to TC), THE POH_System SHALL display "N/A" in the corresponding cell.
4. THE POH_System SHALL calculate and display the average Section_Progress for each Workshop_Section across all applicable coaches in the rake.
5. THE POH_System SHALL highlight Workshop_Sections that have average progress below 50% with a visual warning indicator.
6. WHEN a Section_Engineer clicks on a cell in the comparison matrix, THE POH_System SHALL navigate to the detailed section view for that specific Coach and Workshop_Section.

### Requirement 17: जॉब कार्ड प्रिंट और एक्सपोर्ट (Job Card Print and Export)

**User Story:** As a Section_Engineer, I want to print or export the complete job card for a coach, so that I can have a physical copy for workshop floor reference.

#### Acceptance Criteria

1. THE POH_System SHALL provide a "Print Job Card" option on the Coach detail page.
2. WHEN "Print Job Card" is selected, THE POH_System SHALL generate a formatted document containing all applicable Workshop_Sections with their Work_Instructions, work item statuses, Must_Change_Items status, test results, and assigned engineers.
3. THE POH_System SHALL format the printed Job_Card with the coach number, rake number, Coach_Type, Rake_Type, POH_Cycle number, shed name (EMU Car Shed, Ghaziabad), and generation timestamp in the header.
4. THE POH_System SHALL organize the printed Job_Card by Workshop_Section code order (M2, M3, M4, M5, M6, M8, Painting, E2, E3, E5).
5. THE POH_System SHALL allow exporting the Job_Card in PDF format.
6. THE POH_System SHALL include a summary page at the beginning of the exported Job_Card showing overall completion percentage, section-wise progress, and Must_Change_Items completion status.

### Requirement 18: डेटा वैलिडेशन और अखंडता (Data Validation and Integrity)

**User Story:** As a Section_Engineer, I want the system to validate job card section data, so that records remain accurate and consistent.

#### Acceptance Criteria

1. THE POH_System SHALL validate that every Coach has the correct Workshop_Sections assigned based on its Coach_Type when a Job_Card is generated.
2. THE POH_System SHALL validate that each Workshop_Section has the correct Work_Instructions assigned based on the Rake_Type and Coach_Type.
3. IF a Workshop_Section is marked as "Completed" without all Must_Change_Items being replaced and all mandatory tests passing, THEN THE POH_System SHALL display a validation error and prevent the status change.
4. THE POH_System SHALL prevent deletion of a Workshop_Section from an active Job_Card.
5. THE POH_System SHALL validate that Section_Progress values remain between 0 and 100 percent at all times.
6. IF the POH_System detects a mismatch between work item statuses and calculated Section_Progress, THEN THE POH_System SHALL recalculate and correct the Section_Progress value.

### Requirement 19: SSE सेक्शन-आधारित एक्सेस कंट्रोल (SSE Section-Based Access Control)

**User Story:** As a Senior_Section_Engineer, I want to edit only my assigned workshop section's data while viewing all sections' data in read-only mode, so that each SSE manages only their own section's job card entries without accidentally modifying other sections.

#### Acceptance Criteria

1. WHEN an Admin creates a new user with the Senior_Section_Engineer role, THE POH_System SHALL require the Admin to assign exactly one Workshop_Section to that Senior_Section_Engineer.
2. THE POH_System SHALL store the assigned Workshop_Section as part of the Senior_Section_Engineer's user profile.
3. WHEN a Senior_Section_Engineer logs in, THE POH_System SHALL determine the assigned Workshop_Section from the user profile and enforce access control accordingly.
4. WHILE a Senior_Section_Engineer is viewing any Coach's Job_Card, THE POH_System SHALL display all applicable Workshop_Sections and their progress data in read-only mode.
5. WHEN a Senior_Section_Engineer opens the detail view of their assigned Workshop_Section for any Coach, THE POH_System SHALL allow editing of work items, Must_Change_Items, Testing_Formats, and notes within that section.
6. WHEN a Senior_Section_Engineer opens the detail view of a Workshop_Section that is NOT assigned to them, THE POH_System SHALL display all data in read-only mode and disable all edit controls (input fields, checkboxes, buttons for adding/modifying data).
7. IF a Senior_Section_Engineer attempts to modify data in a Workshop_Section that is not assigned to them via API or direct request, THEN THE POH_System SHALL reject the request and return an authorization error.
8. THE POH_System SHALL visually indicate the Senior_Section_Engineer's assigned section on the Section_Dashboard (e.g., a distinct border or badge) to differentiate it from other read-only sections.
9. WHEN an Admin updates a Senior_Section_Engineer's assigned Workshop_Section, THE POH_System SHALL apply the new assignment immediately for subsequent logins without affecting previously saved data.
10. THE POH_System SHALL enforce SSE section-based access control consistently across all data entry points: work item completion, Must_Change_Item replacement, test result entry, and notes addition.
