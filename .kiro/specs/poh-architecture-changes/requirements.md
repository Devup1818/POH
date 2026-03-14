# Requirements Document — POH Architecture Changes

## Introduction

Railway POH Management System mein 6 major changes karne hain. Yeh changes rake type options, coach number validation, intake workflow UX, intake date field, coach type (MC/TC) field, aur sabse bada — POH Sections architecture overhaul cover karte hain. Current system mein 8 generic sequential stages hain (Intake → Release); naye system mein 10 fixed workshop sections honge jahan har section ka apna In-Charge hoga.

## Glossary

- **System**: Railway POH Management System — the web application for managing Periodic Overhaul of railway coaches
- **Registration_Form**: The multi-step form used to register a new rake and its coaches into the system
- **Rake**: A set of coaches that undergo POH together
- **Coach**: An individual railway coach identified by a coach number
- **Rake_Type**: Classification of a rake — either "3-Phase Rake" or "Conventional Rake"
- **Coach_Type**: Classification of a coach — either Motor Coach (MC) or Trailer Coach (TC)
- **Coach_Number**: A numeric identifier for a coach, between 5 and 8 digits long
- **Intake_Form**: The form/workflow used when a coach enters the shed for POH
- **Intake_Date**: The calendar date on which a coach was taken in for POH, selected manually by the user
- **POH_Section**: One of 10 fixed workshop sections where specific POH work is performed: E2, E3, E5, M2, M3, M5, M6, Painting, M8, M4
- **Section_In_Charge**: A user role/assignment — the person responsible for a specific POH Section who can only view and manage work within that section
- **POH_Stage**: (Legacy) The current 8 sequential stages: Intake, Dismantling, Inspection, Reassembly, Finishing, Testing, Trial, Release
- **Date_Picker**: A calendar-based UI component for selecting a date

## Requirements

### Requirement 1: Rake Type Options Update

**User Story:** As a shed operator, I want to classify rakes as "3-Phase Rake" or "Conventional Rake", so that the rake type reflects the actual workshop terminology used in Indian Railways.

#### Acceptance Criteria

1. WHEN the Registration_Form is displayed, THE System SHALL present exactly two Rake_Type options: "3-Phase Rake" and "Conventional Rake"
2. WHEN a user submits the Registration_Form without selecting a Rake_Type, THE System SHALL display a validation error and prevent submission
3. WHEN a rake is created with a selected Rake_Type, THE System SHALL store the value as either "3-Phase Rake" or "Conventional Rake" in the database
4. THE System SHALL enforce a database CHECK constraint allowing only "3-Phase Rake" and "Conventional Rake" as valid Rake_Type values
5. THE System SHALL validate Rake_Type on the client side using a Zod enum schema with values "3-Phase Rake" and "Conventional Rake"

### Requirement 2: Coach Number Validation Update

**User Story:** As a shed operator, I want to enter coach numbers between 5 and 8 digits long, so that the system accommodates all valid coach number formats used across different railway zones.

#### Acceptance Criteria

1. THE System SHALL accept Coach_Number values containing a minimum of 5 digits and a maximum of 8 digits
2. THE System SHALL reject Coach_Number values containing fewer than 5 digits or more than 8 digits
3. WHEN a user enters a Coach_Number with non-numeric characters, THE System SHALL reject the input and display a validation error
4. THE System SHALL enforce a database CHECK constraint requiring Coach_Number to match the pattern of 5 to 8 numeric digits
5. THE System SHALL store Coach_Number in a VARCHAR(8) column in the database
6. THE System SHALL validate Coach_Number on the client side using a Zod regex schema matching 5 to 8 digits

### Requirement 3: Intake Auto-Advance

**User Story:** As a shed operator, I want the system to automatically navigate to the next step after completing intake for a coach already in the shed, so that I can process coaches faster without manual navigation.

#### Acceptance Criteria

1. WHEN intake is completed for a coach that is already present in the shed, THE System SHALL automatically navigate the user to the next available workflow step within 1 second
2. WHEN intake is completed for a newly registered coach, THE System SHALL remain on the current view and not auto-advance
3. WHILE auto-advance navigation is in progress, THE System SHALL display a brief visual indicator to the user

### Requirement 4: Intake Date Calendar Field

**User Story:** As a shed operator, I want to manually select the date of intake using a calendar picker, so that I can record the actual intake date which may differ from the registration date.

#### Acceptance Criteria

1. THE Intake_Form SHALL include a mandatory Date_Picker field labeled "Date of Intake"
2. WHEN the Intake_Form is displayed, THE System SHALL pre-fill the Date_Picker with the current date
3. WHEN a user submits the Intake_Form without selecting an Intake_Date, THE System SHALL display a validation error and prevent submission
4. WHEN a valid Intake_Date is selected, THE System SHALL store the user-selected date in the intake_date column of the rakes table
5. THE System SHALL accept Intake_Date values that are on or before the current date
6. IF a user selects an Intake_Date in the future, THEN THE System SHALL display a validation error stating that future dates are not allowed

### Requirement 5: Coach Type Field (MC/TC)

**User Story:** As a shed operator, I want to specify whether each coach is a Motor Coach (MC) or Trailer Coach (TC), so that the system can track coach types for section-wise work allocation.

#### Acceptance Criteria

1. WHEN the user enters a Coach_Number in the Registration_Form, THE System SHALL display a Coach_Type selection field with options "MC" and "TC"
2. WHEN a user submits the Registration_Form without selecting a Coach_Type for each coach, THE System SHALL display a validation error and prevent submission
3. WHEN a coach is created, THE System SHALL store the Coach_Type value as either "MC" or "TC" in a coach_type column
4. THE System SHALL enforce a database CHECK constraint allowing only "MC" and "TC" as valid Coach_Type values
5. THE System SHALL store Coach_Type in a VARCHAR(2) column in the coaches table
6. THE System SHALL display the Coach_Type alongside the Coach_Number in all coach listing views


### Requirement 6: POH Sections Architecture

**User Story:** As a workshop manager, I want the POH workflow organized into 10 fixed workshop sections instead of 8 generic stages, so that each section's In-Charge can independently track and manage their specific area of work.

#### Acceptance Criteria

1. THE System SHALL define exactly 10 fixed POH_Section values: E2, E3, E5, M2, M3, M5, M6, Painting, M8, and M4
2. THE System SHALL store the list of POH_Section values as application constants that are not configurable by administrators
3. THE System SHALL enforce a database CHECK constraint allowing only the 10 defined POH_Section values
4. WHEN a Section_In_Charge logs into the System, THE System SHALL display only the work items, coaches, and progress data associated with the Section_In_Charge's assigned POH_Section
5. THE System SHALL allow administrators to assign a user as Section_In_Charge for one or more POH_Sections within a shed
6. WHEN a Section_In_Charge views the dashboard, THE System SHALL filter all displayed data to show only the assigned POH_Section's information
7. THE System SHALL maintain a section assignment record linking each Section_In_Charge user to their assigned POH_Section and shed
8. WHILE a user is assigned as Section_In_Charge for a POH_Section, THE System SHALL restrict that user's data access to only the assigned section's coaches and work items
9. THE System SHALL track the status of work within each POH_Section independently for every coach undergoing POH
10. WHEN an administrator views the system, THE System SHALL display an aggregated view across all 10 POH_Sections

### Requirement 7: Database Migration for Architecture Changes

**User Story:** As a system administrator, I want the database schema updated to support all new fields and constraints, so that data integrity is maintained across all changes.

#### Acceptance Criteria

1. THE System SHALL create a database migration that modifies the rakes table rake_type CHECK constraint to allow only "3-Phase Rake" and "Conventional Rake"
2. THE System SHALL create a database migration that modifies the coaches table coach_number column to VARCHAR(8) with a CHECK constraint for 5 to 8 numeric digits
3. THE System SHALL create a database migration that adds a coach_type VARCHAR(2) column to the coaches table with a CHECK constraint allowing only "MC" and "TC"
4. THE System SHALL create a database migration that modifies the rakes table intake_date column to remove the DEFAULT NOW() constraint, making it a required user-provided value
5. THE System SHALL create a database migration that adds a poh_sections table or equivalent structure to track per-coach section-wise work status
6. THE System SHALL create a database migration that adds a section_in_charge assignment table linking users to specific POH_Sections within a shed
7. THE System SHALL ensure all migrations are backward-compatible and include rollback capability
