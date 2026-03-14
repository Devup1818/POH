# Implementation Plan: Railway POH Management System

## Overview

UI-first implementation approach: build visible UI with mock data first, then integrate Supabase backend. Each task produces something the user can see in the browser. The user starts from a fresh macOS system with no dev tools installed.

## References

- PRD: #[[file:POH_SYSTEM_PRD.md]]
- Requirements: #[[file:.kiro/specs/railway-poh-management-system/requirements.md]]
- Design: #[[file:.kiro/specs/railway-poh-management-system/design.md]]

## Tasks

- [x] 1. Environment Setup & Project Initialization
  - [x] 1.1 Install Node.js, npm, and create Next.js project
    - Install nvm (Node Version Manager) for macOS
    - Install Node.js LTS via nvm
    - Create a new Next.js 14+ project with TypeScript and Tailwind CSS using `npx create-next-app@latest`
    - Verify Node.js, npm, and Next.js are working
    - _Requirements: 18.1_

  - [x] 1.2 Install all project dependencies
    - Install Supabase client: `@supabase/supabase-js`, `@supabase/ssr`
    - Install Recharts: `recharts`
    - Install date-fns: `date-fns`
    - Install Zod: `zod`
    - Install additional UI utilities: `clsx`, `tailwind-merge`, `lucide-react` (icons)
    - Verify all dependencies install without errors
    - _Requirements: 18.1_

  - [x] 1.3 Configure project structure and TypeScript strict mode
    - Enable strict mode in `tsconfig.json`
    - Create the app directory structure: `app/(auth)`, `app/(dashboard)`, `lib/`, `components/`, `types/`
    - Create a `types/index.ts` file with all core TypeScript types from the design (POHStage, POHType, RakeType, RakeStatus, TimelineStatus, PartStatus, ChecklistStatus, TestStatus, TestType, NoteType, UserRole, Result)
    - Create a `lib/constants.ts` with POH stage order, target durations, part names, and delay thresholds
    - Verify the dev server starts with `npm run dev` and shows the default Next.js page
    - _Requirements: 18.1, 22.1, 22.3, 22.4_

- [x] 2. Checkpoint - Verify environment
  - Ensure `npm run dev` starts without errors and the default Next.js page loads at localhost:3000. Ask the user if questions arise.

- [x] 3. Design System & Layout Shell
  - [x] 3.1 Create shared UI components
    - Create `components/ui/button.tsx` - Button component with variants (primary, secondary, danger, ghost) and sizes (sm, md, lg)
    - Create `components/ui/badge.tsx` - StatusBadge component with color coding: green (On Schedule/Ahead), yellow (Minor Delay), red (Significant Delay)
    - Create `components/ui/card.tsx` - Card component with header, body, footer slots
    - Create `components/ui/warning-indicator.tsx` - WarningIndicator for missing parts, mandatory items, delays with count badge and tooltip
    - Create `components/ui/progress-bar.tsx` - ProgressBar component with percentage display
    - Create `components/ui/input.tsx`, `components/ui/select.tsx`, `components/ui/textarea.tsx` - Form input components
    - Create `components/ui/modal.tsx` - Modal/dialog component for confirmations
    - Create `components/ui/tooltip.tsx` - Tooltip component for hover information
    - Apply Tailwind CSS with consistent design tokens (colors, spacing, typography)
    - _Requirements: 12.1, 12.6, 12.8, 25.1, 25.2, 25.3_

  - [x] 3.2 Create application layout with sidebar and header
    - Create `app/(dashboard)/layout.tsx` with sidebar navigation and main content area
    - Sidebar links: Dashboard, Register Rake, Completed Rakes, Reports, Settings
    - Create `components/layout/sidebar.tsx` - Collapsible sidebar with navigation links and active state
    - Create `components/layout/header.tsx` - Top header bar with shed selector dropdown (mock sheds: "EMU Car Shed Ghaziabad", "EMU Car Shed Virar", "MEMU Shed Lucknow"), user avatar placeholder, and notification bell icon
    - Create `components/layout/shed-selector.tsx` - ShedSelector dropdown component with "All Sheds" option, defaults to first shed
    - Make layout responsive: sidebar collapses to hamburger menu on mobile/tablet
    - Create `app/(auth)/layout.tsx` - Minimal centered layout for login page
    - Verify the layout renders with sidebar and header at localhost:3000
    - _Requirements: 4.4, 4.5, 20A.5, 20A.8, 25.1, 25.2, 25.3, 25.4_

  - [x] 3.3 Create mock data utilities
    - Create `lib/mock-data.ts` with realistic mock data for:
      - 3 sheds (EMU Car Shed Ghaziabad, EMU Car Shed Virar, MEMU Shed Lucknow)
      - 5 active rakes across different sheds with varying coach counts (8, 12, 16, 10, 6)
      - Coaches at different POH stages with varied timeline statuses
      - Coach parts with mixed statuses including some Missing/Pending
      - Sample checklist items with RDSO SMI references
      - Sample notes
      - Sample test statuses
    - Create helper functions: `getMockRakes(shedId)`, `getMockCoaches(rakeId)`, `getMockParts(coachId)`, etc.
    - _Requirements: 4.1, 4.2, 5.1, 5.2, 6.1, 6.2_

- [x] 4. Dashboard Page (Static UI with Mock Data)
  - [x] 4.1 Build dashboard metrics cards
    - Create `app/(dashboard)/page.tsx` as the main dashboard page
    - Create `components/dashboard/metrics-cards.tsx` - Row of metric cards showing:
      - Total Active Rakes count
      - Total Coaches in POH count
      - Average Completion Time (days)
      - On-Time Completion %
      - Delayed Coaches count (red highlight)
      - Missing Parts count (warning highlight)
    - Use mock data to populate all metrics
    - Style with Tailwind: clean card layout, appropriate icons from lucide-react
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

  - [x] 4.2 Build rake cards list with filters
    - Create `components/dashboard/rake-card.tsx` - RakeCard component displaying: rake number, Rake_Type badge (EMU/MEMU), POH_Type badge, shed location badge, current stage, elapsed days since intake, estimated completion date, coach progress summary (mini bar showing coaches per stage), delayed coach count (red), missing parts count (warning icon)
    - Create `components/dashboard/rake-list.tsx` - List/grid of RakeCards
    - Create `components/dashboard/dashboard-filters.tsx` - Filter bar with dropdowns for: Shed (from shed selector), Rake_Type (EMU/MEMU), POH_Type (1st-4th), POH_Stage (8 stages), Timeline_Status (4 statuses). Add sort dropdown (intake date, estimated completion, elapsed time, delayed coaches). Add search input for rake/coach number
    - Wire filters to mock data filtering (client-side)
    - Make rake cards clickable, linking to `/rakes/[rakeId]`
    - _Requirements: 4.1, 4.2, 4.3, 4.6, 4.7, 4.8, 4.9, 4.10_

  - [ ]* 4.3 Write unit tests for dashboard components
    - Test metric card rendering with mock data
    - Test filter functionality
    - Test rake card displays correct status colors and warning indicators
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 5. Checkpoint - Verify dashboard UI
  - Ensure the dashboard page renders with mock data, metric cards, rake cards with status colors, and working filters. Ask the user if questions arise.

- [x] 6. Rake Registration Form (UI with Validation)
  - [x] 6.1 Build multi-step registration form
    - Create `app/(dashboard)/rakes/new/page.tsx` - Rake registration page
    - Create `components/rakes/registration-form.tsx` - Multi-step form component
    - Step 1: Rake Details - rake number input, Rake_Type radio (EMU/MEMU), POH_Type dropdown (1st-4th POH), Shed dropdown (defaults to user's shed), total coaches number input (6-20)
    - Step 2: Coach Numbers - Dynamic list of coach number inputs based on total_coaches, each validated as exactly 6 digits numeric only, duplicate detection within the rake
    - Step 3: Review & Submit - Summary of all entered data, edit buttons to go back to previous steps
    - Create step indicator component showing current step (1/2/3) with progress
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

  - [x] 6.2 Implement Zod validation schemas for registration
    - Create `lib/validations/rake.ts` with Zod schemas:
      - `rakeRegistrationSchema`: validates rake_number (non-empty string), rake_type (EMU|MEMU), poh_type (1st-4th POH), shed_id (UUID), total_coaches (6-20)
      - `coachNumberSchema`: validates exactly 6 digits, numeric only
      - `coachNumbersArraySchema`: validates array length matches total_coaches, all unique, all valid format
    - Display inline validation errors on each form field
    - Disable "Next" button until current step is valid
    - On Step 3 submit, show success toast and redirect to dashboard (no backend yet)
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 15.1, 15.2, 15.3, 15.4, 15.5_

  - [ ]* 6.3 Write property test for rake registration validation
    - **Property 1: Coach number format validation**
    - Verify that any string of exactly 6 numeric digits passes validation, and any other string fails
    - **Validates: Requirements 1.6, 15.4**

  - [ ]* 6.4 Write property test for coach uniqueness validation
    - **Property 2: Coach number uniqueness within rake**
    - Verify that arrays with duplicate coach numbers always fail validation, and arrays with all unique valid numbers pass
    - **Validates: Requirements 1.7, 15.5**

- [x] 7. Rake Detail View (Static UI with Mock Data)
  - [x] 7.1 Build rake detail page with coach grid
    - Create `app/(dashboard)/rakes/[rakeId]/page.tsx` - Rake detail page
    - Create `components/rakes/rake-header.tsx` - Header showing: rake number, Rake_Type, POH_Type, shed location, intake date (DD/MM/YYYY format), elapsed days, current stage, estimated completion date, overall progress bar
    - Create `components/rakes/stage-progress-chart.tsx` - Horizontal bar chart showing count of coaches at each of the 8 stages, with stage names and counts
    - Create `components/rakes/coach-grid.tsx` - Responsive grid of coach cards (4-5 cols desktop, 2-3 tablet, 1-2 mobile). Each coach card shows: coach number, current stage badge, timeline status color (green/yellow/red border), missing parts warning icon with count, checklist completion % badge. Hover tooltip with detailed info
    - Create `components/rakes/aggregate-stats.tsx` - Aggregate statistics panel: average completion %, total missing parts, average delay, coaches blocking progression
    - Use mock data, make coach cards clickable linking to `/rakes/[rakeId]/coaches/[coachId]`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 12.1, 12.2, 12.3, 12.6, 12.7, 25.4_

  - [x] 7.2 Add bulk operation UI controls
    - Add checkbox selection to each coach card in the grid
    - Create `components/rakes/bulk-actions-bar.tsx` - Floating action bar that appears when coaches are selected, showing: selected count, "Mark Stage Complete" button, "Update Part Status" button, "Add Note" button, "Select All in Stage" button, "Select All Delayed" button, "Clear Selection" button
    - Create `components/rakes/bulk-confirmation-modal.tsx` - Confirmation dialog showing affected coaches and action details
    - Wire up selection state (client-side only, no backend yet)
    - _Requirements: 13.1, 13.2, 13.4, 13.7, 13.8_

  - [ ]* 7.3 Write unit tests for coach grid and bulk selection
    - Test coach grid renders correct number of cards
    - Test selection/deselection of coaches
    - Test "Select All in Stage" functionality
    - _Requirements: 5.2, 13.1, 13.7_

- [x] 8. Coach Detail View (Static UI with Mock Data)
  - [x] 8.1 Build coach detail page with tabbed interface
    - Create `app/(dashboard)/rakes/[rakeId]/coaches/[coachId]/page.tsx` - Coach detail page
    - Create `components/coaches/coach-header.tsx` - Header showing: coach number, parent rake info (rake number, link back), POH_Type, current stage badge, elapsed time, timeline status color, navigation arrows to prev/next coach in rake
    - Create `components/coaches/coach-tabs.tsx` - Tab navigation component with 5 tabs: Overview, Parts, Checklist, Testing, Notes
    - Create `components/coaches/comparison-badge.tsx` - Badge showing comparison against rake average progress (ahead/behind)
    - _Requirements: 6.1, 6.8, 6.11, 6.12_

  - [x] 8.2 Build Overview tab with stage timeline
    - Create `components/coaches/stage-timeline.tsx` - Visual timeline showing all 8 POH stages as a horizontal/vertical progression:
      - Each stage shows: stage name, status (completed/in-progress/not-started), start date, completion date, target duration, actual duration, timeline status color
      - Completed stages: solid green/yellow/red based on timeline status
      - Current stage: pulsing/highlighted with elapsed time counter
      - Future stages: greyed out with target duration shown
    - Create `components/coaches/progress-summary.tsx` - Summary cards: overall progress %, parts completion %, checklist completion %, current stage elapsed vs target
    - Use mock data for a coach with some completed stages and one in-progress
    - _Requirements: 6.2, 8.1, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.12, 8.13_

  - [x] 8.3 Build Parts tab
    - Create `components/coaches/parts-tracker.tsx` - Grid of 9 part cards, each showing: part name, current status badge (color-coded by lifecycle stage), status dropdown to update, last updated timestamp
    - When status is "Missing/Pending": show warning icon, display notes field (required), display expected arrival date picker (required)
    - Show parts completion percentage at top of tab
    - Use mock data with varied part statuses including some Missing/Pending
    - _Requirements: 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 8.4 Build Checklist tab
    - Create `components/coaches/checklist-manager.tsx` - Categorized checklist display:
      - Group items by category
      - Each item shows: item code, description, RDSO SMI clause reference, mandatory flag (highlighted), status (Not Started/In Progress/Completed), completion timestamp
      - Mandatory items visually distinguished (bold, icon, or colored border)
      - Checklist completion percentage bar at top
      - Filter by category, status, mandatory only
    - Use mock checklist items with RDSO references
    - _Requirements: 6.5, 6.6, 9.1, 9.2, 9.4, 9.5, 9.7, 9.8, 9.9, 9.11_

  - [x] 8.5 Build Testing tab
    - Create `components/coaches/testing-panel.tsx` - Three test type cards (Electrical, Mechanical, Pneumatic):
      - Each card shows: test type name, status badge, start timestamp, completion timestamp, completed by user, notes field
      - Status dropdown to update (Not Started → In Progress → Completed)
      - Visual indicator when all 3 tests complete (green checkmark)
      - Testing phase completion percentage (0%, 33%, 67%, 100%)
    - Show this tab only when coach is in Testing stage (or show disabled state for other stages)
    - Use mock data with varied test statuses
    - _Requirements: 6.7, 10.1, 10.2, 10.3, 10.5, 10.6, 10.7_

  - [x] 8.6 Build Notes tab
    - Create `components/coaches/notes-panel.tsx` - Chronological notes list:
      - Each note shows: content, timestamp (DD/MM/YYYY HH:MM IST), author name, note type badge (General/Stage-Specific/Part-Specific), important flag (star icon)
      - Add note form at top: text area, note type dropdown, important toggle, submit button
      - Filter by note type
      - Edit/delete buttons on own notes
      - Note count shown on tab label
    - Use mock notes data
    - _Requirements: 6.8, 6.10, 11.1, 11.2, 11.3, 11.4, 11.5, 11.7, 11.8, 11.9_

  - [ ]* 8.7 Write unit tests for coach detail tabs
    - Test stage timeline renders correct stage statuses and colors
    - Test parts tracker shows warning for Missing/Pending parts
    - Test checklist highlights mandatory items
    - Test testing panel shows correct completion percentage
    - _Requirements: 6.2, 6.3, 6.5, 6.7_

- [x] 9. Checkpoint - Verify all static UI pages
  - Ensure all pages render correctly with mock data: dashboard with metrics and rake cards, rake detail with coach grid and bulk selection UI, coach detail with all 5 tabs (Overview, Parts, Checklist, Testing, Notes). Verify navigation between pages works. Ask the user if questions arise.

- [x] 10. Supabase Database Setup
  - [x] 10.1 Set up Supabase project and create database schema
    - Guide user to create a Supabase project at supabase.com
    - Create `lib/supabase/client.ts` - Supabase browser client initialization
    - Create `lib/supabase/server.ts` - Supabase server client for Server Components and Server Actions
    - Create `lib/supabase/middleware.ts` - Supabase middleware client for auth session refresh
    - Add Supabase URL and anon key to `.env.local`
    - Create SQL migration file `supabase/migrations/001_initial_schema.sql` with all tables from design: sheds, users, user_shed_assignments, rakes, coaches, coach_stage_history, coach_parts, checklist_templates, coach_checklist_items, coach_tests, notes, audit_logs
    - Include all indexes, constraints, CHECK constraints, and UNIQUE constraints from design
    - _Requirements: 19.2, 20.10_

  - [x] 10.2 Create database functions, triggers, and views
    - Add to migration: `update_updated_at_column()` trigger function applied to all tables with updated_at
    - Add `calculate_timeline_status()` function
    - Add `get_rake_current_stage()` function
    - Add `initialize_coach_parts()` trigger on coaches INSERT
    - Add `initialize_coach_checklist()` trigger on coaches INSERT
    - Add `initialize_coach_tests()` trigger on coaches UPDATE (when entering Testing stage)
    - Add `create_audit_log()` trigger on key tables
    - Add `v_active_rakes_summary` view
    - _Requirements: 2.1, 7.1, 8.1, 9.3, 10.1, 20.8_

  - [x] 10.3 Create Row Level Security policies
    - Enable RLS on all tables
    - Create policies for sheds: Admin can CRUD all, assigned users can SELECT their sheds
    - Create policies for rakes: users can SELECT/INSERT/UPDATE rakes at their assigned sheds, Admin full access
    - Create policies for coaches: inherit access from parent rake's shed
    - Create policies for coach_parts, coach_stage_history, coach_checklist_items, coach_tests, notes: inherit from coach → rake → shed
    - Create policies for users and user_shed_assignments: Admin only for mutations, users can read own profile
    - Create policies for audit_logs: Admin can read all, users can read their shed's logs
    - _Requirements: 20.2, 20.4, 20.5, 20.7, 20A.7_

  - [x] 10.4 Seed initial data
    - Create `supabase/seed.sql` with:
      - Default shed: "EMU Car Shed, Ghaziabad, Northern Railway" with code "GZB-EMU"
      - Additional sheds: "EMU Car Shed, Virar, Western Railway" (VR-EMU), "MEMU Shed, Lucknow, Northern Railway" (LKO-MEMU)
      - Checklist templates for all 4 POH types with RDSO SMI references (RDSO/PE/EMU/0038-2021 Rev.2)
      - Standard target duration configuration in shed config JSON
    - Run migration and seed against Supabase project
    - Verify tables, functions, triggers, and seed data in Supabase dashboard
    - _Requirements: 3A.1, 3A.8, 9.1, 9.2, 22.1, 22.3, 22.5_

- [x] 11. Authentication & Authorization
  - [x] 11.1 Implement Supabase Auth login page
    - Create `app/(auth)/login/page.tsx` - Login page with email/password form
    - Style with Tailwind: centered card, Railway POH System branding, form inputs, submit button, error messages
    - Create `lib/supabase/auth.ts` - Auth helper functions: signIn, signOut, getSession, getUser
    - Implement login with Supabase Auth `signInWithPassword`
    - On successful login, redirect to dashboard
    - Display user-friendly error messages for invalid credentials
    - _Requirements: 20.1_

  - [x] 11.2 Implement auth middleware and session management
    - Create `middleware.ts` at project root - Next.js middleware that:
      - Refreshes Supabase auth session on every request
      - Redirects unauthenticated users to /login
      - Redirects authenticated users from /login to dashboard
      - Checks user role and shed assignments from user metadata
    - Implement 30-minute session timeout
    - Create `components/layout/user-menu.tsx` - User dropdown in header showing: user name, role, assigned shed(s), sign out button
    - Replace mock shed selector with real user shed assignments
    - _Requirements: 20.1, 20.3, 20.9, 20A.4, 20A.5, 20A.6, 20A.8_

  - [x] 11.3 Implement role-based access control
    - Create `lib/auth/permissions.ts` - Permission checking utilities:
      - `canCreateRake(role)` - Admin, Section_Engineer
      - `canUpdateCoach(role)` - Admin, Section_Engineer
      - `canAddNotes(role)` - Admin, Section_Engineer, Technician
      - `canViewOnly(role)` - Viewer
      - `canManageUsers(role)` - Admin only
      - `canManageSheds(role)` - Admin only
      - `canAccessShed(userId, shedId)` - Check shed assignment
    - Create `components/auth/role-guard.tsx` - Component that conditionally renders children based on user role
    - Apply role guards to: registration form (Section_Engineer+), settings pages (Admin only), edit controls (based on role)
    - Create a test user in Supabase Auth with Section_Engineer role and GZB-EMU shed assignment
    - _Requirements: 20.2, 20.4, 20.5, 20.6, 20.7, 20A.7, 20A.9, 20A.10_

- [ ] 12. Checkpoint - Verify auth and database
  - Ensure login page works, user can sign in, middleware redirects correctly, shed selector shows user's assigned sheds, and RLS policies restrict data access. Ask the user if questions arise.

- [x] 13. Connect Dashboard to Database
  - [x] 13.1 Replace mock data with Supabase queries on dashboard
    - Create `lib/queries/dashboard.ts` - Server-side query functions:
      - `getDashboardMetrics(shedId)` - Fetch active rake count, coaches by stage, avg completion time, on-time %, delayed count, missing parts count
      - `getActiveRakes(shedId, filters, sort, search)` - Fetch active rakes with aggregated coach data, supports filtering by Rake_Type, POH_Type, stage, timeline status, and sorting
    - Update `app/(dashboard)/page.tsx` to use Server Components with real Supabase queries
    - Pass shed filter from shed selector (URL search params or context)
    - Implement search by rake number or coach number
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.9_

  - [x] 13.2 Add real-time subscriptions to dashboard
    - Create `lib/supabase/realtime.ts` - Real-time subscription helpers
    - Subscribe to rakes table changes (INSERT, UPDATE) filtered by shed
    - Subscribe to coaches table changes for stage updates
    - When a rake or coach changes, refresh dashboard metrics and rake list
    - Show a subtle "Updated" indicator when data refreshes
    - _Requirements: 16.8_

  - [ ]* 13.3 Write unit tests for dashboard queries
    - Test that dashboard metrics query returns correct structure
    - Test that rake list filtering works for each filter type
    - Test that search by rake number and coach number returns correct results
    - _Requirements: 4.1, 4.3, 4.7_

- [x] 14. Rake Registration Backend
  - [x] 14.1 Connect registration form to Supabase
    - Create `lib/actions/rake.ts` - Server Action `createRake(formData)`:
      - Validate all inputs with Zod schemas
      - Check for duplicate active rake at same shed
      - Insert rake record with intake_date = NOW() in IST, status = "Active"
      - Insert all coach records (triggers auto-create parts, checklist items, stage history)
      - Set all coaches to "Intake" stage
      - Return success with new rake ID, or validation errors
    - Update registration form to call server action on submit
    - Show loading state during submission
    - On success: show success toast, redirect to new rake's detail page
    - On error: show inline validation errors
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12, 1.13, 1.14, 1.15, 15.1, 15.2, 15.3, 15.4, 15.5, 15.13_

  - [ ]* 14.2 Write property test for duplicate rake prevention
    - **Property 3: No duplicate active rakes at same shed**
    - Verify that attempting to create a rake with the same rake_number at the same shed while one is Active always fails
    - **Validates: Requirements 1.15, 15.13**

- [-] 15. Coach Stage Tracking
  - [x] 15.1 Implement stage progression logic
    - Create `lib/actions/coach.ts` - Server Actions:
      - `advanceCoachStage(coachId)`: Validate current stage is complete, validate mandatory checklist items done, validate all tests complete if leaving Testing stage, record completion timestamp on current stage history, create new stage history entry, update coach current_stage, calculate actual_duration and timeline_status
      - `getCoachDetail(coachId)`: Fetch complete coach data with parts, checklist, tests, notes, stage history
    - Create `lib/queries/coach.ts` - Query functions for coach detail page
    - Update rake detail page to use real data from Supabase
    - Update coach detail page Overview tab to use real stage history data
    - Wire "Advance Stage" button on coach detail to server action with confirmation dialog
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 3.1, 3.2, 3.3, 3.4, 3.5, 15.6, 15.7, 15.8_

  - [ ]* 15.2 Write property test for sequential stage enforcement
    - **Property 4: Stages must progress sequentially**
    - Verify that for any coach, advancing from stage N always results in stage N+1 (never skipping), and attempting to skip stages always fails
    - **Validates: Requirements 2.2, 15.6**

  - [ ]* 15.3 Write property test for stage completion validation
    - **Property 5: Cannot advance without completing current stage**
    - Verify that advancing a coach with incomplete mandatory checklist items always fails, and advancing with all mandatory items complete succeeds
    - **Validates: Requirements 2.7, 15.8**

- [x] 16. Parts Management
  - [x] 16.1 Connect parts tracking to database
    - Create `lib/actions/parts.ts` - Server Actions:
      - `updatePartStatus(partId, status, notes?, expectedArrivalDate?)`: Validate status transition, require notes and expected date when marking Missing/Pending, validate expected date is in future, record timestamp, update part record
      - `getMissingPartsReport(shedId, filters?)`: Query all Missing/Pending parts across coaches with coach numbers, rake info, notes, expected arrival dates
    - Update coach detail Parts tab to use real data and server actions
    - Create `app/(dashboard)/reports/missing-parts/page.tsx` - Missing parts report page with filters by part type and sort by expected arrival date
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 15.11, 15.12_

  - [ ]* 16.2 Write property test for missing part validation
    - **Property 6: Missing parts require notes and expected date**
    - Verify that marking a part as Missing/Pending without notes or without a future expected arrival date always fails
    - **Validates: Requirements 7.3, 7.4, 15.11, 15.12**

- [x] 17. Checklist Management
  - [x] 17.1 Connect checklists to database
    - Create `lib/actions/checklist.ts` - Server Actions:
      - `updateChecklistItem(itemId, coachId, status, notes?)`: Update checklist item status, record completion timestamp and user when Completed, validate status transition
      - `getChecklistForCoach(coachId)`: Fetch all checklist items with template details (description, category, RDSO reference, mandatory flag)
      - `getChecklistComplianceReport(shedId, filters?)`: Aggregate checklist completion stats
    - Update coach detail Checklist tab to use real data and server actions
    - Implement category grouping, mandatory item highlighting, RDSO SMI reference display
    - Add notes capability per checklist item
    - Allow viewing checklists for any POH_Type in reference mode (read-only)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 9.11, 9.12_

- [x] 18. Testing Phase Management
  - [x] 18.1 Connect testing panel to database
    - Create `lib/actions/testing.ts` - Server Actions:
      - `updateTestStatus(coachId, testType, status, notes?)`: Update test status, record start/completion timestamps, record completed_by user, validate status transition
      - `getTestsForCoach(coachId)`: Fetch all 3 test records for a coach
    - Update coach detail Testing tab to use real data and server actions
    - Implement validation: cannot advance from Testing stage until all 3 tests are Completed
    - Show testing breakdown in rake overview (count of coaches with all tests complete)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 15.7_

  - [ ]* 18.2 Write property test for testing phase completion gate
    - **Property 7: Cannot leave Testing stage without all tests complete**
    - Verify that advancing a coach from Testing stage with any test not Completed always fails, and advancing with all 3 tests Completed succeeds
    - **Validates: Requirements 10.4, 15.7**

- [x] 19. Notes & Comments
  - [x] 19.1 Connect notes system to database
    - Create `lib/actions/notes.ts` - Server Actions:
      - `addNote(coachId, content, noteType, isImportant?, relatedStage?, relatedPartId?)`: Create note with timestamp, user, type, validate content not empty
      - `updateNote(noteId, content, isImportant?)`: Update own note only
      - `deleteNote(noteId)`: Delete own note only
      - `getNotesForCoach(coachId, filters?)`: Fetch notes with author info, support filtering by type
      - `searchNotesInRake(rakeId, searchTerm)`: Search across all notes in a rake
    - Update coach detail Notes tab to use real data and server actions
    - Implement edit/delete for own notes, important flag toggle
    - Add note count indicator on coach cards in rake detail view
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9_

- [x] 20. Checkpoint - Verify core functionality
  - Ensure all CRUD operations work: rake registration creates real records, stage advancement works with validation, parts/checklist/testing updates persist, notes can be added/edited/deleted. Ask the user if questions arise.

- [x] 21. Bulk Operations
  - [x] 21.1 Implement bulk update server actions
    - Create `lib/actions/bulk.ts` - Server Actions:
      - `bulkAdvanceStage(coachIds[])`: Validate all coaches can advance, advance each with individual timestamps, return success/failure per coach
      - `bulkUpdatePartStatus(coachIds[], partName, status, notes?)`: Update specified part for all selected coaches
      - `bulkAddNote(coachIds[], content, noteType)`: Add same note to all selected coaches with individual timestamps
      - `bulkUpdateChecklistItem(coachIds[], templateId, status)`: Update checklist item for all selected coaches
    - Wire bulk action bar buttons to server actions
    - Show confirmation modal before executing
    - Display results summary: successful updates count, failed updates with reasons
    - Implement undo capability for bulk operations (store previous state, allow reversal within session)
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9_

  - [ ]* 21.2 Write property test for bulk operation validation
    - **Property 8: Bulk operations validate each coach independently**
    - Verify that a bulk stage advance with a mix of valid and invalid coaches correctly advances valid ones and reports failures for invalid ones
    - **Validates: Requirements 13.3, 13.6**

- [x] 22. Timeline & Delay Tracking
  - [x] 22.1 Implement timeline calculations and delay detection
    - Create `lib/utils/timeline.ts` - Timeline utility functions:
      - `calculateTimelineStatus(actualDays, targetDays, thresholds)`: Returns TimelineStatus
      - `calculateEstimatedCompletion(coach, stageHistory, targetDurations)`: Returns estimated completion date based on current stage, elapsed time, remaining stages
      - `calculateElapsedTime(startDate)`: Returns elapsed days/hours
      - `calculateRakeEstimatedCompletion(coaches[])`: Returns latest estimated completion among all coaches
      - `getDelayDuration(actualDays, targetDays)`: Returns delay in days
      - `getPercentageConsumed(elapsedDays, targetDays)`: Returns % of target consumed
    - Update all views to use real timeline calculations instead of mock values
    - Apply color coding throughout: green (On Schedule/Ahead), yellow (Minor Delay), red (Significant Delay)
    - Display delay duration on delayed coach cards
    - Add Timeline_Status filter to coach lists
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11, 8.12, 8.13, 12.1_

  - [ ]* 22.2 Write property test for timeline status classification
    - **Property 9: Timeline status classification is consistent**
    - Verify that for any actual_duration and target_duration: actual <= target → On Schedule or Ahead, target < actual <= target+2 → Minor Delay, actual > target+2 → Significant Delay
    - **Validates: Requirements 8.5, 8.6, 8.7, 8.8**

- [x] 23. Notifications System
  - [x] 23.1 Implement in-app notifications
    - Create `notifications` table in Supabase (if not already in schema): id, user_id, type, title, message, is_read, related_entity_type, related_entity_id, shed_id, created_at
    - Create `lib/actions/notifications.ts` - Server Actions:
      - `getNotifications(userId)`: Fetch unread and recent notifications
      - `markAsRead(notificationId)`: Mark notification as read
      - `markAllAsRead(userId)`: Mark all as read
    - Create `components/layout/notification-bell.tsx` - Bell icon in header with unread count badge, dropdown showing recent notifications, click to navigate to related entity
    - Create database triggers or server-side logic to generate notifications:
      - When all coaches complete a stage → notify Section_Engineer
      - When a coach becomes Significantly Delayed → notify Section_Engineer
      - When a Missing_Part expected arrival date passes → notify Section_Engineer
      - When all 3 tests complete for a coach → notify Section_Engineer
    - Subscribe to notifications table via Supabase real-time for instant updates
    - Allow user to configure notification preferences
    - _Requirements: 3.6, 24.1, 24.2, 24.3, 24.4, 24.5, 24.6, 24.7_

- [x] 24. Reports & Analytics
  - [x] 24.1 Build reports page with performance charts
    - Create `app/(dashboard)/reports/page.tsx` - Reports hub page
    - Create `components/reports/performance-chart.tsx` - Recharts wrapper with consistent styling
    - Implement POH Type Performance Report: bar chart of avg completion time per POH type, on-time %, avg delay, most common delay causes
    - Implement Stage Performance Report: bar chart of avg duration per stage, % on-time per stage, trend line over time
    - Implement Parts Management Report: table of most frequently missing parts, avg delay caused, procurement times
    - Implement Timeline Performance Report: pie chart of timeline status distribution, delay trends line chart, longest delayed coaches table
    - Implement Checklist Compliance Report: completion % per POH type, mandatory items compliance rate
    - Add filters: date range, Rake_Type, POH_Type, shed location
    - Create `lib/queries/reports.ts` - Query functions for each report type
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 16.10_

  - [x] 24.2 Implement report export functionality
    - Create `lib/utils/export.ts` - Export utility functions:
      - `exportToPDF(data, reportType)`: Generate formatted PDF with charts and tables
      - `exportToExcel(data, reportType)`: Generate Excel file with raw data sheets
      - `exportToCSV(data, reportType)`: Generate CSV file
    - Install export dependencies: `jspdf`, `jspdf-autotable` for PDF, `xlsx` for Excel
    - Add export buttons (PDF, Excel, CSV) to each report
    - Allow selecting which data fields to include in exports
    - Implement rake record export from rake detail page
    - Ensure export completes within 10 seconds
    - _Requirements: 17.6, 17.7, 23.1, 23.2, 23.3, 23.4, 23.5, 23.6_

- [x] 25. Rake Completion & History
  - [x] 25.1 Implement rake completion and historical records
    - Create `lib/actions/rake-completion.ts` - Server Actions:
      - `completeRake(rakeId)`: Validate all coaches at Release stage, record completion timestamp, calculate total POH duration, change status to Completed
      - `getCompletedRakes(shedId, filters?)`: Fetch completed rakes with filters (date range, Rake_Type, POH_Type, shed)
    - Create `app/(dashboard)/completed/page.tsx` - Completed rakes page:
      - List of completed rakes with: rake number, type, POH type, shed, intake date, completion date, total duration, coach count
      - Filters: completion date range, Rake_Type, POH_Type, shed location
      - Search by rake number or coach number
      - Click to view full historical detail (read-only rake detail view)
    - Add "Complete Rake" button on rake detail page (visible only when all coaches at Release)
    - Implement comparison view: completed rake actual vs target timelines
    - Add export buttons for completed rake records (PDF, Excel)
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9, 14.10_

  - [ ]* 25.2 Write property test for rake completion validation
    - **Property 10: Rake can only complete when all coaches at Release**
    - Verify that completing a rake with any coach not at Release stage always fails, and completing with all coaches at Release succeeds
    - **Validates: Requirements 14.1**

- [x] 26. Checkpoint - Verify advanced features
  - Ensure notifications appear for delays and completions, reports render with charts and export works, completed rakes are listed separately with historical data. Ask the user if questions arise.

- [x] 27. Settings & Admin Pages
  - [x] 27.1 Build shed management page
    - Create `app/(dashboard)/settings/sheds/page.tsx` - Admin-only shed management:
      - List all sheds with: shed code, name, railway zone, active status, rake count
      - Add new shed form: shed code (unique), name, railway zone
      - Edit shed: update name, railway zone
      - Deactivate shed: toggle active status (preserves historical data, prevents new registrations)
      - Configure shed-specific settings: custom target durations per stage, delay thresholds, notification preferences
    - Wrap page with Admin role guard
    - _Requirements: 3A.1, 3A.2, 3A.3, 3A.4, 3A.5, 3A.6, 3A.7, 3A.9, 3A.10, 22.2, 22.6, 22.7, 22.8, 22.9_

  - [x] 27.2 Build user management page
    - Create `app/(dashboard)/settings/users/page.tsx` - Admin-only user management:
      - List all users with: name, email, role, assigned sheds, primary shed
      - Invite new user: email, full name, role selection
      - Edit user: update role, shed assignments
      - Assign/reassign users to sheds with primary shed designation
      - Deactivate user accounts
    - Create `lib/actions/users.ts` - Server Actions for user CRUD and shed assignment
    - _Requirements: 20.2, 20.3, 20.6, 20A.1, 20A.2, 20A.3_

  - [x] 27.3 Build configuration page
    - Create `app/(dashboard)/settings/config/page.tsx` - Admin-only configuration:
      - View/edit standard target durations for each POH stage
      - View/edit delay threshold values (minor: 1-2 days, significant: >2 days)
      - View/edit notification preferences
      - Display note: changes apply to new rakes only
    - _Requirements: 22.1, 22.4, 22.6, 22.7, 12.9_

- [x] 28. Timestamp & Localization Polish
  - [x] 28.1 Ensure IST timestamps and Indian date formats throughout
    - Create `lib/utils/date.ts` - Date formatting utilities using date-fns:
      - `formatDateIST(date)`: Returns DD/MM/YYYY in IST
      - `formatTimeIST(date)`: Returns HH:MM in 24-hour format in IST
      - `formatDateTimeIST(date)`: Returns DD/MM/YYYY HH:MM IST
      - `getElapsedDays(startDate)`: Returns elapsed days from IST start
      - `toIST(date)`: Convert any date to IST (UTC+5:30)
    - Audit all pages and components to ensure:
      - All dates display in DD/MM/YYYY format
      - All times display in 24-hour HH:MM format
      - All timestamps are in IST
      - Indian Railways terminology used throughout (Rake, Coach, POH, Shed, Section Engineer)
    - _Requirements: 21.1, 21.2, 21.3, 21.4_

- [x] 29. Auto-Save & Error Handling
  - [x] 29.1 Implement auto-save and error recovery
    - Implement auto-save for form inputs every 30 seconds using localStorage
    - Apply to: rake registration form, note editing, checklist updates
    - On page reload, restore unsaved form data with "Restore draft?" prompt
    - Create `components/ui/error-boundary.tsx` - Error boundary component with user-friendly error messages
    - Create `components/ui/toast.tsx` - Toast notification component for success/error/warning messages
    - Implement optimistic UI updates for common actions (stage advance, part update, checklist toggle)
    - Handle network interruption gracefully: show offline indicator, queue actions, retry on reconnect
    - _Requirements: 19.3, 19.4, 19.5_

- [x] 30. Responsive Design Polish
  - [x] 30.1 Ensure responsive design across all pages
    - Audit and fix all pages for desktop (1920x1080), tablet (768x1024), and mobile (375x667)
    - Sidebar: full on desktop, collapsible on tablet, hamburger menu on mobile
    - Coach grid: 4-5 cols desktop, 2-3 cols tablet, 1 col mobile
    - Dashboard rake cards: grid on desktop, stack on mobile
    - Forms: full-width on mobile, constrained on desktop
    - Tables: horizontal scroll on mobile
    - Touch-friendly controls: larger tap targets on tablet/mobile (min 44px)
    - Test all interactive elements (dropdowns, modals, tooltips) on mobile viewport
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5, 25.6_

- [x] 31. Final Checkpoint - Full system verification
  - Ensure all features work end-to-end: registration → stage tracking → parts/checklist/testing → completion → reports. Verify responsive design on different viewports. Verify auth and role-based access. Ensure all timestamps are in IST with DD/MM/YYYY format. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- The UI-first approach means you can see visual progress after every task group
- Mock data is used for tasks 3-8 so the UI is visible before database setup
- Tasks 10+ progressively replace mock data with real Supabase backend
