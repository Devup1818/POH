# Requirements Document

## Introduction

The Railway POH Management System is a comprehensive tracking and scheduling platform for managing Periodic Overhaul (POH) operations of EMU (Electric Multiple Unit) and MEMU (Mainline Electric Multiple Unit) railway rakes across multiple maintenance sheds throughout the Indian Railways network. The system enables real-time monitoring of maintenance operations at the individual coach level, tracking 6 to 20 coaches per rake through eight sequential stages from intake to release, with complete parts management, RDSO SMI-compliant checklist tracking, and timeline monitoring capabilities. The system supports multi-shed operations with shed-specific user assignments, data filtering, and reporting capabilities while maintaining centralized visibility across all locations.

## Glossary

- **POH_System**: The Railway POH Management System software application
- **Shed**: An EMU/MEMU maintenance facility location within the Indian Railways network (e.g., EMU Car Shed Ghaziabad, EMU Car Shed Virar, MEMU Shed Lucknow)
- **Shed_Code**: A unique identifier for each maintenance shed
- **Shed_User**: A user assigned to a specific shed location
- **Rake**: A complete train set consisting of 6 to 20 coaches
- **Coach**: An individual railway carriage identified by a unique 6-digit numeric identifier
- **POH_Stage**: One of eight sequential maintenance phases (Intake, Dismantling, Inspection, Reassembly, Finishing, Testing, Trial, Release)
- **POH_Type**: Classification of overhaul depth (1st POH, 2nd POH, 3rd POH, 4th POH)
- **Rake_Type**: Classification of train unit (EMU or MEMU)
- **Coach_Part**: One of nine major components tracked per coach (Motor Bogie, Trailer Bogie, Traction Motor, Brake System, Electrical System, Pantograph, Couplers, Suspension System, Body Shell)
- **Checklist_Item**: A specific maintenance task with RDSO SMI clause reference
- **Section_Engineer**: Railway maintenance supervisor user role with full system access
- **Testing_Phase**: Stage 6 of POH consisting of three independent test types (Electrical, Mechanical, Pneumatic)
- **Timeline_Status**: Classification of schedule adherence (On Schedule, Minor Delay, Significant Delay, Ahead of Schedule)
- **RDSO_SMI**: Research Designs & Standards Organisation Standard Maintenance Instructions (RDSO/PE/EMU/0038-2021 Rev.2)
- **IST**: Indian Standard Time (UTC+5:30)
- **Active_Rake**: A rake with status "Active" currently undergoing POH
- **Completed_Rake**: A rake with status "Completed" that has finished all POH stages
- **Missing_Part**: A Coach_Part with status "Missing/Pending"
- **Mandatory_Item**: A Checklist_Item with mandatory flag set to true
- **Bulk_Operation**: An action applied to multiple coaches simultaneously
- **Stage_Completion**: The event when a coach finishes all work in current POH_Stage
- **Target_Duration**: The expected time in days for completing a POH_Stage
- **Actual_Duration**: The measured time in days taken to complete a POH_Stage
- **Delay_Threshold**: The number of days over Target_Duration that triggers delay classification

## Requirements

### Requirement 1: Rake Registration and Initialization

**User Story:** As a Section_Engineer, I want to register incoming rakes with all coach details and shed location, so that I can begin tracking the POH process with accurate initial data at my assigned shed.

#### Acceptance Criteria

1. WHEN a Section_Engineer submits a new rake registration, THE POH_System SHALL create a unique rake record with all provided details
2. THE POH_System SHALL validate that Rake_Type is either "EMU" or "MEMU"
3. THE POH_System SHALL validate that POH_Type is one of "1st POH", "2nd POH", "3rd POH", or "4th POH"
4. THE POH_System SHALL validate that total_coaches is between 6 and 20 inclusive
5. THE POH_System SHALL validate that the number of coach numbers provided equals total_coaches
6. THE POH_System SHALL validate that each coach number is exactly 6 digits and contains only numeric characters
7. THE POH_System SHALL validate that all coach numbers within a rake are unique
8. WHEN a rake is registered, THE POH_System SHALL require selection of a Shed from the list of configured sheds
9. WHEN a rake is registered, THE POH_System SHALL default the Shed selection to the Section_Engineer's assigned shed
10. WHEN a rake is registered, THE POH_System SHALL record the intake timestamp in IST
11. WHEN a rake is registered, THE POH_System SHALL initialize all coaches to "Intake" stage
12. WHEN a rake is registered, THE POH_System SHALL set rake status to "Active"
13. WHEN a rake is registered, THE POH_System SHALL associate the appropriate POH_Type-specific checklist with each coach
14. WHEN a rake is registered, THE POH_System SHALL initialize all nine Coach_Parts for each coach with status "Not Started"
15. THE POH_System SHALL prevent creation of duplicate Active_Rake records with the same rake number at the same Shed

### Requirement 2: Coach-Level Independent Stage Tracking

**User Story:** As a Section_Engineer, I want to track each coach's progress independently through POH stages, so that I can manage coaches at different stages simultaneously without blocking the entire rake.

#### Acceptance Criteria

1. THE POH_System SHALL track the current POH_Stage for each coach independently
2. THE POH_System SHALL enforce sequential stage progression where a coach cannot skip stages
3. WHEN a coach enters a new POH_Stage, THE POH_System SHALL record the start timestamp in IST
4. WHEN a coach completes a POH_Stage, THE POH_System SHALL record the completion timestamp in IST
5. WHEN a coach completes a POH_Stage, THE POH_System SHALL calculate Actual_Duration as the difference between completion and start timestamps
6. THE POH_System SHALL allow different coaches within the same rake to be at different POH_Stages
7. WHEN a Section_Engineer attempts to advance a coach to the next stage, THE POH_System SHALL verify the current stage is marked complete
8. THE POH_System SHALL display each coach with its coach number and current POH_Stage in all views
9. THE POH_System SHALL calculate elapsed time in current POH_Stage for each coach
10. THE POH_System SHALL support tracking for rakes with 6 to 20 coaches

### Requirement 3: Rake-Level Aggregate Status

**User Story:** As a Section_Engineer, I want to see the overall rake status derived from all coaches, so that I understand the rake's progress and identify coaches blocking advancement.

#### Acceptance Criteria

1. THE POH_System SHALL calculate the rake's current POH_Stage as the earliest stage among all coaches in that rake
2. THE POH_System SHALL display the count of coaches at each POH_Stage for the rake
3. THE POH_System SHALL calculate the completion percentage for each POH_Stage based on coaches completed
4. THE POH_System SHALL highlight coaches that are blocking rake progression to the next stage
5. WHEN all coaches in a rake complete their current POH_Stage, THE POH_System SHALL advance the rake's current POH_Stage
6. WHEN all coaches in a rake complete their current POH_Stage, THE POH_System SHALL send a notification to the Section_Engineer
7. THE POH_System SHALL display a visual progress bar showing rake overall completion percentage
8. THE POH_System SHALL dynamically adjust displays based on the actual number of coaches in the rake

### Requirement 3A: Shed Management and Configuration

**User Story:** As an Admin, I want to configure and manage multiple shed locations, so that the system can support POH operations across the Indian Railways network.

#### Acceptance Criteria

1. THE POH_System SHALL maintain a master list of Shed locations with Shed_Code, shed name, railway zone, and active status
2. THE POH_System SHALL allow Admin to add new Shed locations to the system
3. THE POH_System SHALL allow Admin to update Shed information including name and railway zone
4. THE POH_System SHALL allow Admin to deactivate Shed locations while preserving historical data
5. THE POH_System SHALL validate that Shed_Code is unique across all sheds
6. THE POH_System SHALL display the list of all configured sheds with their details
7. THE POH_System SHALL allow Admin to configure shed-specific settings including default Target_Duration values and notification preferences
8. THE POH_System SHALL default the initial shed configuration to "EMU Car Shed, Ghaziabad, Northern Railway" with Shed_Code "GZB-EMU"
9. WHEN a Shed is deactivated, THE POH_System SHALL prevent new rake registrations at that shed
10. WHEN a Shed is deactivated, THE POH_System SHALL continue to display historical data for that shed

### Requirement 4: Multi-Rake Dashboard

**User Story:** As a Section_Engineer, I want to view all active POH operations in a dashboard with shed filtering, so that I can monitor multiple rakes at my shed or across all sheds and prioritize my work.

#### Acceptance Criteria

1. THE POH_System SHALL display a list of all Active_Rake records
2. THE POH_System SHALL display for each Active_Rake: rake identifier, rake number, Rake_Type, POH_Type, Shed location, current POH_Stage, elapsed time since intake, estimated completion date, coach progress summary, count of delayed coaches, and count of coaches with Missing_Parts
3. THE POH_System SHALL provide filters for Shed, Rake_Type, POH_Type, POH_Stage, and Timeline_Status
4. THE POH_System SHALL default the Shed filter to the Section_Engineer's assigned shed
5. THE POH_System SHALL allow Section_Engineer to select "All Sheds" to view rakes across all locations
6. THE POH_System SHALL provide sorting by intake date, estimated completion date, elapsed time, and number of delayed coaches
7. THE POH_System SHALL provide search capability by rake number or coach number
8. WHEN a Section_Engineer applies a filter, THE POH_System SHALL display only rakes matching the filter criteria
9. WHEN a Section_Engineer applies a sort, THE POH_System SHALL reorder the rake list according to the sort criteria
10. THE POH_System SHALL display a shed indicator badge on each rake card showing the Shed location

### Requirement 5: Detailed Rake Status View

**User Story:** As a Section_Engineer, I want to see complete details for a specific rake including all coaches, so that I can monitor progress and identify issues at the rake level.

#### Acceptance Criteria

1. THE POH_System SHALL display rake header information including rake number, Rake_Type, POH_Type, shed location, intake date, elapsed time, current POH_Stage, and estimated completion date
2. THE POH_System SHALL display all coaches in the rake showing coach number, current POH_Stage, elapsed time in current stage, Timeline_Status, parts status indicator, and checklist completion percentage
3. THE POH_System SHALL display for each POH_Stage the count of coaches at that stage and the percentage complete
4. THE POH_System SHALL display the total coach count for the rake
5. THE POH_System SHALL prominently display coaches blocking rake progression
6. WHEN a Section_Engineer clicks a coach number, THE POH_System SHALL navigate to the coach detail view
7. THE POH_System SHALL display aggregate statistics including average completion percentage, total Missing_Parts count, and average delay across all coaches
8. THE POH_System SHALL adapt the grid layout based on the number of coaches in the rake

### Requirement 6: Coach Detail View

**User Story:** As a Section_Engineer, I want to see complete information for a single coach, so that I can manage that coach's POH process in detail and make informed decisions.

#### Acceptance Criteria

1. THE POH_System SHALL display coach header information including coach number, parent rake information, POH_Type, current POH_Stage, and elapsed time
2. THE POH_System SHALL display a stage timeline showing all 8 POH_Stages with status, start and completion timestamps, Target_Duration, Actual_Duration, and visual timeline representation
3. THE POH_System SHALL display all 9 Coach_Parts with current status, status change timestamps, and parts completion percentage
4. WHEN a Coach_Part has status "Missing/Pending", THE POH_System SHALL display the associated notes and expected arrival date
5. THE POH_System SHALL display all Checklist_Items for the coach's POH_Type with completion status, RDSO_SMI clause references, and checklist completion percentage
6. THE POH_System SHALL highlight Mandatory_Items in the checklist
7. WHEN a coach is in Testing_Phase, THE POH_System SHALL display status for Electrical, Mechanical, and Pneumatic testing with individual timestamps
8. THE POH_System SHALL display all notes chronologically
9. THE POH_System SHALL allow Section_Engineer to update stage status, part statuses, and checklist item completion
10. THE POH_System SHALL allow Section_Engineer to add new notes
11. THE POH_System SHALL provide navigation to previous and next coach in the same rake
12. THE POH_System SHALL display comparison against rake average progress

### Requirement 7: Parts Management and Tracking

**User Story:** As a Section_Engineer, I want to track major components for each coach through their lifecycle, so that I can monitor dismantling, overhaul, and reassembly progress and identify missing parts.

#### Acceptance Criteria

1. THE POH_System SHALL track 9 Coach_Parts per coach: Motor Bogie, Trailer Bogie, Traction Motor, Brake System, Electrical System, Pantograph, Couplers, Suspension System, and Body Shell
2. THE POH_System SHALL track Coach_Part status through lifecycle: Not Started, Dismantled, Under Inspection, Overhauled/Repaired, Reassembled, Tested, and Missing/Pending
3. WHEN a Section_Engineer marks a Coach_Part as "Missing/Pending", THE POH_System SHALL require notes explaining why the part is missing
4. WHEN a Section_Engineer marks a Coach_Part as "Missing/Pending", THE POH_System SHALL require an expected arrival date
5. WHEN a Coach_Part status changes, THE POH_System SHALL record the timestamp in IST
6. THE POH_System SHALL calculate parts completion percentage per coach
7. WHEN a coach has any Missing_Part, THE POH_System SHALL display a visual warning indicator
8. THE POH_System SHALL generate a missing parts report showing all Missing_Parts across all coaches with coach numbers, notes, and expected arrival dates
9. THE POH_System SHALL allow filtering the missing parts report by part type
10. THE POH_System SHALL allow sorting the missing parts report by expected arrival date

### Requirement 8: Timeline and Schedule Management

**User Story:** As a Section_Engineer, I want to track actual versus target timelines for each coach, so that I can identify delays early and take corrective action.

#### Acceptance Criteria

1. THE POH_System SHALL store Target_Duration for each POH_Stage based on standard 20-day breakdown
2. THE POH_System SHALL allow Section_Engineer to customize Target_Duration per coach if needed
3. WHEN a POH_Stage completes, THE POH_System SHALL calculate Actual_Duration
4. THE POH_System SHALL calculate estimated completion date based on current stage, elapsed time in current stage, and remaining stage durations
5. THE POH_System SHALL classify Timeline_Status as "On Schedule" when Actual_Duration is less than or equal to Target_Duration
6. THE POH_System SHALL classify Timeline_Status as "Minor Delay" when Actual_Duration exceeds Target_Duration by 1 to 2 days
7. THE POH_System SHALL classify Timeline_Status as "Significant Delay" when Actual_Duration exceeds Target_Duration by more than 2 days
8. THE POH_System SHALL classify Timeline_Status as "Ahead of Schedule" when Actual_Duration is less than Target_Duration
9. THE POH_System SHALL display Timeline_Status with color coding: green for On Schedule/Ahead, yellow for Minor Delay, red for Significant Delay
10. THE POH_System SHALL calculate percentage of Target_Duration consumed for in-progress stages
11. THE POH_System SHALL calculate rake-level estimated completion as the latest estimated completion date among all coaches
12. THE POH_System SHALL display delay duration for delayed coaches
13. THE POH_System SHALL allow filtering coaches by Timeline_Status

### Requirement 9: POH Type-Specific Checklists

**User Story:** As a Section_Engineer, I want to use POH type-specific checklists with RDSO_SMI references, so that I ensure compliance with correct maintenance procedures for each POH_Type.

#### Acceptance Criteria

1. THE POH_System SHALL maintain distinct checklists for each POH_Type (1st POH, 2nd POH, 3rd POH, 4th POH)
2. THE POH_System SHALL store for each Checklist_Item: unique item ID, description, category, RDSO_SMI clause reference, mandatory flag, and execution order
3. WHEN a rake is registered, THE POH_System SHALL associate the appropriate checklist with each coach based on POH_Type
4. THE POH_System SHALL track completion status per Checklist_Item per coach independently
5. THE POH_System SHALL allow Section_Engineer to mark Checklist_Items as Not Started, In Progress, or Completed
6. WHEN a Checklist_Item is marked Completed, THE POH_System SHALL record the completion timestamp in IST
7. THE POH_System SHALL calculate checklist completion percentage per coach
8. THE POH_System SHALL display aggregate checklist completion for the rake
9. THE POH_System SHALL highlight Mandatory_Items in the checklist display
10. THE POH_System SHALL allow Section_Engineer to add notes to Checklist_Items
11. THE POH_System SHALL display RDSO_SMI clause references for compliance verification
12. THE POH_System SHALL allow viewing checklists for any POH_Type in reference mode

### Requirement 10: Testing Phase Management

**User Story:** As a Section_Engineer, I want to track all three testing types independently during Testing_Phase, so that I ensure comprehensive testing before trial runs.

#### Acceptance Criteria

1. WHEN a coach enters Testing_Phase, THE POH_System SHALL enable tracking for three test types: Electrical Testing, Mechanical Testing, and Pneumatic Testing
2. THE POH_System SHALL track each test type independently with status (Not Started, In Progress, Completed), start timestamp, completion timestamp, and notes
3. THE POH_System SHALL display all three test statuses in the coach detail view
4. THE POH_System SHALL prevent progression from Testing_Phase to Trial stage until all three test types are marked Completed
5. THE POH_System SHALL calculate Testing_Phase completion percentage based on completed test types
6. THE POH_System SHALL display testing breakdown in rake overview
7. THE POH_System SHALL allow Section_Engineer to update each test type status independently
8. WHEN a test type is marked Completed, THE POH_System SHALL record the completion timestamp in IST
9. WHEN a test type is marked Completed, THE POH_System SHALL record the user who performed the test

### Requirement 11: Notes and Comments System

**User Story:** As a Section_Engineer, I want to add timestamped notes at coach level, so that I can document issues, observations, and actions taken during the POH process.

#### Acceptance Criteria

1. THE POH_System SHALL allow Section_Engineer to add timestamped notes at coach level
2. THE POH_System SHALL support three note types: General notes, Stage-specific notes, and Part-specific notes
3. THE POH_System SHALL store for each note: note content, timestamp in IST, user who created it, note type, and related entity (stage or part if applicable)
4. THE POH_System SHALL display all notes chronologically in coach detail view
5. THE POH_System SHALL allow filtering notes by note type
6. THE POH_System SHALL provide search capability across all notes in a rake
7. THE POH_System SHALL display note count indicator on coach cards
8. THE POH_System SHALL allow Section_Engineer to edit or delete their own notes
9. THE POH_System SHALL allow Section_Engineer to flag important notes

### Requirement 12: Visual Status Indicators

**User Story:** As a Section_Engineer, I want visual indicators for coach status, so that I can quickly identify issues without reading detailed information.

#### Acceptance Criteria

1. THE POH_System SHALL display Timeline_Status with color coding: green for On Schedule/Ahead of Schedule, yellow for Minor Delay, red for Significant Delay
2. WHEN a coach has any Missing_Part, THE POH_System SHALL display a warning icon
3. WHEN a coach has Missing_Parts, THE POH_System SHALL display a count badge showing the number of Missing_Parts
4. WHEN a coach has incomplete Mandatory_Items, THE POH_System SHALL display a warning indicator
5. THE POH_System SHALL display a percentage badge showing checklist completion
6. THE POH_System SHALL display a visual grid of all coaches showing coach number, current POH_Stage, status color, and warning indicators
7. WHEN a Section_Engineer hovers over a coach card, THE POH_System SHALL display a tooltip showing coach number, current stage, elapsed time, Timeline_Status, Missing_Parts count, and checklist completion percentage
8. THE POH_System SHALL use consistent indicators across all views
9. THE POH_System SHALL allow administrator to customize Delay_Threshold values

### Requirement 13: Bulk Operations

**User Story:** As a Section_Engineer, I want to update multiple coaches simultaneously, so that I can work efficiently when coaches progress together.

#### Acceptance Criteria

1. THE POH_System SHALL allow Section_Engineer to select multiple coaches using checkboxes in rake detail view
2. THE POH_System SHALL provide Bulk_Operations for: marking stage complete, updating part status, adding notes, and updating checklist items
3. WHEN a Section_Engineer initiates a Bulk_Operation, THE POH_System SHALL validate that the operation is valid for all selected coaches
4. WHEN a Section_Engineer initiates a Bulk_Operation, THE POH_System SHALL display a confirmation dialog showing the number of coaches affected and the action to be performed
5. WHEN a Bulk_Operation is applied, THE POH_System SHALL record individual timestamps for each coach
6. WHEN a Bulk_Operation completes, THE POH_System SHALL display a summary showing successful updates and failed updates with reasons
7. THE POH_System SHALL provide "Select All" functionality for coaches in the same POH_Stage
8. THE POH_System SHALL provide "Select All Delayed" functionality for quick filtering
9. THE POH_System SHALL provide undo capability for Bulk_Operations within the current session

### Requirement 14: Rake Completion and Historical Records

**User Story:** As a Section_Engineer, I want to complete POH operations and access historical records, so that I can review past performance and learn from previous operations.

#### Acceptance Criteria

1. WHEN all coaches in a rake reach Release stage, THE POH_System SHALL allow Section_Engineer to mark the rake as Completed
2. WHEN a rake is marked Completed, THE POH_System SHALL record the final completion timestamp in IST
3. WHEN a rake is marked Completed, THE POH_System SHALL calculate total POH duration
4. WHEN a rake is marked Completed, THE POH_System SHALL change rake status from "Active" to "Completed"
5. THE POH_System SHALL maintain all historical data for Completed_Rakes including stage timestamps, parts history, checklist completion data, notes, and timeline performance data
6. THE POH_System SHALL display Completed_Rakes separately from Active_Rakes
7. THE POH_System SHALL provide filters for Completed_Rakes by completion date range, Rake_Type, POH_Type, and shed location
8. THE POH_System SHALL provide search capability for Completed_Rakes by rake number or coach number
9. THE POH_System SHALL allow exporting Completed_Rake records to PDF and Excel formats
10. THE POH_System SHALL allow comparing Completed_Rakes against target timelines

### Requirement 15: Data Validation and Integrity

**User Story:** As a Section_Engineer, I want the system to validate data entries, so that I maintain accurate records and prevent data corruption.

#### Acceptance Criteria

1. WHEN a Section_Engineer submits rake registration, THE POH_System SHALL validate that Rake_Type is "EMU" or "MEMU"
2. WHEN a Section_Engineer submits rake registration, THE POH_System SHALL validate that POH_Type is one of the four valid types
3. WHEN a Section_Engineer submits rake registration, THE POH_System SHALL validate that total_coaches is between 6 and 20
4. WHEN a Section_Engineer submits rake registration, THE POH_System SHALL validate that each coach number is exactly 6 digits and numeric only
5. WHEN a Section_Engineer submits rake registration, THE POH_System SHALL validate that coach numbers are unique within the rake
6. WHEN a Section_Engineer attempts to advance a coach to next stage, THE POH_System SHALL validate that the current stage is marked complete
7. WHEN a Section_Engineer attempts to advance from Testing_Phase, THE POH_System SHALL validate that all three test types are marked Completed
8. WHEN a Section_Engineer attempts to mark a stage complete, THE POH_System SHALL validate that all Mandatory_Items are completed
9. WHEN a Section_Engineer enters a duration value, THE POH_System SHALL validate that it is a positive number
10. WHEN a Section_Engineer enters a completion timestamp, THE POH_System SHALL validate that it is not before the start timestamp
11. WHEN a Section_Engineer marks a Coach_Part as "Missing/Pending", THE POH_System SHALL validate that notes and expected arrival date are provided
12. WHEN a Section_Engineer enters an expected arrival date, THE POH_System SHALL validate that it is in the future
13. THE POH_System SHALL prevent creation of duplicate Active_Rake records with the same rake number
14. THE POH_System SHALL validate user permissions before allowing updates

### Requirement 16: Dashboard Metrics and Analytics

**User Story:** As a Section_Engineer, I want to see real-time metrics and analytics with shed filtering, so that I can understand overall performance at my shed or across all sheds and identify trends.

#### Acceptance Criteria

1. THE POH_System SHALL display total count of Active_Rakes filtered by selected Shed
2. THE POH_System SHALL display total count of coaches in each POH_Stage across all Active_Rakes at the selected Shed
3. THE POH_System SHALL calculate average POH completion time for the last 30 days at the selected Shed
4. THE POH_System SHALL calculate on-time completion percentage for the selected Shed
5. THE POH_System SHALL display total count of coaches with Missing_Parts at the selected Shed
6. THE POH_System SHALL display total count of delayed coaches at the selected Shed
7. THE POH_System SHALL display for each Active_Rake: elapsed time since intake, estimated completion date, percentage complete, number of delayed coaches, number of coaches with Missing_Parts, and average checklist completion
8. THE POH_System SHALL update dashboard metrics in real-time as data changes
9. THE POH_System SHALL allow Section_Engineer to view metrics for "All Sheds" to see network-wide statistics
10. THE POH_System SHALL display a comparison chart showing performance metrics across different sheds

### Requirement 17: Performance Reports

**User Story:** As a Section_Engineer, I want to generate performance reports, so that I can analyze trends and identify areas for improvement.

#### Acceptance Criteria

1. THE POH_System SHALL generate a POH Type Performance Report showing average completion time, on-time completion percentage, average delay duration, most common delay causes, and average stage durations per POH_Type
2. THE POH_System SHALL generate a Stage Performance Report showing average duration per stage, percentage of coaches completing each stage on time, most delayed stages, and trend analysis over time
3. THE POH_System SHALL generate a Parts Management Report showing most frequently missing parts, average delay caused by Missing_Parts, parts with longest procurement times, and parts availability trends
4. THE POH_System SHALL generate a Timeline Performance Report showing distribution of Timeline_Status, average delay duration, delay trends over time, coaches with longest delays, and correlation between POH_Type and delays
5. THE POH_System SHALL generate a Checklist Compliance Report showing average checklist completion percentage, most frequently skipped items, Mandatory_Items compliance rate, and time to complete checklist per POH_Type
6. THE POH_System SHALL allow exporting reports to PDF, Excel, and CSV formats
7. THE POH_System SHALL allow filtering reports by date range, Rake_Type, POH_Type, and shed location

### Requirement 18: System Performance

**User Story:** As a Section_Engineer, I want the system to respond quickly, so that I can work efficiently without waiting for page loads.

#### Acceptance Criteria

1. THE POH_System SHALL load the dashboard in less than 2 seconds
2. THE POH_System SHALL load the rake detail view in less than 1 second
3. THE POH_System SHALL load the coach detail view in less than 1 second
4. THE POH_System SHALL return search results in less than 500 milliseconds
5. THE POH_System SHALL complete Bulk_Operations for up to 20 coaches in less than 5 seconds
6. THE POH_System SHALL support 50 or more concurrent users
7. THE POH_System SHALL support 100 or more Active_Rakes simultaneously

### Requirement 19: Data Backup and Recovery

**User Story:** As a Section_Engineer, I want automatic data backups, so that I can recover from data loss incidents without losing critical POH tracking information.

#### Acceptance Criteria

1. THE POH_System SHALL perform automatic data backup every 6 hours
2. THE POH_System SHALL retain Completed_Rake data for 5 years
3. THE POH_System SHALL provide graceful error handling with user-friendly messages
4. THE POH_System SHALL auto-save form inputs every 30 seconds
5. THE POH_System SHALL provide session recovery after network interruption
6. THE POH_System SHALL maintain 99.5% uptime during working hours (6 AM to 10 PM IST)

### Requirement 20: Security and Access Control

**User Story:** As a Section_Engineer, I want role-based access control with shed assignments, so that users can only perform actions appropriate to their role and assigned shed location.

#### Acceptance Criteria

1. THE POH_System SHALL require user authentication before granting access
2. THE POH_System SHALL support four user roles: Admin (full access to all sheds), Section_Engineer (create, update, view all at assigned shed), Technician (view only at assigned shed, add notes), and Viewer (read-only access at assigned shed)
3. THE POH_System SHALL assign each user to one or more Shed locations
4. THE POH_System SHALL allow Admin users to access data from all sheds
5. THE POH_System SHALL restrict non-Admin users to view and modify data only at their assigned shed locations
6. THE POH_System SHALL allow Admin to assign or reassign users to different sheds
7. THE POH_System SHALL enforce role-based permissions for all operations
8. THE POH_System SHALL maintain an audit trail for all data modifications including user and shed information
9. THE POH_System SHALL terminate user sessions after 30 minutes of inactivity
10. THE POH_System SHALL encrypt data at rest and in transit
11. THE POH_System SHALL prevent concurrent updates to the same record by multiple users

### Requirement 20A: User Shed Assignment and Profile

**User Story:** As an Admin, I want to assign users to specific shed locations, so that users can work with data relevant to their physical location and responsibilities.

#### Acceptance Criteria

1. THE POH_System SHALL store shed assignment information for each user
2. THE POH_System SHALL allow Admin to assign a user to one or more Shed locations
3. THE POH_System SHALL allow Admin to set a primary Shed for users assigned to multiple sheds
4. THE POH_System SHALL display the user's assigned shed(s) in their profile
5. WHEN a user logs in, THE POH_System SHALL default all views and filters to the user's primary Shed
6. THE POH_System SHALL allow users assigned to multiple sheds to switch between their assigned sheds
7. THE POH_System SHALL prevent non-Admin users from accessing data from sheds they are not assigned to
8. THE POH_System SHALL display the currently selected Shed in the application header
9. WHEN a user attempts to access a rake from a shed they are not assigned to, THE POH_System SHALL display an access denied message
10. THE POH_System SHALL allow Admin users to view and switch between all sheds regardless of assignment

### Requirement 21: Timestamp and Localization

**User Story:** As a Section_Engineer, I want all timestamps in IST with Indian date formats, so that I can work with familiar time and date representations.

#### Acceptance Criteria

1. THE POH_System SHALL record all timestamps in IST (UTC+5:30)
2. THE POH_System SHALL display dates in DD/MM/YYYY format
3. THE POH_System SHALL display times in 24-hour format (HH:MM)
4. THE POH_System SHALL use Indian Railways terminology and conventions throughout the interface

### Requirement 22: Configuration Management

**User Story:** As an Admin, I want the system to use standard POH configurations with shed-specific customization, so that new rakes are initialized with correct target durations and checklists appropriate for each shed.

#### Acceptance Criteria

1. THE POH_System SHALL store standard Target_Duration values for each POH_Stage (Intake: 1 day, Dismantling: 2 days, Inspection: 6 days, Reassembly: 3 days, Finishing: 2 days, Testing: 3 days, Trial: 2 days, Release: 1 day)
2. THE POH_System SHALL allow Admin to configure shed-specific Target_Duration values that override standard values
3. THE POH_System SHALL store standard Coach_Parts list (9 parts) for initialization
4. THE POH_System SHALL store Delay_Threshold values (Minor Delay: 1-2 days over target, Significant Delay: >2 days over target)
5. THE POH_System SHALL store POH_Type-specific checklists with RDSO_SMI clause references
6. THE POH_System SHALL allow administrator to update configuration values
7. WHEN configuration values are updated, THE POH_System SHALL apply changes to new rakes only, not existing Active_Rakes
8. THE POH_System SHALL allow Admin to configure shed-specific settings including notification preferences and reporting parameters
9. WHEN a rake is registered at a Shed with custom Target_Duration values, THE POH_System SHALL use the shed-specific values

### Requirement 23: Export and Data Integration

**User Story:** As a Section_Engineer, I want to export data in multiple formats, so that I can share information with stakeholders and integrate with other systems.

#### Acceptance Criteria

1. THE POH_System SHALL allow exporting rake records to PDF format with formatted layout and charts
2. THE POH_System SHALL allow exporting rake records to Excel format with raw data
3. THE POH_System SHALL allow exporting rake records to CSV format for data integration
4. THE POH_System SHALL include in exports: complete rake records, coach-level details, stage history, parts status history, checklist completion data, timeline performance data, notes and comments, and Missing_Parts reports
5. WHEN a Section_Engineer initiates an export, THE POH_System SHALL generate the file within 10 seconds
6. THE POH_System SHALL allow selecting which data fields to include in exports

### Requirement 24: Notification System

**User Story:** As a Section_Engineer, I want to receive notifications for important events, so that I can take timely action on delays and completions.

#### Acceptance Criteria

1. WHEN all coaches in a rake complete their current POH_Stage, THE POH_System SHALL send a notification to the Section_Engineer
2. WHEN a coach Timeline_Status changes to "Significant Delay", THE POH_System SHALL send a notification to the Section_Engineer
3. WHEN a Coach_Part expected arrival date is reached and the part is still Missing, THE POH_System SHALL send a notification to the Section_Engineer
4. WHEN all three test types in Testing_Phase are completed, THE POH_System SHALL send a notification to the Section_Engineer
5. THE POH_System SHALL display notifications in the user interface
6. THE POH_System SHALL allow Section_Engineer to mark notifications as read
7. THE POH_System SHALL allow Section_Engineer to configure notification preferences

### Requirement 25: Responsive Design

**User Story:** As a Section_Engineer, I want the system to work on different devices, so that I can access POH information from desktop, tablet, or mobile devices.

#### Acceptance Criteria

1. THE POH_System SHALL provide responsive design for desktop resolution (1920x1080)
2. THE POH_System SHALL provide responsive design for tablet resolution (768x1024)
3. THE POH_System SHALL provide responsive design for mobile resolution (375x667)
4. THE POH_System SHALL adapt grid layouts based on screen size
5. THE POH_System SHALL maintain usability and readability across all supported resolutions
6. THE POH_System SHALL provide touch-friendly controls for tablet and mobile devices

