# Implementation Plan: Job Card Section Analysis

## Overview

This implementation plan covers the Job Card Section Analysis feature for 10 workshop sections in the Railway POH Management System. Work proceeds incrementally: Database schema → TypeScript types → Server Actions → Query functions → Page components → Client components → SSE access control → PDF export → Tests.

## Tasks

- [x] 1. Database migration: Create new tables, seed data, functions, views, and RLS policies
  - [x] 1.1 Create migration file with workshop_sections, work_instructions, wi_coach_type_applicability, must_change_item_templates, section_test_templates tables
    - `workshop_sections` table with CHECK constraint for 10 section codes, section_type (standard/placeholder/coordination), display_order
    - `work_instructions` table with section_id FK, wi_number, version_number, rake_type CHECK, is_placeholder flag, UNIQUE(wi_number, version_number, rake_type)
    - `wi_coach_type_applicability` table with wi_id FK, coach_type CHECK, UNIQUE(wi_id, coach_type)
    - `must_change_item_templates` table with section_id FK, poh_cycle CHECK, rake_type CHECK, UNIQUE(section_id, item_name, poh_cycle, rake_type)
    - `section_test_templates` table with section_id FK, test_name, rake_type CHECK, UNIQUE(section_id, test_name, rake_type)
    - Add all indexes as defined in design document
    - _Requirements: 1.1, 1.2, 12.1, 13.1, 14.1_

  - [x] 1.2 Create instance tables: section_work_items, must_change_item_instances, section_test_instances, m4_coordination_entries
    - `section_work_items` table with coach_id FK, section_id FK, wi_id FK, status CHECK, UNIQUE(coach_id, wi_id)
    - `must_change_item_instances` table with coach_id FK, template_id FK, section_id FK, is_replaced, old/new part details, replaced_by/at, UNIQUE(coach_id, template_id)
    - `section_test_instances` table with coach_id FK, template_id FK, section_id FK, status CHECK, measured_values, passed, UNIQUE(coach_id, template_id)
    - `m4_coordination_entries` table with coach_id FK, section_id FK, supported_section_id FK, activity_type CHECK, status CHECK
    - Add all indexes as defined in design document
    - _Requirements: 1.3, 11.5, 13.2, 13.4, 14.3_

  - [x] 1.3 Add seed data for workshop_sections (10 sections) and work_instructions with coach type applicability
    - Insert 10 workshop_sections rows (M2, M3, M4, M5, M6, M8, Painting, E2, E3, E5) with Hindi/English names, section_type, display_order
    - Insert work_instructions for each section: Conventional and 3-Phase variants as per design WI mapping table
    - Insert wi_coach_type_applicability rows per the Section / Coach Type Applicability Matrix
    - Insert section_test_templates for each section's testing formats (Req 14.1)
    - Mark Painting WIs as is_placeholder=true, M4 has no WIs (coordination section)
    - _Requirements: 1.1, 1.4, 2.1-2.6, 3.1-3.6, 4.1-4.6, 5.1-5.6, 6.1-6.6, 7.1-7.6, 8.1-8.6, 9.1-9.6, 10.1-10.5, 11.1-11.3, 14.1_

  - [x] 1.4 Create `generate_job_card` PostgreSQL function
    - Implement the PL/pgSQL function that takes (coach_id, rake_type, coach_type, poh_cycle) parameters
    - For each active section: create section_work_items from matching WIs, must_change_item_instances from matching templates, section_test_instances from matching test templates
    - Skip M4 (coordination) for work items
    - Use ON CONFLICT DO NOTHING for idempotency
    - _Requirements: 1.3, 1.4, 13.2_

  - [x] 1.5 Create `v_coach_section_progress` view for section progress calculation
    - Calculate progress_pct as ROUND(completed/total * 100) per coach per section
    - Include must_change_total, must_change_replaced counts
    - Include tests_total, tests_passed, tests_failed counts
    - Join with workshop_sections for section metadata
    - _Requirements: 15.2, 18.5, 18.6_

  - [x] 1.6 Add RLS policies for all new instance tables
    - Enable RLS on section_work_items, must_change_item_instances, section_test_instances, m4_coordination_entries
    - SELECT policy: all authenticated users can view
    - UPDATE policy: admin OR SSE with matching section assignment via user_section_assignments table
    - M4 coordination: ALL policy for M4-assigned SSE or admin
    - INSERT policy for section_work_items (job card generation by admin/system)
    - _Requirements: 19.5, 19.6, 19.7, 19.10_

  - [ ]* 1.7 Write property test: Job Card Generation Assigns Correct Sections per Coach Type
    - **Property 1: Job Card Generation Assigns Correct Sections per Coach Type**
    - Generate random coach_type values (MC/TC/DTC/DMC/NDTC), call generate_job_card, verify assigned sections match applicability matrix exactly
    - **Validates: Requirements 1.3, 18.1**

  - [ ]* 1.8 Write property test: M4 Has No Independent Work Items
    - **Property 8: M4 Has No Independent Work Items**
    - Generate job cards for all coach types, verify M4 section has zero section_work_items records
    - **Validates: Requirements 11.4, 11.5, 11.6**

- [x] 2. Checkpoint - Verify database migration
  - Ensure migration runs successfully, seed data is correct, generate_job_card function works, RLS policies are in place. Ask the user if questions arise.

- [x] 3. Define TypeScript types and constants
  - [x] 3.1 Add section-related types to `src/types/index.ts`
    - Add types: SectionCode, CoachType (if not existing), SectionType, WorkItemStatus, SectionTestStatus, M4ActivityType
    - Add interfaces: WorkshopSection, SectionProgressSummary, SectionDashboardData, SectionAnalysisData
    - Add interfaces: SectionWorkItem, MustChangeItemInstance, SectionTestInstance, M4CoordinationEntry
    - Add interfaces: TestResultInput, M4CoordinationInput
    - _Requirements: 1.1, 1.2, 15.2_

  - [x] 3.2 Add section constants to `src/lib/constants.ts`
    - Add SECTION_CODES array with all 10 section codes in display order
    - Add SECTION_COACH_TYPE_APPLICABILITY matrix (Record<SectionCode, CoachType[]>)
    - Add SECTION_DISPLAY_ORDER mapping
    - Add section color coding helper function (grey/yellow/blue/green based on progress state)
    - Add PDF section order constant: ['M2', 'M3', 'M4', 'M5', 'M6', 'M8', 'Painting', 'E2', 'E3', 'E5']
    - _Requirements: 1.1, 15.3, 17.4_

  - [ ]* 3.3 Write property test: Section Progress Calculation Invariant
    - **Property 7: Section Progress Calculation Invariant**
    - Generate random arrays of work item statuses, verify progress_pct = floor(completed/total * 100), always in [0, 100]
    - **Validates: Requirements 18.5, 18.6**

  - [ ]* 3.4 Write property test: Section Dashboard Color Coding Consistency
    - **Property 9: Section Dashboard Color Coding Consistency**
    - Generate random progress states, verify color assignment is a pure function matching the rules (grey/yellow/blue/green)
    - **Validates: Requirements 15.3**

- [x] 4. Create Zod validation schemas
  - [x] 4.1 Create `src/lib/validations/section.ts` with Zod schemas
    - Schema for work item status update (itemId, status)
    - Schema for must change item replacement (itemId, oldPartDetail, newPartDetail) — both part details required
    - Schema for test result recording (testId, measuredValues, passed, notes optional)
    - Schema for M4 coordination entry (coachId, activityType, supportedSection, notes optional)
    - Schema for section completion validation (coachId, sectionCode)
    - _Requirements: 13.4, 14.3, 18.3_

- [x] 5. Implement query functions
  - [x] 5.1 Create `src/lib/queries/section-dashboard.ts` — getCoachSectionDashboard query
    - Fetch all section progress data from v_coach_section_progress view for a given coachId
    - Include coach metadata (coachNumber, coachType, rakeType, pohCycle)
    - Calculate aggregate job card completion percentage from all applicable sections
    - Fetch current user's assigned section for SSE highlighting
    - Return SectionDashboardData typed response
    - _Requirements: 15.1, 15.2, 15.8, 15.9, 19.3, 19.4_

  - [x] 5.2 Create `src/lib/queries/section-detail.ts` — getSectionDetail query
    - Fetch section work items with WI details (wi_number, version_number, rake_type, coach_types)
    - Fetch must change item instances with template details
    - Fetch section test instances with template details
    - For M4: fetch m4_coordination_entries instead of work items
    - Check if current user is assigned SSE for this section (isEditable flag)
    - Display POH_Cycle number prominently
    - _Requirements: 2.7, 3.7, 4.7, 5.7, 6.7, 7.7, 8.7, 9.7, 12.2, 15.4, 15.6, 15.7, 19.5, 19.6_

  - [x] 5.3 Create `src/lib/queries/section-analysis.ts` — getRakeSectionAnalysis query
    - Fetch section progress for all coaches in a rake
    - Build matrix: coaches (rows) x sections (columns) with progress percentage
    - Mark N/A cells based on coach_type vs section applicability matrix
    - Calculate average progress per section (excluding N/A coaches)
    - Flag sections with average < 50% for warning indicator
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

  - [ ]* 5.4 Write property test: Comparative Analysis Matrix N/A Correctness
    - **Property 10: Comparative Analysis Matrix N/A Correctness**
    - Generate random (coach_type, section) pairs, verify N/A matches applicability matrix, average excludes N/A coaches
    - **Validates: Requirements 16.2, 16.3, 16.4, 16.5**

- [x] 6. Implement Server Actions — Work Items, Must Change Items, Tests
  - [x] 6.1 Create `src/lib/actions/section-work-items.ts`
    - Implement `updateSectionWorkItemStatus(itemId, status)` server action
    - Verify SSE section assignment before mutation (check user_section_assignments)
    - Return Result<void> with success/error
    - _Requirements: 19.5, 19.7, 19.10_

  - [x] 6.2 Create `src/lib/actions/section-must-change.ts`
    - Implement `replaceMustChangeItem(itemId, oldPartDetail, newPartDetail)` server action
    - Record replaced_at timestamp, replaced_by user ID, old/new part details
    - Verify SSE section assignment before mutation
    - Validate both oldPartDetail and newPartDetail are non-empty
    - Return Result<void> with success/error
    - _Requirements: 13.4, 19.5, 19.7, 19.10_

  - [ ]* 6.3 Write property test: Data Recording Completeness on Mutations
    - **Property 11: Data Recording Completeness on Mutations**
    - Generate random replacement/test actions, verify replaced_at, replaced_by, old_part_detail, new_part_detail are all non-null after replacement; tested_at, tested_by, measured_values, passed are all non-null after test recording
    - **Validates: Requirements 13.4, 14.3**

  - [x] 6.4 Create `src/lib/actions/section-tests.ts`
    - Implement `recordSectionTestResult(testId, measuredValues, passed, notes?)` server action
    - Record tested_at timestamp, tested_by user ID, measured_values, passed boolean
    - Verify SSE section assignment before mutation
    - Return Result<void> with success/error
    - _Requirements: 14.3, 19.5, 19.7, 19.10_

  - [x] 6.5 Create `src/lib/actions/section-completion.ts`
    - Implement `completeSectionForCoach(coachId, sectionCode)` server action
    - Validate: all must change items replaced AND all mandatory tests passed before allowing completion
    - If validation fails: return error listing pending must change items and/or failed tests
    - Verify SSE section assignment before mutation
    - Prevent section deletion from active job cards (ON DELETE RESTRICT handles DB level)
    - _Requirements: 13.5, 14.4, 18.3, 18.4_

  - [ ]* 6.6 Write property test: Section Completion Blocked by Unreplaced Must Change Items or Failed Tests
    - **Property 4: Section Completion Blocked by Unreplaced Must Change Items or Failed Tests**
    - Generate random section states (some with unreplaced items, some with failed tests, some complete), verify completion is blocked/allowed correctly
    - **Validates: Requirements 13.5, 14.4, 18.3**

  - [ ]* 6.7 Write property test: SSE Section-Based Access Control Enforcement
    - **Property 6: SSE Section-Based Access Control Enforcement**
    - Generate random (sse_section, target_section) pairs, attempt mutations, verify allow when sse_section == target_section, deny otherwise
    - **Validates: Requirements 15.6, 15.7, 19.5, 19.6, 19.7, 19.10**

- [x] 7. Implement Server Actions — M4 Coordination, Job Card Generation, PDF Export
  - [x] 7.1 Create `src/lib/actions/m4-coordination.ts`
    - Implement `addM4CoordinationEntry(coachId, activityType, supportedSection, notes?)` server action
    - Verify M4 SSE assignment before mutation
    - Validate activityType is one of: Lifting, Lowering, Shifting, Crane Operation, Other
    - Link coordination entry to supported section
    - _Requirements: 11.5, 11.6, 19.5, 19.7_

  - [x] 7.2 Create `src/lib/actions/job-card-generation.ts`
    - Implement `generateJobCardForCoach(coachId, rakeType, coachType, pohCycle)` server action
    - Call the `generate_job_card` PostgreSQL function via Supabase RPC
    - Validate coach_type and rake_type before calling
    - Handle duplicate generation gracefully (ON CONFLICT DO NOTHING)
    - _Requirements: 1.3, 1.4, 12.5, 13.2_

  - [ ]* 7.3 Write property test: Work Instruction Filtering by Rake Type and Coach Type
    - **Property 2: Work Instruction Filtering by Rake Type and Coach Type**
    - Generate random (rake_type, coach_type) pairs, verify WI list contains only matching WIs, no extras, no missing
    - **Validates: Requirements 1.4, 12.2, 12.3, 12.5, 18.2**

  - [ ]* 7.4 Write property test: Must Change Items Populated Correctly by POH Cycle
    - **Property 3: Must Change Items Populated Correctly by POH Cycle**
    - Generate random (poh_cycle, rake_type) pairs, verify must change item instances match templates for that cycle/type
    - **Validates: Requirements 13.1, 13.2**

  - [x] 7.5 Install `jspdf` and `jspdf-autotable` packages, create `src/lib/actions/job-card-pdf.ts`
    - Implement `exportJobCardPDF(coachId)` server action
    - Generate PDF with header: coach number, rake number, coach_type, rake_type, poh_cycle, shed name (EMU Car Shed, Ghaziabad), generation timestamp
    - Summary page: overall completion %, section-wise progress, must change items completion status
    - Sections ordered: M2, M3, M4, M5, M6, M8, Painting, E2, E3, E5
    - Each section: work items with status, must change items status, test results, assigned engineers
    - Only include applicable sections for the coach_type
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

  - [ ]* 7.6 Write property test: Job Card PDF Contains All Required Sections in Order
    - **Property 12: Job Card PDF Contains All Required Sections in Order**
    - Generate random coach data, verify PDF contains sections in correct order (M2 to E5), only applicable sections, all required header fields
    - **Validates: Requirements 17.2, 17.3, 17.4, 17.6**

- [x] 8. Checkpoint - Verify Server Actions and Query functions
  - Ensure all server actions work correctly, SSE access control is enforced, section completion validation works, PDF generation produces correct output. Ask the user if questions arise.

- [x] 9. Create page components — Section Dashboard, Section Detail, Section Analysis Matrix
  - [x] 9.1 Create `src/app/(dashboard)/rakes/[rakeId]/coaches/[coachId]/sections/page.tsx` — Section Dashboard page (Server Component)
    - Call getCoachSectionDashboard(coachId) query
    - Display coach header with coachNumber, coachType, rakeType, pohCycle
    - Display aggregate job card completion percentage
    - Render 10 section cards in grid layout using SectionCard client component
    - Pass isEditable flag based on SSE section assignment
    - _Requirements: 15.1, 15.2, 15.8, 15.9_

  - [x] 9.2 Create `src/app/(dashboard)/rakes/[rakeId]/coaches/[coachId]/sections/[sectionCode]/page.tsx` — Section Detail page (Server Component)
    - Call getSectionDetail(coachId, sectionCode) query
    - Display section header with sectionCode, name (Hindi/English), POH_Cycle number
    - Render tabs: Work Instructions | Must Change Items | Testing | Notes
    - For standard sections: render WorkItemList, MustChangeChecklist, SectionTestPanel
    - For M4: render M4CoordinationPanel instead of WorkItemList
    - For Painting: show placeholder WI entries with note about future updates
    - Pass isEditable based on SSE assignment check
    - Show WI number, VERSION number, applicable Rake_Type, Coach_Types per Req 2.7-9.7
    - _Requirements: 2.7, 3.7, 4.7, 5.7, 6.7, 7.7, 8.7, 9.7, 10.6, 11.7, 12.2, 13.3, 13.6, 14.2, 15.4, 15.6, 15.7_

  - [x] 9.3 Create `src/app/(dashboard)/rakes/[rakeId]/section-analysis/page.tsx` — Section Analysis Matrix page (Server Component)
    - Call getRakeSectionAnalysis(rakeId) query
    - Display matrix: coaches as rows, 10 sections as columns
    - Each cell shows progress %, color-coded
    - N/A for non-applicable section/coach_type combinations
    - Average row at bottom per section (excluding N/A)
    - Warning indicator (visual) for sections with average < 50%
    - Clickable cells navigate to section detail for that coach+section
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [x] 10. Create client components
  - [x] 10.1 Create `src/components/sections/section-card.tsx` — SectionCard component
    - Display section code, name (Hindi + English), progress bar with percentage
    - Show work items count (completed/total), must change items status, testing status
    - Color-code card: green (Completed), blue (>50%), yellow (<=50%), grey (Not Started)
    - Highlight SSE's assigned section with distinct border/badge (isAssignedToCurrentSSE prop)
    - Link to section detail page on click
    - Editable sections open in edit mode, others in read-only
    - _Requirements: 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 19.8_

  - [x] 10.2 Create `src/components/sections/work-item-list.tsx` — WorkItemList component
    - Display list of work items with WI number, status, completion date
    - If isEditable: show status dropdown (Not Started / In Progress / Completed) with optimistic update
    - If not editable: show status as read-only badge
    - Call updateSectionWorkItemStatus server action on status change
    - Show notes field per work item
    - _Requirements: 15.4, 15.6, 15.7, 19.5, 19.6_

  - [x] 10.3 Create `src/components/sections/must-change-checklist.tsx` — MustChangeChecklist component
    - Display must change items as checklist with item name, description, is_replaced status
    - If isEditable: show replace button that opens modal for old/new part details
    - If not editable: show replacement status as read-only
    - Call replaceMustChangeItem server action on replacement
    - Show replaced_at, replaced_by details for already-replaced items
    - _Requirements: 13.3, 13.4, 19.5, 19.6_

  - [x] 10.4 Create `src/components/sections/section-test-panel.tsx` — SectionTestPanel component
    - Display section-specific tests with test name, status, measured values, pass/fail
    - If isEditable: show form to enter measured values and pass/fail result
    - If not editable: show test results as read-only
    - Call recordSectionTestResult server action on result entry
    - Show tested_at, tested_by details for completed tests
    - _Requirements: 14.2, 14.3, 14.5, 19.5, 19.6_

  - [x] 10.5 Create `src/components/sections/m4-coordination-panel.tsx` — M4CoordinationPanel component
    - Display M4 coordination entries: activity type, supported section, status, notes
    - If isEditable (M4 SSE): show form to add new coordination entry with activity type dropdown
    - If not editable: show entries as read-only
    - Call addM4CoordinationEntry server action on entry creation
    - Show logged_by details for each entry
    - _Requirements: 11.4, 11.5, 11.6, 19.5, 19.6_

  - [x] 10.6 Create `src/components/sections/job-card-export-button.tsx` — JobCardExportButton component
    - "Print Job Card" button on coach detail page
    - Call exportJobCardPDF server action on click
    - Show loading state during PDF generation
    - Download generated PDF file on success
    - Show error toast with retry option on failure
    - _Requirements: 17.1, 17.5_

- [x] 11. SSE access control integration — Enforce in Section Dashboard and Detail views
  - [x] 11.1 Add SSE section assignment check to all section server actions
    - Create shared helper `verifySSESectionAccess(userId, sectionCode)` in `src/lib/auth/permissions.ts`
    - Query user_section_assignments table to get assigned section
    - Return authorization error if target section doesn't match assigned section (unless admin)
    - Use this helper in all section mutation server actions (work items, must change, tests, M4, completion)
    - _Requirements: 19.3, 19.7, 19.10_

  - [x] 11.2 Integrate SSE section highlighting in Section Dashboard
    - Fetch current user's assigned section via getUserAssignedSection query
    - Pass isAssignedToCurrentSSE flag to each SectionCard
    - Assigned section card gets distinct border/badge visual indicator
    - _Requirements: 19.4, 19.8_

  - [ ]* 11.3 Write property test: SSE Assignment Requires Exactly One Section
    - **Property 14: SSE Assignment Requires Exactly One Section**
    - Generate random SSE creation inputs (0 sections, 1 section, 2+ sections), verify exactly-one constraint enforced
    - **Validates: Requirements 19.1, 19.2, 19.9**

- [x] 12. Checkpoint - Verify UI components and SSE access control
  - Ensure Section Dashboard renders correctly with 10 sections, Section Detail shows correct data in edit/read-only modes, SSE access control works end-to-end, PDF export generates correct document. Ask the user if questions arise.

- [x] 13. Wire job card generation into rake registration flow
  - [x] 13.1 Integrate generateJobCardForCoach into existing rake registration flow
    - After coach creation in rake registration, call generateJobCardForCoach for each coach
    - Pass rake_type, coach_type, poh_cycle from rake/coach data
    - Handle errors gracefully — if job card generation fails, show error but don't block rake registration
    - _Requirements: 1.3, 12.5_

  - [x] 13.2 Add "Sections" navigation link on coach detail page
    - Add link/tab to navigate from existing coach detail page to sections dashboard
    - Link to `/rakes/[rakeId]/coaches/[coachId]/sections`
    - _Requirements: 15.1, 15.4_

  - [x] 13.3 Add "Section Analysis" navigation link on rake detail page
    - Add link/tab to navigate from existing rake detail page to section analysis matrix
    - Link to `/rakes/[rakeId]/section-analysis`
    - _Requirements: 16.1_

  - [ ]* 13.4 Write property test: WI Version Update Immutability
    - **Property 5: WI Version Update Immutability**
    - Generate job cards, update WI template versions, verify existing section_work_items still reference original WI version, new job cards use updated version
    - **Validates: Requirements 12.4, 10.7**

  - [ ]* 13.5 Write property test: Section Deletion Prevention on Active Job Cards
    - **Property 13: Section Deletion Prevention on Active Job Cards**
    - Generate active job cards, attempt to delete section assignments, verify rejection (ON DELETE RESTRICT)
    - **Validates: Requirements 18.4**

- [x] 14. Final checkpoint - Verify all tests pass and integration
  - Ensure all tests pass, all 19 requirements are covered, SSE access control works across all data entry points, PDF export is correct, section analysis matrix shows correct data. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (fast-check library)
- Unit tests validate specific examples and edge cases
- All 14 correctness properties defined in the design document are covered
