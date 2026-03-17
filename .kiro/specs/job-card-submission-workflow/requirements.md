# Requirements Document

## Introduction

This feature implements the complete Job Card Submission and Admin Review Workflow for the POH Railway Portal. It introduces a structured 4-part job card (Part A: Must-Change Items, Part B: Maintenance Activities, Part C: Final Testing Values, Part D: Staff Register), a formal submission flow with digital signature, an admin review panel with approve/send-back capability, and a rake release gate that enforces all section approvals before releasing a rake for service. The UX is designed to be intuitive for SSEs accustomed to paper-based job cards, with card-based layouts, visual progress indicators, auto-save, and mobile-friendly design.

## Glossary

- **Portal**: The POH (Periodic Overhaul) Railway Management web application
- **Job_Card**: A digital document representing the 4-part work record for a specific section and coach combination during POH
- **Part_A**: The Must-Change Items section of a Job Card, auto-loaded based on POH cycle number
- **Part_B**: The Maintenance Activities section of a Job Card, containing remarks and work-done entries per activity
- **Part_C**: The Final Testing Values section of a Job Card, containing structured brake test data with standard vs actual comparison
- **Part_D**: The Staff Register section of a Job Card, recording personnel who worked on the job card
- **SSE**: Senior Section Engineer — the primary user who fills and submits job cards
- **Admin**: The administrative user who reviews, approves, or sends back submitted job cards
- **Brake_Test_Table**: A structured data entry table for recording EP/Auto/Emergency brake test values (Application time, Release time, MR pressure, BP pressure, BC pressure)
- **Leakage_Test**: A sub-section of Part C recording MR, BP, and BC leakage values
- **Standard_Threshold**: The predefined acceptable range for each brake test parameter used for auto-validation
- **Digital_Signature**: An OTP or PIN-based verification step performed by the SSE at submission time, using the existing OTP authentication system
- **Job_Card_Status**: The workflow state of a Job Card — one of DRAFT, SUBMITTED, APPROVED, or SENT_BACK
- **Rake_Release_Gate**: The system checkpoint that verifies all section job cards for all coaches are APPROVED and S10 Final Testing is done before allowing rake release
- **S10_Final_Testing**: The final testing gate check that must be completed before a rake can be released
- **POH_Cycle**: The periodic overhaul cycle number (1st, 2nd, 3rd, or 4th POH) which determines must-change item applicability
- **Auto_Save**: The mechanism that automatically persists SSE input data at regular intervals without requiring manual save actions
- **Section**: One of the 10 workshop sections (M2, M3, M4, M5, M6, M8, Painting, E2, E3, E5) in the POH process
- **Coach**: An individual rail coach within a rake undergoing POH

## Requirements

### Requirement 1: 4-Part Job Card Structure

**User Story:** As an SSE, I want the digital job card to mirror the physical 4-part structure (Part A/B/C/D), so that I can fill it in the same familiar way I fill paper job cards.

#### Acceptance Criteria

1. WHEN an SSE opens a Job_Card for a section and coach combination, THE Portal SHALL display four distinct card-based sections labeled Part A (Must-Change Items), Part B (Maintenance Activities), Part C (Final Testing Values), and Part D (Staff Register).
2. THE Portal SHALL display a visual progress indicator showing which of the four parts are complete and which are pending for the current Job_Card.
3. WHEN all required fields in a part are filled, THE Portal SHALL mark that part with a green completion badge.
4. WHEN a part has incomplete required fields, THE Portal SHALL mark that part with an amber in-progress badge.
5. THE Portal SHALL render the 4-part Job_Card layout in a responsive, mobile-friendly format suitable for use on the workshop floor.
6. THE Portal SHALL allow the SSE to navigate between the four parts without losing entered data.

### Requirement 2: Part A — Must-Change Items

**User Story:** As an SSE, I want must-change items to be auto-loaded based on the POH cycle number, so that I only see items relevant to the current overhaul and do not need to manually determine applicability.

#### Acceptance Criteria

1. WHEN a Job_Card is opened, THE Portal SHALL auto-load all must-change items from the existing `must_change_item_instances` table for the given coach and section.
2. WHEN a must-change item is not applicable for the current POH_Cycle, THE Portal SHALL display that item in a greyed-out state with an "N/A this POH" label.
3. WHEN a must-change item is applicable for the current POH_Cycle, THE Portal SHALL display a checkbox and a remarks field for the SSE to mark completion and add notes.
4. THE Portal SHALL display the total count of applicable must-change items and the count of completed items (e.g., "3/5 completed").
5. WHEN the SSE marks a must-change item as replaced, THE Portal SHALL record the old part detail, new part detail, and replacement timestamp.

### Requirement 3: Part B — Maintenance Activities

**User Story:** As an SSE, I want a dedicated remarks/work-done field for each maintenance activity, so that I can record observations and actions taken during overhaul.

#### Acceptance Criteria

1. WHEN a Job_Card is opened, THE Portal SHALL display all work items from the existing `section_work_items` table for the given coach and section, each with a "Remarks / Work Done" text field.
2. THE Portal SHALL allow the SSE to enter free-text remarks for each maintenance activity describing observations and work performed.
3. WHEN the SSE enters remarks for a work item, THE Portal SHALL update the work item status to "In Progress" if the status was "Not Started".
4. THE Portal SHALL display a status indicator (Not Started, In Progress, Completed) next to each maintenance activity.
5. WHEN the SSE marks a maintenance activity as completed, THE Portal SHALL require that the remarks field contains at least one character of text.

### Requirement 4: Part C — Structured Brake Test Values

**User Story:** As an SSE, I want a structured brake test table matching the physical job card format, so that I can enter EP, Auto, and Emergency brake test values with automatic standard-vs-actual comparison.

#### Acceptance Criteria

1. WHEN Part C is displayed for a section that includes brake testing, THE Portal SHALL render a structured Brake_Test_Table with rows for EP/MEL, Auto, and Emergency brake types.
2. FOR EACH brake type row, THE Portal SHALL provide input fields for Application time (seconds), Release time (seconds), MR pressure (kg/cm²), and BP pressure (kg/cm²).
3. THE Portal SHALL display the Standard_Threshold value next to each input field so the SSE can see the acceptable range.
4. WHEN the SSE enters an actual value, THE Portal SHALL automatically compare the actual value against the Standard_Threshold and display a green pass icon or red fail icon.
5. THE Portal SHALL render a Leakage_Test sub-section with input fields for MR, BP, and BC leakage values (kg/cm²).
6. WHEN all brake test and leakage test values are entered and pass validation, THE Portal SHALL mark Part C as complete.
7. IF a test value falls outside the Standard_Threshold range, THEN THE Portal SHALL highlight the field in red and display the acceptable range.
8. FOR sections that do not include brake testing, THE Portal SHALL display the existing generic test entry interface from `section_test_instances`.

### Requirement 5: Part D — Staff Register

**User Story:** As an SSE, I want the staff register to auto-fill my details from login and allow me to add other staff members, so that the record of who worked on each job card is accurate and easy to maintain.

#### Acceptance Criteria

1. WHEN a Job_Card is opened, THE Portal SHALL auto-populate the first staff register entry with the logged-in SSE's full name and user ID.
2. THE Portal SHALL display a staff register table with columns: Employee Name, Coach Number, Job Sr. No., User ID, and Signature Timestamp.
3. THE Portal SHALL allow the SSE to add additional staff members to the register by entering their Employee Name and Job Sr. No.
4. WHEN a staff member is added to the register, THE Portal SHALL record the current timestamp as the Signature Timestamp.
5. THE Portal SHALL prevent duplicate staff entries for the same user ID within a single Job_Card.
6. THE Portal SHALL display the total count of staff registered for the current Job_Card.

### Requirement 6: Auto-Save

**User Story:** As an SSE, I want my entered data to be automatically saved as I fill in the job card, so that I do not lose work if I navigate away or lose connectivity.

#### Acceptance Criteria

1. WHILE the SSE is editing a Job_Card in DRAFT status, THE Portal SHALL auto-save all entered data every 30 seconds.
2. WHEN the SSE modifies any field in the Job_Card, THE Portal SHALL display a "Saving..." indicator followed by a "Saved" confirmation with timestamp.
3. IF the auto-save fails due to a network error, THEN THE Portal SHALL display a warning message indicating unsaved changes and retry the save when connectivity is restored.
4. THE Portal SHALL persist auto-saved data to the database so that the SSE can resume editing from the last saved state on any device.

### Requirement 7: Job Card Submission Flow

**User Story:** As an SSE, I want to formally submit a completed job card with digital signature verification, so that the admin is notified and can review my work.

#### Acceptance Criteria

1. WHEN all four parts of a Job_Card have required fields completed, THE Portal SHALL enable the "SUBMIT JOB CARD" button.
2. WHEN the "SUBMIT JOB CARD" button is disabled, THE Portal SHALL display a tooltip listing which parts or fields are incomplete.
3. WHEN the SSE clicks "SUBMIT JOB CARD", THE Portal SHALL prompt for Digital_Signature verification using the existing OTP authentication system.
4. WHEN the Digital_Signature is verified successfully, THE Portal SHALL change the Job_Card_Status from DRAFT to SUBMITTED and record the submission timestamp and submitting user.
5. WHEN a Job_Card is submitted, THE Portal SHALL send a notification to all Admin users via the existing notification system indicating the section, coach number, and submitting SSE.
6. WHILE a Job_Card is in SUBMITTED status, THE Portal SHALL prevent the SSE from editing the Job_Card content.
7. IF the Digital_Signature verification fails, THEN THE Portal SHALL display an error message and keep the Job_Card in DRAFT status.

### Requirement 8: Admin Review Panel

**User Story:** As an Admin, I want a dashboard showing all submitted job cards with summary status indicators, so that I can efficiently review and process job card submissions.

#### Acceptance Criteria

1. THE Portal SHALL display an Admin Review Panel accessible only to users with the Admin role.
2. THE Portal SHALL display a table of submitted job cards with columns: Section, Coach Number, File Reference, Must-Change Status (completed/total), Test Values Status (pass/fail summary), Staff Sign Status (count), Submitted By, Submission Date, and Job_Card_Status.
3. THE Portal SHALL use color-coded status badges: green for APPROVED, blue for SUBMITTED, yellow for under review, and red for SENT_BACK.
4. WHEN the Admin clicks on a job card row, THE Portal SHALL display the full Job_Card details including all four parts in read-only mode.
5. THE Portal SHALL allow the Admin to filter submitted job cards by section, coach number, status, and date range.
6. THE Portal SHALL display a count of pending (SUBMITTED) job cards requiring review.

### Requirement 9: Approve and Send-Back Workflow

**User Story:** As an Admin, I want to approve or send back job cards with a rejection reason, so that SSEs receive clear feedback on what needs correction.

#### Acceptance Criteria

1. WHEN the Admin is viewing a submitted Job_Card, THE Portal SHALL display "APPROVE" and "SEND BACK" action buttons.
2. WHEN the Admin clicks "APPROVE", THE Portal SHALL change the Job_Card_Status to APPROVED and record the approving Admin's user ID and approval timestamp.
3. WHEN the Admin clicks "SEND BACK", THE Portal SHALL require the Admin to enter a rejection reason before confirming.
4. WHEN a Job_Card is sent back, THE Portal SHALL change the Job_Card_Status to SENT_BACK and store the rejection reason.
5. WHEN a Job_Card is sent back, THE Portal SHALL send a notification to the submitting SSE with the rejection reason via the existing notification system.
6. WHEN an SSE opens a SENT_BACK Job_Card, THE Portal SHALL display the rejection reason prominently and allow the SSE to edit and re-submit the Job_Card.
7. WHEN an SSE re-submits a previously SENT_BACK Job_Card, THE Portal SHALL follow the same submission flow as Requirement 7 (Digital_Signature verification, status change to SUBMITTED, Admin notification).

### Requirement 10: Rake Release Gate

**User Story:** As an Admin, I want the system to enforce that all section job cards for all coaches are approved before releasing a rake, so that no rake is released with incomplete or unreviewed work.

#### Acceptance Criteria

1. THE Portal SHALL display a Rake Release checklist showing the approval status of every section Job_Card for every coach in the rake.
2. WHEN any section Job_Card for any coach is not in APPROVED status, THE Portal SHALL disable the "RELEASE RAKE FOR SERVICE" button.
3. WHEN the "RELEASE RAKE FOR SERVICE" button is disabled, THE Portal SHALL display which section-coach combinations are still pending approval.
4. WHEN all section Job_Cards for all coaches are APPROVED and S10_Final_Testing is marked as done, THE Portal SHALL enable the "RELEASE RAKE FOR SERVICE" button.
5. WHEN the Admin clicks "RELEASE RAKE FOR SERVICE", THE Portal SHALL record the release date, releasing officer name, and mark the rake as released.

### Requirement 11: Auto-Archive on Rake Release

**User Story:** As an Admin, I want the system to automatically generate and archive PDF job cards and update POH tracking when a rake is released, so that records are preserved and the next POH cycle is prepared.

#### Acceptance Criteria

1. WHEN a rake is released, THE Portal SHALL automatically generate a PDF for each section Job_Card for each coach and store the PDF in Supabase Storage.
2. WHEN a rake is released, THE Portal SHALL increment the POH_Cycle number on the rake record (1st→2nd, 2nd→3rd, 3rd→4th, 4th→1st).
3. WHEN a rake is released, THE Portal SHALL auto-calculate the next POH due date as the current date plus 18 months and store the date on the rake record.
4. WHEN a rake is released, THE Portal SHALL send a notification to Sr.DEE/ELS users via the existing notification system indicating the rake number, release date, and next POH due date.
5. WHEN a rake is released, THE Portal SHALL store the archived PDF URL on each Job_Card record for future reference.

### Requirement 12: Database Schema for Job Card Submissions

**User Story:** As a developer, I want a normalized database schema that extends the existing tables with workflow, staff register, and structured brake test data, so that the system maintains data integrity and queryability.

#### Acceptance Criteria

1. THE Portal SHALL store job card submission workflow data in a `job_card_submissions` table with fields: id, coach_id, section_id, status (DRAFT/SUBMITTED/APPROVED/SENT_BACK), submitted_by, submitted_at, approved_by, approved_at, rejection_reason, archived_pdf_url, digital_signature_verified, created_at, updated_at.
2. THE Portal SHALL store staff register entries in a `job_card_staff_register` table with fields: id, submission_id (FK to job_card_submissions), user_id, employee_name, coach_number, job_sr_no, signature_timestamp, created_at.
3. THE Portal SHALL store structured brake test values in a `brake_test_values` table with fields: id, submission_id (FK to job_card_submissions), test_type (EP/Auto/Emergency), application_time_standard, application_time_actual, release_time_standard, release_time_actual, mr_pressure_standard, mr_pressure_actual, bp_pressure_standard, bp_pressure_actual, passed, created_at, updated_at.
4. THE Portal SHALL store leakage test values in a `leakage_test_values` table with fields: id, submission_id (FK to job_card_submissions), mr_value, bp_value, bc_value, mr_passed, bp_passed, bc_passed, created_at.
5. THE Portal SHALL enforce foreign key constraints between job_card_submissions and the existing coaches, workshop_sections, and users tables.
6. THE Portal SHALL enforce Row Level Security policies on all new tables consistent with the existing RLS patterns (Admin full access, SSE access scoped to assigned sections and shed).

### Requirement 13: Inline Validation and UX Feedback

**User Story:** As an SSE, I want clear inline validation messages and visual feedback as I fill in the job card, so that I can correct errors before submission and complete the form efficiently.

#### Acceptance Criteria

1. WHEN the SSE enters a value in a required field, THE Portal SHALL validate the input inline and display a green checkmark for valid entries or a red error message for invalid entries.
2. WHEN a brake test actual value exceeds the Standard_Threshold, THE Portal SHALL display the acceptable range in the error message (e.g., "Application time must be < 8 seconds").
3. THE Portal SHALL display a completion percentage for the overall Job_Card based on the number of completed fields across all four parts.
4. WHEN the SSE attempts to submit a Job_Card with validation errors, THE Portal SHALL scroll to the first error and highlight the invalid field.
5. THE Portal SHALL use color-coded status badges throughout the Job_Card: green for complete/pass, amber for in-progress, red for fail/error, and grey for not-applicable.
