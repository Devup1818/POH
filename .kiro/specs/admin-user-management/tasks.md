# Implementation Plan: Admin User Management

## Overview

Implement an Admin User Management panel at `/admin/users` that allows Admin users to create, view, edit, deactivate, and reactivate user accounts. The implementation adds a database migration for section assignments and user status, a Supabase admin client for privileged operations, server actions for all mutations, Zod validation schemas, and three client components (user list table, user form modal, deactivate dialog). All actions are audit-logged. The sidebar gains a new Admin-only nav item.

## Tasks

- [x] 1. Database migration for sections and user status
  - [x] 1.1 Create `supabase/migrations/005_user_sections_and_status.sql`
    - Add `is_active` BOOLEAN column (default true, NOT NULL) to the `users` table
    - Create `user_section_assignments` table with columns: `id` (UUID PK), `user_id` (UUID FK to users ON DELETE CASCADE), `shed_id` (UUID FK to sheds ON DELETE CASCADE), `section_name` (VARCHAR(50) with CHECK constraint for the 6 predefined sections), `created_at` (TIMESTAMPTZ DEFAULT NOW())
    - Add UNIQUE constraint on (user_id, shed_id, section_name)
    - Add indexes on `user_section_assignments(user_id)` and `user_section_assignments(shed_id)`
    - Enable RLS on `user_section_assignments`
    - Create RLS policy allowing Admin users (via `is_admin()`) full CRUD access
    - Create RLS policy allowing non-Admin users SELECT on their own rows (user_id = auth.uid())
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 2. Add types and constants
  - [x] 2.1 Add `SectionName` type and admin-related interfaces to `src/types/index.ts`
    - Add `SectionName` union type: 'Pneumatic' | 'Bogey/Bogie' | 'Electrical' | 'Traction Motor' | 'Brake System' | 'Body Shell'
    - Add `UserRecord` interface with id, email, full_name, role, is_active, created_at, shed_assignments, section_assignments
    - Add `CreateUserInput` interface with email, full_name, role, shed_ids, section_assignments
    - Add `UpdateUserInput` interface with user_id, full_name, role, shed_ids, section_assignments
    - _Requirements: 6.1, 2.1_

  - [x] 2.2 Add `SECTION_NAMES` constant to `src/lib/constants.ts`
    - Add `SECTION_NAMES` array with the 6 predefined section names matching the `SectionName` type
    - _Requirements: 6.1_

- [x] 3. Create Zod validation schemas and Supabase admin client
  - [x] 3.1 Create `src/lib/validations/user.ts`
    - `createUserSchema`: email (valid format), full_name (min 1, max 200), role (enum of 4 roles), shed_ids (array of UUIDs, min 1), section_assignments (array of {shed_id, section_name}, default [])
    - `updateUserSchema`: user_id (UUID), full_name, role, shed_ids, section_assignments (same rules as create)
    - _Requirements: 3.4, 3.5, 3.6, 9.1, 9.2, 9.3, 9.4_

  - [x] 3.2 Create `src/lib/supabase/admin.ts`
    - Export `createAdminClient()` that creates a Supabase client using `SUPABASE_SERVICE_ROLE_KEY` env var
    - This client is server-only and must never be imported on the client side
    - _Requirements: 3.2_

  - [ ]* 3.3 Write property test for invalid input rejection (Property 5)
    - **Property 5: Invalid input rejection**
    - Generate inputs violating the Zod schema (invalid email, empty name, missing role, empty shed list) and verify `createUserSchema.safeParse` returns failure
    - **Validates: Requirements 3.4, 3.5, 3.6, 9.1, 9.2, 9.3, 9.4**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement server actions
  - [x] 5.1 Create `src/lib/actions/admin-users.ts` with `fetchUsers` action
    - Verify caller is Admin by checking user role from session
    - Query `users` table joined with `user_shed_assignments` and `user_section_assignments`
    - Return `Result<UserRecord[]>` with all user records including shed and section assignments
    - _Requirements: 2.1_

  - [x] 5.2 Add `createUser` server action to `src/lib/actions/admin-users.ts`
    - Verify caller is Admin
    - Validate input with `createUserSchema`
    - Create Supabase Auth account via `auth.admin.createUser({ email, password: randomPassword })`
    - Insert row into `users` table with id from auth, email, full_name, role, is_active=true
    - Insert rows into `user_shed_assignments` for each shed_id
    - Insert rows into `user_section_assignments` for each section assignment
    - Insert audit log entry with action "CREATE", entity_type "user"
    - On failure after auth account creation, rollback by deleting the auth account
    - Return `Result<UserRecord>`
    - _Requirements: 3.2, 3.3, 3.8, 3.9, 6.2, 6.3, 8.1_

  - [x] 5.3 Add `updateUser` server action to `src/lib/actions/admin-users.ts`
    - Verify caller is Admin
    - Validate input with `updateUserSchema`
    - Check last-Admin protection: if changing role away from Admin, count remaining Admins and reject if this is the last one
    - Update `users` row (full_name, role)
    - Replace `user_shed_assignments`: delete existing, insert new
    - Replace `user_section_assignments`: delete existing, insert new
    - Insert audit log entry with action "UPDATE", old_values and new_values
    - Return `Result<UserRecord>`
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.7, 6.5, 8.2_

  - [x] 5.4 Add `deactivateUser` and `reactivateUser` server actions to `src/lib/actions/admin-users.ts`
    - Verify caller is Admin
    - `deactivateUser`: set `is_active = false` on users table, call `auth.admin.updateUserById(userId, { ban_duration: '876000h' })` to ban the auth account, insert audit log
    - `reactivateUser`: set `is_active = true` on users table, call `auth.admin.updateUserById(userId, { ban_duration: 'none' })` to unban, insert audit log
    - Return `Result<void>`
    - _Requirements: 5.2, 5.3, 5.4, 8.3_

  - [ ]* 5.5 Write property test for last Admin protection (Property 7)
    - **Property 7: Last Admin protection**
    - When exactly one Admin exists, attempting to change their role to non-Admin should fail
    - **Validates: Requirements 4.5**

  - [ ]* 5.6 Write property test for audit log completeness (Property 11)
    - **Property 11: Audit log completeness**
    - For any user management action (create, update, deactivate, reactivate), verify an audit log entry is created with correct action type, entity_type "user", and appropriate old/new values
    - **Validates: Requirements 8.1, 8.2, 8.3**

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Build the admin page and user list table
  - [x] 7.1 Create `src/app/(dashboard)/admin/users/page.tsx`
    - Server component that verifies the current user is Admin (redirect to `/` if not)
    - Fetch all users via `fetchUsers` server action
    - Fetch all sheds from the `sheds` table
    - Pass data to `UserListTable` client component
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 7.2 Create `src/components/admin/user-list-table.tsx`
    - Client component receiving `users`, `sheds`, and `onRefresh` props
    - Render a table with columns: full name, email, role, assigned shed(s), assigned section(s), created date
    - Search input that filters by full name or email (case-insensitive, client-side)
    - Role filter dropdown and shed filter dropdown
    - Empty state message when no users match filters
    - Visually distinguish deactivated users (e.g., muted text, "Inactive" badge)
    - Action buttons per row: Edit, Deactivate/Reactivate
    - "Add User" button that opens the UserFormModal in create mode
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.5_

  - [ ]* 7.3 Write property test for search filter correctness (Property 2)
    - **Property 2: Search filter correctness**
    - Generate random user lists and search queries, verify filtered results contain exactly the users whose name or email includes the query as a case-insensitive substring
    - **Validates: Requirements 2.2**

  - [ ]* 7.4 Write property test for attribute filter correctness (Property 3)
    - **Property 3: Attribute filter correctness**
    - Generate random user lists with role/shed filters, verify filtered results match all applied filters
    - **Validates: Requirements 2.3, 2.4**

- [x] 8. Build the user form modal
  - [x] 8.1 Create `src/components/admin/user-form-modal.tsx`
    - Client component with `open`, `onClose`, `onSuccess`, `user?`, and `sheds` props
    - Create mode (no `user` prop): all fields editable, calls `createUser` on submit
    - Edit mode (`user` prop provided): email field read-only, pre-populated with current values, calls `updateUser` on submit
    - Form fields: email, full name, role dropdown, shed multi-select, section checkboxes (shown per selected shed)
    - Inline Zod validation errors below each field
    - Loading state on submit button during server action call
    - On success: show success toast, call `onSuccess` to refresh list, close modal
    - On error: show error toast (duplicate email, rate limit, server error), preserve form data for retry
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 4.1, 4.7, 6.2, 6.3, 6.4, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 9. Build the deactivate/reactivate dialog
  - [x] 9.1 Create `src/components/admin/deactivate-dialog.tsx`
    - Client component with `open`, `onClose`, `onConfirm`, `user`, `action`, and `loading` props
    - Display confirmation message with user name and the action being taken
    - Confirm and Cancel buttons with loading state
    - On confirm: call the appropriate server action (deactivateUser or reactivateUser)
    - _Requirements: 5.1, 5.2, 5.4_

- [x] 10. Add sidebar navigation item
  - [x] 10.1 Add "User Management" nav item to `src/components/layout/sidebar.tsx`
    - Add a new entry to `NAV_ITEMS` with href `/admin/users`, label "User Management", appropriate icon (e.g., `Users` from lucide-react), and `roles: ['Admin']`
    - _Requirements: 1.1_

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Integration wiring and final verification
  - [x] 12.1 Wire all components together and verify data flow
    - Ensure UserListTable opens UserFormModal for create/edit and DeactivateDialog for deactivate/reactivate
    - Ensure form submissions call the correct server actions and refresh the user list on success
    - Ensure admin page redirects non-Admin users on both server and client side
    - Ensure audit log entries are created for all management actions
    - _Requirements: 1.2, 1.3, 3.8, 4.6, 5.2, 5.4, 8.1, 8.2, 8.3_

  - [ ]* 12.2 Write unit tests for admin page access control
    - Verify Admin user sees the page with all controls
    - Verify non-Admin user is redirected to dashboard
    - _Requirements: 1.1, 1.2_

  - [ ]* 12.3 Write unit tests for user form modal
    - Verify create mode shows all fields editable
    - Verify edit mode shows email as read-only and pre-populates values
    - Verify selecting a shed shows section checkboxes for that shed
    - Verify inline validation errors appear for invalid inputs
    - _Requirements: 3.1, 3.7, 4.1, 4.7, 9.1, 9.2, 9.3, 9.4_

  - [ ]* 12.4 Write unit tests for deactivate dialog
    - Verify confirmation dialog shows user name and action
    - Verify confirm button triggers the correct action
    - _Requirements: 5.1_

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The Supabase service_role key is server-only and must never be exposed to the client
- Audit log insert failures are non-blocking — they log errors server-side but do not fail the primary operation
