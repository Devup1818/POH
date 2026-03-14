# Requirements Document

## Introduction

The Railway POH Management System currently lacks a UI-based mechanism for creating and managing users. Admins must resort to direct SQL queries in Supabase to onboard new users, assign roles, and link them to sheds and sections. This feature introduces an Admin User Management panel that allows Admin users to create, view, edit, and deactivate users directly from the application UI. Users can be assigned specific roles and mapped to sections within a shed (e.g., Pneumatic, Bogey, Electrical) so that section-specific personnel can manage POH data for their area of responsibility.

## Glossary

- **Admin_Panel**: The user management page accessible only to users with the Admin role, located at `/admin/users`.
- **User_Record**: A row in the `users` table representing a registered user with email, full name, and role.
- **User_Role**: One of the four defined roles — Admin, Section_Engineer, Technician, Viewer.
- **Shed**: A railway maintenance facility (e.g., EMU Car Shed Ghaziabad) stored in the `sheds` table.
- **Section**: A functional area within a shed responsible for a specific part of the POH process (e.g., Pneumatic, Bogey/Bogie, Electrical, Traction Motor, Brake System, Body Shell).
- **Section_Assignment**: A mapping between a User_Record and one or more Sections within a Shed, stored in a new `user_section_assignments` table.
- **Shed_Assignment**: A mapping between a User_Record and a Shed, stored in the `user_shed_assignments` table.
- **Supabase_Auth**: The authentication service that manages user credentials, email-based login, and OTP verification.
- **User_List**: A table/list view within the Admin_Panel displaying all User_Records with filtering and search capabilities.
- **Invite_Flow**: The process by which an Admin creates a Supabase_Auth account for a new user and inserts the corresponding User_Record and assignments.

## Requirements

### Requirement 1: Admin-Only Access to User Management

**User Story:** As an Admin, I want the user management panel to be restricted to Admin users only, so that unauthorized users cannot create or modify user accounts.

#### Acceptance Criteria

1. WHEN a user with the Admin role navigates to the Admin_Panel, THE Admin_Panel SHALL render the User_List and user management controls.
2. WHEN a user without the Admin role attempts to access the Admin_Panel URL, THE Admin_Panel SHALL redirect the user to the dashboard page.
3. THE Admin_Panel SHALL verify the current user's role on both the client side and the server side before rendering user management content.

### Requirement 2: View User List

**User Story:** As an Admin, I want to view a list of all registered users with their roles, shed assignments, and section assignments, so that I can understand the current user landscape.

#### Acceptance Criteria

1. WHEN the Admin navigates to the Admin_Panel, THE User_List SHALL display all User_Records with the following columns: full name, email, role, assigned shed(s), assigned section(s), and account creation date.
2. WHEN the Admin types a search query, THE User_List SHALL filter User_Records by full name or email matching the query.
3. WHEN the Admin selects a role filter, THE User_List SHALL display only User_Records matching the selected User_Role.
4. WHEN the Admin selects a shed filter, THE User_List SHALL display only User_Records assigned to the selected Shed.
5. WHEN no User_Records match the applied filters, THE User_List SHALL display an empty state message indicating no users were found.

### Requirement 3: Create New User

**User Story:** As an Admin, I want to create new user accounts from the UI with email, name, role, shed assignment, and section assignment, so that I do not need to use direct SQL queries.

#### Acceptance Criteria

1. WHEN the Admin clicks the "Add User" button, THE Admin_Panel SHALL display a user creation form with fields for email, full name, role selection, shed selection, and section selection.
2. WHEN the Admin submits the user creation form with valid data, THE Admin_Panel SHALL create a new Supabase_Auth account using the Supabase Admin API, insert a corresponding User_Record in the `users` table, create the Shed_Assignment, and create the Section_Assignment(s).
3. WHEN the Admin submits the form with an email that already exists in Supabase_Auth, THE Admin_Panel SHALL display an error message indicating the email is already registered.
4. WHEN the Admin submits the form with an empty or invalid email format, THE Admin_Panel SHALL display a validation error for the email field.
5. WHEN the Admin submits the form with an empty full name, THE Admin_Panel SHALL display a validation error for the full name field.
6. THE Admin_Panel SHALL require the Admin to select at least one Shed when creating a User_Record.
7. WHEN the Admin selects a Shed, THE Admin_Panel SHALL display the available Sections for that Shed for optional assignment.
8. WHEN user creation succeeds, THE Admin_Panel SHALL display a success notification and add the new User_Record to the User_List.
9. WHEN user creation fails due to a server error, THE Admin_Panel SHALL display an error notification with a descriptive message.

### Requirement 4: Edit User Details

**User Story:** As an Admin, I want to edit existing user roles, shed assignments, and section assignments, so that I can adjust access as organizational needs change.

#### Acceptance Criteria

1. WHEN the Admin clicks the edit action on a User_Record, THE Admin_Panel SHALL display an edit form pre-populated with the user's current full name, role, shed assignment(s), and section assignment(s).
2. WHEN the Admin changes the User_Role and submits the form, THE Admin_Panel SHALL update the role field in the User_Record.
3. WHEN the Admin changes the Shed_Assignment and submits the form, THE Admin_Panel SHALL update the `user_shed_assignments` table to reflect the new assignment(s).
4. WHEN the Admin changes the Section_Assignment and submits the form, THE Admin_Panel SHALL update the `user_section_assignments` table to reflect the new assignment(s).
5. WHEN the Admin attempts to remove the Admin role from the last remaining Admin user, THE Admin_Panel SHALL prevent the change and display a warning that at least one Admin must exist.
6. WHEN the edit operation succeeds, THE Admin_Panel SHALL display a success notification and refresh the User_List with updated data.
7. THE Admin_Panel SHALL prevent editing of the email field after user creation, since the email is tied to the Supabase_Auth identity.

### Requirement 5: Deactivate and Reactivate Users

**User Story:** As an Admin, I want to deactivate user accounts that are no longer needed without permanently deleting them, so that historical audit data is preserved.

#### Acceptance Criteria

1. WHEN the Admin clicks the deactivate action on an active User_Record, THE Admin_Panel SHALL display a confirmation dialog before proceeding.
2. WHEN the Admin confirms deactivation, THE Admin_Panel SHALL set the `is_active` flag to false on the User_Record and disable the corresponding Supabase_Auth account.
3. WHILE a User_Record has `is_active` set to false, THE login system SHALL reject authentication attempts for that user's email.
4. WHEN the Admin clicks the reactivate action on a deactivated User_Record, THE Admin_Panel SHALL set the `is_active` flag to true and re-enable the Supabase_Auth account.
5. THE User_List SHALL visually distinguish deactivated User_Records from active ones using a visual indicator.

### Requirement 6: Section Assignment Management

**User Story:** As an Admin, I want to assign users to specific sections within a shed (Pneumatic, Bogey, Electrical, Traction Motor, Brake System, Body Shell), so that section-specific personnel can manage POH data for their area.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide a predefined list of Sections: Pneumatic, Bogey/Bogie, Electrical, Traction Motor, Brake System, Body Shell.
2. WHEN the Admin assigns a user to a Section, THE Admin_Panel SHALL create a Section_Assignment linking the User_Record to the selected Section within the selected Shed.
3. WHEN the Admin assigns a user to multiple Sections, THE Admin_Panel SHALL create a separate Section_Assignment for each selected Section.
4. THE Admin_Panel SHALL allow a single User_Record to be assigned to multiple Sections within the same Shed.
5. WHEN the Admin removes a Section_Assignment, THE Admin_Panel SHALL delete the corresponding record from the `user_section_assignments` table.
6. THE Admin_Panel SHALL display the current Section_Assignment(s) for each User_Record in the User_List.

### Requirement 7: Database Schema Extension for Sections and User Status

**User Story:** As a developer, I want the database schema to support section assignments and user active status, so that the Admin_Panel features have proper data storage.

#### Acceptance Criteria

1. THE database migration SHALL add an `is_active` column (BOOLEAN, default true) to the `users` table.
2. THE database migration SHALL create a `user_section_assignments` table with columns: id (UUID, primary key), user_id (UUID, foreign key to users), shed_id (UUID, foreign key to sheds), section_name (VARCHAR, constrained to the predefined Section list), and created_at (TIMESTAMPTZ).
3. THE `user_section_assignments` table SHALL enforce a unique constraint on the combination of user_id, shed_id, and section_name.
4. THE database migration SHALL add RLS policies on `user_section_assignments` allowing Admin users to perform all CRUD operations and allowing non-Admin users to read their own assignments.
5. THE database migration SHALL add an index on `user_section_assignments(user_id)` for query performance.

### Requirement 8: Audit Logging for User Management Actions

**User Story:** As an Admin, I want all user management actions to be recorded in the audit log, so that there is a traceable history of account changes.

#### Acceptance Criteria

1. WHEN a new User_Record is created, THE Admin_Panel SHALL insert an audit log entry with action "CREATE", entity_type "user", and the new user's details in new_values.
2. WHEN a User_Record is updated (role change, shed reassignment, section reassignment), THE Admin_Panel SHALL insert an audit log entry with action "UPDATE", the previous values in old_values, and the new values in new_values.
3. WHEN a User_Record is deactivated or reactivated, THE Admin_Panel SHALL insert an audit log entry with action "UPDATE" and the status change details.

### Requirement 9: Form Validation and Error Handling

**User Story:** As an Admin, I want clear validation feedback when creating or editing users, so that I can correct mistakes before submission.

#### Acceptance Criteria

1. WHEN the Admin enters an email that does not match a valid email format, THE creation form SHALL display an inline validation error below the email field.
2. WHEN the Admin leaves the full name field empty, THE creation form SHALL display an inline validation error below the full name field.
3. WHEN the Admin does not select a role, THE creation form SHALL display an inline validation error for the role field.
4. WHEN the Admin does not select at least one Shed, THE creation form SHALL display an inline validation error for the shed field.
5. IF a network error occurs during form submission, THEN THE Admin_Panel SHALL display an error notification and preserve the form data so the Admin can retry.
6. IF the Supabase Admin API returns a rate limit error, THEN THE Admin_Panel SHALL display a message asking the Admin to wait before retrying.
