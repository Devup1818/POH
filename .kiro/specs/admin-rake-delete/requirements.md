# Requirements Document

## Introduction

This feature adds the ability for Admin users to edit rake details and permanently delete a rake from the system. Currently, rakes can only be created and viewed — there is no mechanism to modify rake information or remove a rake and its associated data. The edit operation allows Admins to update rake metadata (rake number, rake type, POH type, shed assignment, intake date, estimated completion date, and total coaches) from the rake detail page. The delete operation cascades to all related entities (coaches, stage history, section status, parts, checklist items, tests, and notes). Both operations are restricted to Admin users and include appropriate confirmation and feedback mechanisms.

## Glossary

- **Admin**: A user with the "Admin" role, who has full access to all sheds and all operations
- **Rake**: A group of railway coaches undergoing Periodic Overhaul (POH) at a shed
- **Dashboard**: The main page displaying active rake cards with summary information
- **Rake_Detail_Page**: The page showing full details of a single rake, including its coaches
- **Delete_Confirmation_Dialog**: A modal dialog requiring explicit user confirmation before a rake is deleted
- **Delete_Rake_Action**: The server action that performs the cascade deletion of a rake and all associated data
- **Edit_Rake_Modal**: A modal dialog containing a form pre-populated with the current rake details, allowing the Admin to modify rake metadata
- **Edit_Rake_Action**: The server action that validates and persists updated rake details to the database
- **Rake_Header**: The header component on the rake detail page showing rake identity, stats, and admin action buttons (edit, delete)
- **Cascade_Deletion**: The process of deleting a rake and all database records that reference it (coaches, coach_stage_history, coach_section_status, coach_parts, coach_checklist_items, coach_tests, notes)
- **Rake_Category**: The classification of a rake as either EMU or MEMU
- **Rake_Type**: The type of rake, either "3-Phase Rake" or "Conventional Rake"
- **POH_Type**: The periodic overhaul cycle, one of "1st POH", "2nd POH", "3rd POH", or "4th POH"

## Requirements

### Requirement 1: Admin-Only Delete Permission

**User Story:** As an Admin, I want the delete rake option to be available only to Admin users, so that non-admin users cannot accidentally or intentionally remove rake data.

#### Acceptance Criteria

1. THE Permission_System SHALL restrict rake deletion to users with the "Admin" role
2. WHILE a user with a non-Admin role is viewing the Rake_Detail_Page, THE Rake_Header SHALL hide the delete rake control
3. WHILE a user with the Admin role is viewing the Rake_Detail_Page, THE Rake_Header SHALL display a delete rake button
4. WHEN a non-Admin user attempts to invoke the Delete_Rake_Action directly, THE Delete_Rake_Action SHALL reject the request and return an authorization error

### Requirement 2: Delete Confirmation Dialog

**User Story:** As an Admin, I want to see a confirmation dialog before a rake is deleted, so that I do not accidentally remove important data.

#### Acceptance Criteria

1. WHEN the Admin clicks the delete rake button on the Rake_Header, THE Delete_Confirmation_Dialog SHALL open and display the rake number being deleted
2. THE Delete_Confirmation_Dialog SHALL display a warning message indicating that deletion is permanent and all associated data (coaches, stage history, parts, checklists, tests, notes) will be removed
3. WHEN the Admin clicks the confirm button in the Delete_Confirmation_Dialog, THE System SHALL invoke the Delete_Rake_Action for the specified rake
4. WHEN the Admin clicks the cancel button in the Delete_Confirmation_Dialog, THE Delete_Confirmation_Dialog SHALL close without performing any deletion
5. WHILE the Delete_Rake_Action is in progress, THE Delete_Confirmation_Dialog SHALL disable the confirm and cancel buttons and display a loading indicator

### Requirement 3: Cascade Deletion of Rake Data

**User Story:** As an Admin, I want deleting a rake to remove all associated data, so that no orphaned records remain in the system.

#### Acceptance Criteria

1. WHEN the Delete_Rake_Action is invoked for a rake, THE Delete_Rake_Action SHALL delete the rake record from the rakes table
2. WHEN the Delete_Rake_Action deletes a rake, THE database SHALL cascade-delete all coaches belonging to that rake from the coaches table
3. WHEN the Delete_Rake_Action deletes coaches, THE database SHALL cascade-delete all coach_stage_history records referencing those coaches
4. WHEN the Delete_Rake_Action deletes coaches, THE database SHALL cascade-delete all coach_section_status records referencing those coaches
5. WHEN the Delete_Rake_Action deletes coaches, THE database SHALL cascade-delete all coach_parts records referencing those coaches
6. WHEN the Delete_Rake_Action deletes coaches, THE database SHALL cascade-delete all coach_checklist_items records referencing those coaches
7. WHEN the Delete_Rake_Action deletes coaches, THE database SHALL cascade-delete all coach_tests records referencing those coaches
8. WHEN the Delete_Rake_Action deletes coaches, THE database SHALL cascade-delete all notes records referencing those coaches

### Requirement 4: Server-Side Delete Action

**User Story:** As an Admin, I want the delete operation to be reliable and secure, so that data integrity is maintained.

#### Acceptance Criteria

1. THE Delete_Rake_Action SHALL verify the requesting user has the Admin role before performing any deletion
2. WHEN the Delete_Rake_Action receives a valid rake ID and the user is authorized, THE Delete_Rake_Action SHALL delete the rake from the database and return a success result
3. IF the specified rake ID does not exist in the database, THEN THE Delete_Rake_Action SHALL return an error indicating the rake was not found
4. IF a database error occurs during deletion, THEN THE Delete_Rake_Action SHALL return an error message describing the failure
5. WHEN the Delete_Rake_Action completes successfully, THE Delete_Rake_Action SHALL return a success result to the caller

### Requirement 5: Post-Deletion Navigation and Feedback

**User Story:** As an Admin, I want to be redirected to the dashboard after deleting a rake and see confirmation that the deletion succeeded, so that I have a clear workflow.

#### Acceptance Criteria

1. WHEN the Delete_Rake_Action completes successfully, THE System SHALL redirect the Admin to the Dashboard page
2. WHEN the Delete_Rake_Action completes successfully, THE System SHALL display a success toast notification confirming the rake was deleted
3. IF the Delete_Rake_Action fails, THEN THE System SHALL display an error toast notification with the failure reason
4. IF the Delete_Rake_Action fails, THEN THE Delete_Confirmation_Dialog SHALL close and the Admin SHALL remain on the Rake_Detail_Page


### Requirement 6: Admin-Only Edit Permission

**User Story:** As an Admin, I want the edit rake option to be available only to Admin users, so that non-admin users cannot modify rake metadata.

#### Acceptance Criteria

1. THE Permission_System SHALL restrict rake editing to users with the "Admin" role
2. WHILE a user with a non-Admin role is viewing the Rake_Detail_Page, THE Rake_Header SHALL hide the edit rake control
3. WHILE a user with the Admin role is viewing the Rake_Detail_Page, THE Rake_Header SHALL display an edit rake button alongside the delete rake button
4. WHEN a non-Admin user attempts to invoke the Edit_Rake_Action directly, THE Edit_Rake_Action SHALL reject the request and return an authorization error

### Requirement 7: Edit Rake Modal Form

**User Story:** As an Admin, I want to edit rake details through a pre-populated form, so that I can correct or update rake information without re-creating the rake.

#### Acceptance Criteria

1. WHEN the Admin clicks the edit rake button on the Rake_Header, THE Edit_Rake_Modal SHALL open with a form pre-populated with the current rake details
2. THE Edit_Rake_Modal SHALL display editable fields for rake number, rake category (EMU/MEMU), rake type (3-Phase Rake/Conventional Rake), POH type (1st POH/2nd POH/3rd POH/4th POH), shed assignment, intake date, and total coaches
3. THE Edit_Rake_Modal SHALL validate all fields using the same validation rules as the rake registration form (rake number required and max 50 characters, total coaches between 6 and 20, intake date not in the future)
4. WHEN the Admin modifies fields and clicks the save button, THE Edit_Rake_Modal SHALL invoke the Edit_Rake_Action with the updated values
5. WHEN the Admin clicks the cancel button in the Edit_Rake_Modal, THE Edit_Rake_Modal SHALL close without persisting any changes
6. WHILE the Edit_Rake_Action is in progress, THE Edit_Rake_Modal SHALL disable the save and cancel buttons and display a loading indicator
7. IF any field fails validation, THEN THE Edit_Rake_Modal SHALL display inline error messages for the invalid fields and prevent form submission

### Requirement 8: Server-Side Edit Action

**User Story:** As an Admin, I want the edit operation to validate input and update the database reliably, so that rake data remains consistent.

#### Acceptance Criteria

1. THE Edit_Rake_Action SHALL verify the requesting user has the Admin role before performing any update
2. WHEN the Edit_Rake_Action receives valid updated fields and the user is authorized, THE Edit_Rake_Action SHALL update the rake record in the database and return a success result
3. THE Edit_Rake_Action SHALL validate all input fields using the same schema rules as rake creation (rake number required, total coaches between 6 and 20, intake date not in the future, valid rake category, rake type, POH type, and shed ID)
4. IF the specified rake ID does not exist in the database, THEN THE Edit_Rake_Action SHALL return an error indicating the rake was not found
5. IF the updated rake number conflicts with another active rake at the same shed, THEN THE Edit_Rake_Action SHALL return an error indicating a duplicate rake number exists
6. IF a database error occurs during the update, THEN THE Edit_Rake_Action SHALL return an error message describing the failure
7. WHEN the total coaches value is changed, THE Edit_Rake_Action SHALL update only the total_coaches field on the rake record without modifying existing coach records

### Requirement 9: Post-Edit Feedback and Page Refresh

**User Story:** As an Admin, I want to see updated rake information immediately after editing, so that I can confirm the changes were applied.

#### Acceptance Criteria

1. WHEN the Edit_Rake_Action completes successfully, THE Edit_Rake_Modal SHALL close
2. WHEN the Edit_Rake_Action completes successfully, THE System SHALL display a success toast notification confirming the rake was updated
3. WHEN the Edit_Rake_Action completes successfully, THE Rake_Detail_Page SHALL refresh to display the updated rake details in the Rake_Header
4. IF the Edit_Rake_Action fails, THEN THE System SHALL display an error toast notification with the failure reason
5. IF the Edit_Rake_Action fails, THEN THE Edit_Rake_Modal SHALL remain open so the Admin can correct the input and retry
