# Implementation Plan: POH Architecture Changes

## Overview

Incremental implementation of 7 major changes to the Railway POH Management System: rake type update, coach number validation, intake auto-advance, intake date calendar, coach type field, POH sections architecture (10 fixed sections), and database migration. Tasks ordered: DB migration → types/constants → validation → server actions → UI components → permissions → tests.

## Tasks

- [x] 1. Database Migration
  - [x] 1.1 Create migration file `supabase/migrations/010_poh_architecture_changes.sql`
    - ALTER `rakes.rake_type` column to `VARCHAR(20)` and update CHECK constraint to allow only `'3-Phase Rake'` and `'Conventional Rake'`
    - ALTER `rakes.intake_date` to remove `DEFAULT NOW()` constraint (keep `NOT NULL`)
    - ALTER `coaches.coach_number` column to `VARCHAR(8)` and update CHECK constraint to `^\d{5,8}$`
    - ADD `coach_type VARCHAR(2) NOT NULL DEFAULT 'MC' CHECK (coach_type IN ('MC','TC'))` column to `coaches` table
    - CREATE `coach_section_status` table with columns: id, coach_id (FK), section_name (CHECK 10 sections), status (DEFAULT 'Not Started'), started_at, completed_at, completed_by (FK), notes, created_at, updated_at, UNIQUE(coach_id, section_name)
    - CREATE `section_in_charge_assignments` table with columns: id, user_id (FK), shed_id (FK), section_name (CHECK 10 sections), created_at, UNIQUE(user_id, shed_id, section_name)
    - Add RLS policies for both new tables
    - Add data migration: map existing `'EMU'` → `'3-Phase Rake'`, `'MEMU'` → `'Conventional Rake'`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [x] 2. Update TypeScript Types and Constants
  - [x] 2.1 Update types in `src/types/index.ts`
    - Change `RakeType` from `'EMU' | 'MEMU'` to `'3-Phase Rake' | 'Conventional Rake'`
    - Add `CoachType = 'MC' | 'TC'`
    - Add `POHSection = 'E2' | 'E3' | 'E5' | 'M2' | 'M3' | 'M5' | 'M6' | 'Painting' | 'M8' | 'M4'`
    - Add `SectionWorkStatus = 'Not Started' | 'In Progress' | 'Completed'`
    - Add `CoachSectionStatus` interface with coach_id, section_name, status, started_at, completed_at, completed_by, notes
    - Add `SectionInChargeAssignment` interface with user_id, shed_id, section_name
    - _Requirements: 1.1, 2.1, 5.3, 6.1, 6.9_

  - [x] 2.2 Update constants in `src/lib/constants.ts`
    - Add `POH_SECTIONS` constant array: `['E2', 'E3', 'E5', 'M2', 'M3', 'M5', 'M6', 'Painting', 'M8', 'M4'] as const`
    - Add `RAKE_TYPES` constant: `['3-Phase Rake', 'Conventional Rake'] as const`
    - Add `COACH_TYPES` constant: `['MC', 'TC'] as const`
    - Keep existing `POH_STAGE_ORDER` for backward compatibility
    - _Requirements: 1.1, 5.1, 6.1, 6.2_

- [x] 3. Update Zod Validation Schemas
  - [x] 3.1 Update validation schemas in `src/lib/validations/rake.ts`
    - Change `rakeDetailsSchema.rakeType` enum from `['EMU', 'MEMU']` to `['3-Phase Rake', 'Conventional Rake']`
    - Change `coachNumberSchema` regex from `^\d{6}$` to `^\d{5,8}$` with updated error message "Coach number 5 se 8 digits ka hona chahiye"
    - Add `coachTypeSchema`: `z.enum(['MC', 'TC'])` with error message "Coach type (MC/TC) select karein"
    - Add `intakeDateSchema`: `z.string().refine()` that rejects future dates with message "Future date allowed nahi hai"
    - Update `fullRegistrationSchema` to include `coachTypes: z.array(coachTypeSchema)`
    - Update `coachNumbersSchema` function to also validate coach types array length matches totalCoaches
    - _Requirements: 1.5, 2.6, 4.5, 4.6, 5.3_

  - [ ]* 3.2 Write property tests for validation schemas
    - **Property 1: Rake Type Validation** — Generate arbitrary strings via fast-check, verify Zod schema accepts iff value is "3-Phase Rake" or "Conventional Rake"
    - **Validates: Requirements 1.4, 1.5, 7.1**
    - **Property 2: Coach Number Validation** — Generate arbitrary strings, verify regex acceptance for 5-8 digit numeric strings only
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.6**
    - **Property 3: Coach Type Validation** — Generate arbitrary strings, verify Zod schema accepts iff value is "MC" or "TC"
    - **Validates: Requirements 5.3, 5.4, 7.3**
    - **Property 4: Intake Date Rejects Future Dates** — Generate arbitrary dates, verify acceptance only for dates on or before today
    - **Validates: Requirements 4.5, 4.6**

- [x] 4. Checkpoint - Ensure migration, types, constants, and validation schemas are correct
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Update Server Actions
  - [x] 5.1 Update `createRake` in `src/lib/actions/rake.ts`
    - Update `createRakeSchema` to include `coachTypes: z.array(coachTypeSchema)` and `intakeDate: intakeDateSchema`
    - Update `createRake` function signature to accept `coachTypes: string[]` and `intakeDate: string` parameters
    - Replace hardcoded `intake_date: new Date().toISOString()` with user-provided `intakeDate` value
    - Insert `coach_type` field when creating coach rows from `coachTypes` array
    - After coach creation, insert 10 `coach_section_status` rows per coach (one for each POH section, all status 'Not Started')
    - _Requirements: 1.3, 2.5, 4.4, 5.3, 6.9, 7.5_

  - [ ]* 5.2 Write property test for coach section status creation
    - **Property 6: Coach Section Status Invariant** — After createRake, verify exactly 10 coach_section_status records per coach, one for each POH section, no duplicates
    - **Validates: Requirements 6.9, 7.5**

- [x] 6. Update Registration Form UI
  - [x] 6.1 Update Step 1 in `src/components/rakes/registration-form.tsx`
    - Replace EMU/MEMU rake type buttons with "3-Phase Rake" and "Conventional Rake" options
    - Import and use `RAKE_TYPES` constant for rendering options
    - _Requirements: 1.1, 1.2_

  - [x] 6.2 Update Step 2 in `src/components/rakes/registration-form.tsx`
    - Add Coach Type (MC/TC) selector alongside each coach number input field
    - Update coach number input: change maxLength from 6 to 8, update placeholder text to indicate 5-8 digits
    - Add `coachTypes` state array to track MC/TC selection per coach
    - Validate coach type selection per coach on form submission
    - _Requirements: 2.1, 5.1, 5.2_

  - [x] 6.3 Update Step 3 (Review) in `src/components/rakes/registration-form.tsx`
    - Display coach type (MC/TC) alongside each coach number in the review step
    - Pass `coachTypes` and `intakeDate` to the `createRake` server action on submit
    - _Requirements: 5.6_

  - [ ]* 6.4 Write unit tests for registration form changes
    - Test that "3-Phase Rake" and "Conventional Rake" options render in Step 1
    - Test that MC/TC selector renders per coach in Step 2
    - Test validation error on empty rake type and empty coach type
    - _Requirements: 1.1, 1.2, 5.1, 5.2_

- [x] 7. Implement Intake Form Changes
  - [x] 7.1 Add intake date calendar picker to intake form
    - Add a Date Picker field labeled "Date of Intake" to the intake form component
    - Pre-fill the date picker with the current date
    - Add Zod validation: required field, no future dates allowed
    - Store user-selected intake_date when submitting intake
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 7.2 Implement intake auto-advance logic
    - After intake completion for a coach already in the shed, auto-navigate to next workflow step within 1 second
    - Do NOT auto-advance for newly registered coaches
    - Show brief loading/transition indicator during auto-advance
    - Handle navigation failure gracefully: show toast and stay on current view
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 7.3 Write unit tests for intake form changes
    - Test date picker renders with today's date pre-filled
    - Test validation error on empty intake date and future date
    - Test auto-advance triggers for existing shed coaches
    - Test auto-advance does NOT trigger for newly registered coaches
    - Test loading indicator shown during auto-advance
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.6_

- [x] 8. Checkpoint - Ensure server actions and UI components work end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Permissions and Section Filtering
  - [x] 9.1 Add section access functions in `src/lib/auth/permissions.ts`
    - Add `canAccessSection(userId: string, sectionName: string): Promise<boolean>` — checks `section_in_charge_assignments` table
    - Add `getUserSections(userId: string, shedId: string): Promise<string[]>` — returns assigned POH section names for a user
    - Admin users bypass section filtering (see all sections)
    - _Requirements: 6.4, 6.5, 6.7, 6.8_

  - [ ]* 9.2 Write property test for section data filtering
    - **Property 8: Section In-Charge Data Filtering** — For any SSE user assigned to specific sections, dashboard queries return only data from assigned sections
    - **Validates: Requirements 6.4, 6.6, 6.8**

- [x] 10. Update Dashboard and Coach Views
  - [x] 10.1 Update dashboard for section-wise display
    - For Section In-Charge (SSE) users: filter dashboard data by assigned POH sections using `getUserSections()`
    - For Admin users: show aggregated view across all 10 POH sections
    - Update `src/lib/queries/dashboard.ts` to support section-based filtering
    - _Requirements: 6.4, 6.6, 6.10_

  - [x] 10.2 Update coach listing and detail views
    - Display Coach_Type (MC/TC) badge alongside coach number in all coach listing views
    - Add section-wise work status grid (10 sections x status) to coach detail page
    - Filter coach section status data by SSE's assigned sections
    - _Requirements: 5.6, 6.4, 6.8, 6.9_

  - [ ]* 10.3 Write unit tests for dashboard and coach views
    - Test SSE user sees only assigned section data on dashboard
    - Test Admin user sees aggregated view across all 10 sections
    - Test coach type badge renders in coach listing
    - Test section-wise status grid renders on coach detail page
    - _Requirements: 5.6, 6.4, 6.6, 6.10_

- [x] 11. Remaining Property Tests and Integration Wiring
  - [ ]* 11.1 Write property test for section status independence
    - **Property 7: Section Status Independence** — Updating one section's status for a coach does not change any other section's status for the same coach
    - **Validates: Requirements 6.9**

  - [ ]* 11.2 Write property test for section assignment round-trip
    - **Property 9: Section Assignment Round-Trip** — Creating a section_in_charge_assignment and querying it back returns the same user-shed-section mapping
    - **Validates: Requirements 6.7, 7.6**

  - [ ]* 11.3 Write property test for POH sections constant integrity
    - **Property 10: POH Sections Constant Integrity** — POH_SECTIONS constant always returns exactly 10 values matching {E2, E3, E5, M2, M3, M5, M6, Painting, M8, M4} with no duplicates
    - **Validates: Requirements 6.1, 6.3**

- [x] 12. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` library with minimum 100 iterations
- Migration file is `010_poh_architecture_changes.sql` (follows existing 001-009 sequence)
- M4 is M&P/Machinery support section (NOT M9)
- Existing EMU/MEMU data will be migrated to new rake type values in migration step