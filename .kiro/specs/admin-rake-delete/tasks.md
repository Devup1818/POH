# Implementation Plan: Admin Rake Edit & Delete

## Overview

Add admin-only edit and delete operations to the rake detail page. The delete flow uses a confirmation dialog and cascade-deletes all associated data via existing DB constraints. The edit flow uses a modal form with Zod validation to update rake metadata. Both operations follow existing server action patterns with `verifyAdmin()`, `Result<T>`, audit logging, and toast feedback.

## Tasks

- [x] 1. Add permission helpers and edit validation schema
  - [x] 1.1 Add `canDeleteRake` and `canEditRake` permission helpers
    - Add two new functions to `src/lib/auth/permissions.ts` that check `ADMIN_ONLY` role array
    - Both return `boolean` based on whether the role is in `ADMIN_ONLY`
    - _Requirements: 1.1, 6.1_

  - [x] 1.2 Add `editRakeSchema` to validation module
    - Add a new Zod schema in `src/lib/validations/rake.ts` that extends `rakeDetailsSchema` with `rakeId` (UUID string) and `intakeDate` (using existing `intakeDateSchema`)
    - Export the schema and its inferred type
    - _Requirements: 7.3, 8.3_

- [x] 2. Implement server actions for delete and edit
  - [x] 2.1 Implement `deleteRake` server action
    - Add `deleteRake(rakeId: string): Promise<Result<void>>` to `src/lib/actions/rake.ts`
    - Verify admin role using `verifyAdmin()` pattern from existing actions
    - Validate rake exists, delete the rake row (DB CASCADE handles child records)
    - Write audit log entry with `action='DELETE'`, `entity_type='rake'`, snapshot in `old_values`
    - Return `Result<void>` with appropriate success/error
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 2.2 Implement `editRake` server action
    - Add `editRake(input): Promise<Result<void>>` to `src/lib/actions/rake.ts`
    - Verify admin role, validate input with `editRakeSchema`
    - Check for duplicate rake number at same shed (excluding current rake)
    - Update rake record, write audit log with old/new values
    - Only update `total_coaches` column without modifying coach records
    - Return `Result<void>` with appropriate success/error
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ]* 2.3 Write property test: Admin-only action enforcement
    - **Property 1: Admin-only action enforcement**
    - Generate random non-Admin roles, invoke delete/edit actions, assert unauthorized result
    - **Validates: Requirements 1.1, 1.4, 4.1, 6.1, 6.4, 8.1**

  - [ ]* 2.4 Write property test: Edit validation rejects invalid input
    - **Property 5: Edit validation rejects invalid input**
    - Generate random invalid inputs (empty strings, out-of-range coaches, future dates, invalid enums), invoke edit action, assert rejection
    - **Validates: Requirements 7.3, 8.3**

  - [ ]* 2.5 Write property test: Coach records preserved on total_coaches change
    - **Property 6: Coach records preserved on total_coaches change**
    - Generate random valid totalCoaches values (6-20), edit an existing rake, assert coach record count unchanged
    - **Validates: Requirements 8.7**

- [x] 3. Checkpoint - Ensure server actions work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Create DeleteRakeDialog component
  - [x] 4.1 Implement `DeleteRakeDialog` component
    - Create `src/components/rakes/delete-rake-dialog.tsx`
    - Props: `open`, `onClose`, `rakeId`, `rakeNumber`
    - Display rake number and cascade deletion warning message listing all affected data types (coaches, stage history, parts, checklists, tests, notes)
    - Confirm button calls `deleteRake` server action
    - Loading state disables confirm and cancel buttons, shows spinner
    - On success: close dialog, show success toast, redirect to `/` via `router.push`
    - On failure: close dialog, show error toast, stay on page
    - Cancel button closes dialog without action
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4_

- [x] 5. Create EditRakeModal component
  - [x] 5.1 Implement `EditRakeModal` component
    - Create `src/components/rakes/edit-rake-modal.tsx`
    - Props: `open`, `onClose`, `rakeId`, `currentValues` (rakeNumber, rakeCategory, rakeType, pohType, shedId, totalCoaches, intakeDate)
    - Pre-populate form fields with `currentValues`
    - Editable fields: rake number, rake category (EMU/MEMU), rake type, POH type, shed assignment, intake date, total coaches
    - Client-side validation using `rakeDetailsSchema` + `intakeDateSchema`
    - Inline error messages for invalid fields, prevent submission on validation failure
    - Save button calls `editRake` server action
    - Loading state disables save and cancel buttons, shows spinner
    - On success: close modal, show success toast, call `router.refresh()`
    - On failure: show error toast, keep modal open for retry
    - Cancel button closes modal without changes
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 6. Integrate edit/delete buttons into RakeHeader and RakeDetailPage
  - [x] 6.1 Modify `RakeHeader` to show admin action buttons
    - Add `rakeId`, `rakeCategory`, and `shedId` to `RakeHeaderProps`
    - Import `useAuth` and `canDeleteRake`/`canEditRake` from permissions
    - Conditionally render Edit (Pencil icon) and Delete (Trash2 icon) buttons only when user role passes permission check
    - Add state for controlling `DeleteRakeDialog` and `EditRakeModal` open/close
    - Render both dialog/modal components within `RakeHeader`, passing required props
    - _Requirements: 1.2, 1.3, 2.1, 6.2, 6.3_

  - [x] 6.2 Update `RakeDetailPage` to pass additional props to `RakeHeader`
    - Pass `rakeId`, `rakeCategory`, `shedId`, and `intakeDate` from the rake data to `RakeHeader`
    - Ensure all values needed by `EditRakeModal` `currentValues` are available
    - _Requirements: 7.1_

  - [ ]* 6.3 Write property test: Non-Admin UI button visibility
    - **Property 2: Non-Admin UI button visibility**
    - Generate random non-Admin roles, render RakeHeader, assert no edit/delete buttons in output
    - **Validates: Requirements 1.2, 6.2**

- [x] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The database already has `ON DELETE CASCADE` constraints, so no migration is needed
- Both server actions follow the existing `Result<T>` pattern and `verifyAdmin()` guard used in `admin-users.ts`
- Property tests use `fast-check` with minimum 100 iterations
- Each task references specific requirements for traceability
