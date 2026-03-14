# Product Requirements Document (PRD)
# Railway POH Management System

## Document Information

- **Document Version**: 1.0
- **Last Updated**: February 26, 2026
- **Project**: Railway Periodic Overhaul (POH) Management System
- **Target Users**: Section Engineers, Maintenance Supervisors, Railway Workshop Staff
- **Primary Location**: EMU Car Shed, Ghaziabad, Northern Railway

---

## Executive Summary

The Railway POH Management System is a comprehensive tracking and scheduling platform for managing Periodic Overhaul operations of EMU (Electric Multiple Unit) and MEMU (Mainline Electric Multiple Unit) railway rakes. The system enables real-time monitoring of maintenance operations at the individual coach level, tracking 6 to 20 coaches per rake through eight sequential stages from intake to release, with complete parts management, checklist tracking, and timeline monitoring capabilities.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [POH Fundamentals](#poh-fundamentals)
3. [Data Structures](#data-structures)
4. [Functional Requirements](#functional-requirements)
5. [RDSO Standards Compliance](#rdso-standards-compliance)
6. [User Workflows](#user-workflows)
7. [Reporting and Analytics](#reporting-and-analytics)

---

## System Overview

### Purpose

Enable Section Engineers at railway maintenance sheds to:
- Register incoming rakes for periodic overhaul
- Track each coach independently through 8 POH stages (6 to 20 coaches per rake)
- Monitor parts status and manage missing components
- Ensure compliance with RDSO SMI standards
- Track timelines and identify delays
- Manage POH type-specific checklists
- Generate reports and analytics on maintenance operations

### Target Users

**Primary Users:**
- Section Engineers (supervisory role)
- Senior Section Engineers
- Divisional Mechanical Engineers

**Secondary Users:**
- Workshop technicians (view-only access)
- Maintenance planners
- Quality control inspectors


### Key Capabilities

- **Coach-Level Independence**: Track each coach separately through POH stages (6 to 20 coaches per rake)
- **Variable Rake Composition**: Support rakes with 6 to 20 coaches based on rake configuration
- **Multi-Rake Management**: Monitor multiple rakes undergoing different POH types simultaneously
- **Parts Tracking**: Monitor status of 9 major components per coach
- **Timeline Management**: Compare actual vs. target timelines with delay flagging
- **Checklist Compliance**: POH type-specific checklists with SMI clause references
- **Bulk Operations**: Update multiple coaches simultaneously when appropriate
- **Historical Analytics**: Performance metrics and trend analysis

---

## POH Fundamentals

### Rake Composition

**Rake Structure:**
- Each rake = 6 to 20 coaches (variable based on rake configuration)
- Each coach = unique 6-digit Coach Number (e.g., 123456, 123457)
- Coaches tracked independently through all stages
- Rake overall status = aggregate of all coach statuses
- Common configurations: 6-coach, 9-coach, 12-coach, 15-coach, 18-coach, 20-coach rakes

**Rake Types:**
- **EMU** (Electric Multiple Unit) - Urban/suburban electric trains
- **MEMU** (Mainline Electric Multiple Unit) - Mainline electric trains

### POH Types and Periodicity

#### Conventional EMU/MEMU (18-month cycle)

| POH Type | Months Since Commissioning | Years | Interval |
|----------|---------------------------|-------|----------|
| 1st POH  | 18 months                 | 1.5   | Initial  |
| 2nd POH  | 36 months                 | 3.0   | +18 months |
| 3rd POH  | 54 months                 | 4.5   | +18 months |
| 4th POH  | 72 months                 | 6.0   | +18 months |

#### 3-Phase EMU/MEMU (24-month cycle)

| POH Type | Months Since Commissioning | Years | Interval |
|----------|---------------------------|-------|----------|
| 1st POH  | 24 months                 | 2.0   | Initial  |
| 2nd POH  | 48 months                 | 4.0   | +24 months |
| 3rd POH  | 72 months                 | 6.0   | +24 months |
| 4th POH  | 96 months                 | 8.0   | +24 months |


### POH Stages (8 Sequential Stages)

Each coach progresses through these stages independently:

| Stage | Description | Target Duration |
|-------|-------------|-----------------|
| 1. Intake | Rake arrival, documentation, initial assessment | 1 day |
| 2. Dismantling | Complete disassembly of coach components | 2 days |
| 3. Inspection | Detailed examination of all parts and systems | 6 days |
| 4. Reassembly | Reconstruction of coach components | 3 days |
| 5. Finishing | Final touches, painting, cosmetic work | 2 days |
| 6. Testing | Electrical, mechanical, and pneumatic testing | 3 days |
| 7. Trial | Test runs and performance validation | 2 days |
| 8. Release | Final clearance and return to service | 1 day |

**Total Target Duration: 20 days per coach**

### Testing Phase Breakdown

The Testing stage (Stage 6) consists of three independent test types that must all be completed:

1. **Electrical Testing**
   - Insulation resistance test (Megger test)
   - Circuit continuity verification
   - Thermography of all electrical connections
   - Control and auxiliary wiring inspection
   - Earth continuity and bonding test

2. **Mechanical Testing**
   - Structural integrity inspection
   - Clearance measurements
   - Alignment verification
   - Bogie frame dimensional check
   - Wheel profile and gauge measurement

3. **Pneumatic Testing**
   - Brake power test
   - Brake percentage calculation
   - Air pressure tests (cut-in/cut-out settings)
   - Leak tests on brake pipes and hoses
   - Compressor performance validation

### Maintenance Shed

**Primary Location:** EMU Car Shed, Ghaziabad, Northern Railway

**Shed Capabilities:**
- Simultaneous handling of multiple rakes
- Support for both EMU and MEMU types
- All four POH types (1st through 4th)
- Complete testing facilities


---

## Data Structures

### Rake Record

```
Rake {
  rake_id: string (unique identifier)
  rake_number: string (railway identification)
  rake_type: enum ["EMU", "MEMU"]
  poh_type: enum ["1st POH", "2nd POH", "3rd POH", "4th POH"]
  shed_location: string (default: "EMU Car Shed Ghaziabad")
  intake_timestamp: datetime (IST)
  estimated_completion_date: datetime
  current_rake_stage: enum [8 stages]
  status: enum ["Active", "Completed"]
  total_coaches: number (6 to 20)
  coaches: array of Coach objects (length = total_coaches)
}
```

### Coach Record

```
Coach {
  coach_number: string (6 digits, e.g., "123456")
  rake_id: string (parent rake reference)
  current_stage: enum [8 stages]
  stage_history: array of StageHistory objects
  parts: array[9] of Part objects
  checklist: array of ChecklistItem objects
  notes: array of Note objects
  timeline_status: enum ["On Schedule", "Minor Delay", "Significant Delay", "Ahead of Schedule"]
  completion_percentage: number (0-100)
}
```

### Stage History

```
StageHistory {
  stage_name: enum [8 stages]
  start_timestamp: datetime (IST)
  completion_timestamp: datetime (IST) | null
  estimated_duration_days: number
  actual_duration_days: number | null
  status: enum ["Not Started", "In Progress", "Completed"]
  notes: string
}
```

### Coach Part

```
Part {
  part_id: string
  part_name: enum [
    "Motor Bogie",
    "Trailer Bogie", 
    "Traction Motor",
    "Brake System",
    "Electrical System",
    "Pantograph",
    "Couplers",
    "Suspension System",
    "Body Shell"
  ]
  status: enum [
    "Not Started",
    "Dismantled",
    "Under Inspection",
    "Overhauled/Repaired",
    "Reassembled",
    "Tested",
    "Missing/Pending"
  ]
  status_change_timestamp: datetime (IST)
  notes: string (required if status = "Missing/Pending")
  expected_arrival_date: datetime | null (required if status = "Missing/Pending")
}
```


### Checklist Item

```
ChecklistItem {
  item_id: string (e.g., "chk-1-001")
  description: string
  category: string (e.g., "Bogie", "Electrical", "Brakes")
  smi_clause: string (RDSO SMI reference, e.g., "Section 3.1.1")
  mandatory: boolean
  order: number (execution sequence)
  status: enum ["Not Started", "In Progress", "Completed"]
  completion_timestamp: datetime | null
  notes: string
}
```

### Note/Comment

```
Note {
  note_id: string
  coach_number: string
  note_type: enum ["General", "Stage-Specific", "Part-Specific"]
  related_stage: string | null
  related_part: string | null
  content: string
  timestamp: datetime (IST)
  created_by: string (user identifier)
}
```

### Testing Record

```
TestingRecord {
  coach_number: string
  electrical_testing: {
    status: enum ["Not Started", "In Progress", "Completed"]
    start_timestamp: datetime | null
    completion_timestamp: datetime | null
    notes: string
  }
  mechanical_testing: {
    status: enum ["Not Started", "In Progress", "Completed"]
    start_timestamp: datetime | null
    completion_timestamp: datetime | null
    notes: string
  }
  pneumatic_testing: {
    status: enum ["Not Started", "In Progress", "Completed"]
    start_timestamp: datetime | null
    completion_timestamp: datetime | null
    notes: string
  }
}
```

---

## Functional Requirements

### 1. Rake Registration and Initialization

**User Story:** As a Section Engineer, I want to register incoming rakes with all coach numbers, so that I can begin tracking the POH process.

**Requirements:**
- Create new POH record with rake identification
- Select rake type (EMU or MEMU)
- Select POH type (1st, 2nd, 3rd, or 4th POH)
- Set shed location (default: EMU Car Shed Ghaziabad)
- Specify number of coaches in rake (6 to 20)
- Enter coach numbers (matching the specified count) with validation:
  - Must be exactly 6 digits
  - Must be numeric only
  - Must be unique within the rake
  - Can duplicate across different rakes
- Record intake timestamp automatically
- Initialize all coaches to "Intake" stage
- Set rake status to "Active"
- Generate unique rake tracking ID
- Store total coach count with rake record


### 2. Coach-Level Independent Stage Tracking

**User Story:** As a Section Engineer, I want to track each coach's progress independently, so that I can manage coaches at different stages simultaneously.

**Requirements:**
- Track current stage for each coach independently (regardless of rake size)
- Enforce sequential stage progression (no skipping)
- Record start timestamp when coach enters new stage
- Record completion timestamp when coach completes stage
- Calculate elapsed time in current stage
- Calculate actual duration for completed stages
- Allow different coaches to be at different stages
- Prevent moving to next stage until current stage marked complete
- Display coach number with current stage in all views
- Support variable number of coaches per rake (6 to 20)

### 3. Rake-Level Aggregate Status

**User Story:** As a Section Engineer, I want to see the overall rake status, so that I understand when the entire rake can progress.

**Requirements:**
- Calculate rake stage as earliest stage among all coaches
- Display count of coaches at each stage (e.g., "8 of 12 completed Dismantling" or "5 of 9 completed Dismantling")
- Calculate completion percentage per stage
- Highlight coaches blocking rake progression
- Auto-advance rake stage when all coaches complete current stage
- Send notification when rake ready to progress to next stage
- Display visual progress bar for rake overall completion
- Dynamically adjust displays based on actual number of coaches in rake

### 4. Multi-Rake Dashboard

**User Story:** As a Section Engineer, I want to view all active POH operations, so that I can monitor multiple rakes simultaneously.

**Requirements:**
- Display list of all active POH records
- Show for each rake:
  - Rake identifier and number
  - Rake type (EMU/MEMU)
  - POH type (1st/2nd/3rd/4th)
  - Current rake stage
  - Elapsed time since intake
  - Estimated completion date
  - Coach progress summary (X of 12 coaches per stage)
  - Count of delayed coaches
  - Count of coaches with missing parts
- Filter by:
  - Rake stage
  - Rake type (EMU/MEMU)
  - POH type (1st/2nd/3rd/4th)
  - Timeline status (On Schedule/Delayed)
- Sort by:
  - Intake date
  - Estimated completion date
  - Elapsed time
  - Number of delayed coaches
- Search by rake number or coach number


### 5. Detailed Rake Status View

**User Story:** As a Section Engineer, I want to see complete details for a specific rake, so that I can monitor all 12 coaches and their progress.

**Requirements:**
- Display rake header information:
  - Rake number, type, POH type
  - Shed location
  - Intake date and elapsed time
  - Current rake stage
  - Overall estimated completion date
- Display all coaches in grid/list format showing:
  - Coach number
  - Current stage
  - Elapsed time in current stage
  - Timeline status (color-coded)
  - Parts status indicator
  - Checklist completion percentage
- For each stage, show:
  - Count of coaches at that stage
  - Count of coaches completed
  - Percentage complete (e.g., "8/12" or "5/9")
- Display total coach count for the rake
- Display coaches blocking progression prominently
- Allow clicking coach number to open coach detail view
- Show aggregate statistics:
  - Average completion percentage
  - Total missing parts count
  - Average delay across all coaches
- Adapt grid layout based on number of coaches (responsive display)

### 6. Coach Detail View

**User Story:** As a Section Engineer, I want to see complete information for a single coach, so that I can manage that coach's POH process in detail.

**Requirements:**
- Display coach header:
  - Coach number
  - Parent rake information
  - POH type
  - Current stage and elapsed time
- Display stage timeline:
  - All 8 stages with status
  - Start and completion timestamps for each
  - Estimated vs. actual duration
  - Visual timeline representation
- Display parts status:
  - All 9 major parts with current status
  - Status change timestamps
  - Missing parts highlighted with notes and expected dates
  - Parts completion percentage
- Display checklist:
  - All checklist items for this POH type
  - Completion status per item
  - SMI clause references
  - Mandatory items highlighted
  - Checklist completion percentage
- Display testing breakdown (when in Testing stage):
  - Electrical testing status
  - Mechanical testing status
  - Pneumatic testing status
  - Individual timestamps for each
- Display all notes chronologically
- Allow updating:
  - Stage status (mark complete, move to next)
  - Part statuses
  - Checklist item completion
  - Add new notes
- Provide navigation to previous/next coach in same rake
- Show comparison against rake average progress


### 7. Parts Management

**User Story:** As a Section Engineer, I want to track major components for each coach, so that I can monitor dismantling, overhaul, and reassembly progress.

**Requirements:**
- Track 9 major parts per coach:
  1. Motor Bogie
  2. Trailer Bogie
  3. Traction Motor
  4. Brake System
  5. Electrical System
  6. Pantograph
  7. Couplers
  8. Suspension System
  9. Body Shell
- Track part status through lifecycle:
  - Not Started
  - Dismantled
  - Under Inspection
  - Overhauled/Repaired
  - Reassembled
  - Tested
  - Missing/Pending
- When marking part as "Missing/Pending":
  - Require notes explaining why missing
  - Require expected arrival date
  - Display visual warning indicator
- Record timestamp for each status change
- Calculate parts completion percentage per coach
- Display visual indicator for coaches with missing parts
- Generate missing parts report showing:
  - All missing parts across all coaches
  - Coach numbers affected
  - Notes and expected arrival dates
  - Sort by expected arrival date
  - Filter by part type
- Allow adding custom parts beyond standard 9

### 8. Timeline and Schedule Management

**User Story:** As a Section Engineer, I want to track actual vs. target timelines, so that I can identify delays and take corrective action.

**Requirements:**
- Set target duration for each stage (default: standard 20-day breakdown)
- Allow customizing target durations per coach if needed
- Calculate estimated completion date based on:
  - Current stage
  - Elapsed time in current stage
  - Remaining stage durations
- Calculate actual duration when stage completes
- Compare actual vs. target:
  - On Schedule: actual ≤ target
  - Minor Delay: actual > target by 1-2 days
  - Significant Delay: actual > target by >2 days
  - Ahead of Schedule: actual < target
- Display timeline status with color coding:
  - Green: On Schedule / Ahead
  - Yellow: Minor Delay
  - Red: Significant Delay
- Calculate percentage of target timeline consumed
- For rake level, calculate overall estimated completion as latest date among all coaches
- Display delay duration for delayed coaches
- Allow filtering coaches by timeline status
- Timeline calculations adapt to actual number of coaches in rake


### 9. POH Type-Specific Checklists

**User Story:** As a Section Engineer, I want to use POH type-specific checklists, so that I ensure compliance with correct maintenance procedures.

**Requirements:**
- Maintain distinct checklists for each POH type (1st, 2nd, 3rd, 4th)
- Each checklist item contains:
  - Unique item ID (e.g., chk-1-001)
  - Description of work
  - Category (Bogie, Electrical, Brakes, etc.)
  - SMI clause reference
  - Mandatory flag
  - Execution order
- When rake registered, associate appropriate checklist with each coach
- Track completion status per item per coach independently
- Allow marking items as:
  - Not Started
  - In Progress
  - Completed
- Record completion timestamp for each item
- Calculate checklist completion percentage per coach
- Display aggregate checklist completion for rake
- Highlight mandatory items
- Allow adding notes to checklist items
- Display SMI clause references for compliance verification
- Allow viewing checklist for any POH type (reference mode)

### 10. Testing Phase Management

**User Story:** As a Section Engineer, I want to track all three testing types independently, so that I ensure comprehensive testing before trial runs.

**Requirements:**
- When coach enters Testing stage, enable three test types:
  1. Electrical Testing
  2. Mechanical Testing
  3. Pneumatic Testing
- Track each test type independently with:
  - Status (Not Started, In Progress, Completed)
  - Start timestamp
  - Completion timestamp
  - Notes
- Display all three test statuses in coach detail view
- Require all three tests complete before allowing progression to Trial stage
- Calculate testing phase completion percentage
- Display testing breakdown in rake overview
- Allow updating each test type status independently
- Record who performed each test (user tracking)


### 11. Notes and Comments System

**User Story:** As a Section Engineer, I want to add notes at coach level, so that I can document issues and observations.

**Requirements:**
- Add timestamped notes at coach level
- Three note types:
  - General notes (coach-wide)
  - Stage-specific notes
  - Part-specific notes
- Each note contains:
  - Note content
  - Timestamp (IST)
  - User who created it
  - Type and related entity (stage/part if applicable)
- Display all notes chronologically in coach detail view
- Filter notes by type
- Search notes across all coaches in a rake
- Display note count indicator on coach cards
- Allow editing/deleting own notes
- Highlight important notes (flagging system)

### 12. Visual Status Indicators

**User Story:** As a Section Engineer, I want visual indicators for coach status, so that I can quickly identify issues.

**Requirements:**
- Color-coded timeline status:
  - Green: On Schedule / Ahead of Schedule
  - Yellow: Minor Delay (1-2 days over target)
  - Red: Significant Delay (>2 days over target)
- Missing parts indicator:
  - Warning icon when any part status = "Missing/Pending"
  - Count badge showing number of missing parts
- Incomplete checklist indicator:
  - Warning when mandatory items incomplete
  - Percentage badge showing completion
- Visual grid of all 12 coaches showing:
  - Coach number
  - Current stage
  - Status color
  - Warning indicators
- Tooltip on hover showing:
  - Coach number
  - Current stage and elapsed time
  - Timeline status
  - Missing parts count
  - Checklist completion percentage
- Consistent indicators across all views
- Allow customizing delay thresholds (admin setting)


### 13. Bulk Operations

**User Story:** As a Section Engineer, I want to update multiple coaches simultaneously, so that I can work efficiently when coaches progress together.

**Requirements:**
- Select multiple coaches using checkboxes in rake detail view
- Bulk operations available:
  - Mark stage complete for all selected coaches
  - Update same part status across selected coaches
  - Add same note to all selected coaches
  - Update checklist items across selected coaches
- Validation before applying:
  - Verify operation valid for all selected coaches
  - Show which coaches will be affected
  - Display confirmation dialog
- Record individual timestamps for each coach even in bulk
- Show progress indicator during bulk operation
- Display success/failure summary after operation
- Allow "Select All" for coaches in same stage
- Allow "Select All Delayed" for quick filtering
- Undo capability for bulk operations (within session)

### 14. Rake Completion and History

**User Story:** As a Section Engineer, I want to complete POH operations and access historical records, so that I can review past performance.

**Requirements:**
- When all 12 coaches reach Release stage:
  - Allow marking rake as "Completed"
  - Record final completion timestamp
  - Calculate total POH duration
  - Move to completed records
- Completed records maintain:
  - All stage timestamps and durations
  - All parts history
  - All checklist completion data
  - All notes and comments
  - Timeline performance data
- View completed POH records separately from active
- Filter completed records by:
  - Completion date range
  - Rake type (EMU/MEMU)
  - POH type (1st/2nd/3rd/4th)
  - Shed location
- Search completed records by rake or coach number
- Export completed records to PDF/Excel
- Compare completed records against targets


### 15. Data Validation and Integrity

**User Story:** As a Section Engineer, I want the system to validate data entries, so that I maintain accurate records.

**Requirements:**
- Rake registration validation:
  - Rake type must be EMU or MEMU
  - POH type must be 1st, 2nd, 3rd, or 4th
  - Exactly 12 coach numbers required
  - Each coach number must be 6 digits, numeric only
  - Coach numbers must be unique within rake
  - Shed location required
- Stage progression validation:
  - Cannot skip stages
  - Cannot move to next stage until current marked complete
  - Cannot mark stage complete if mandatory checklist items incomplete
  - Cannot progress from Testing until all 3 test types complete
- Timeline validation:
  - Durations must be positive numbers
  - Completion timestamp cannot be before start timestamp
  - Cannot set dates in the past (except intake)
- Parts validation:
  - Missing/Pending status requires notes and expected date
  - Expected arrival date must be in future
- Prevent duplicate active POH for same rake number
- Validate user permissions before allowing updates

---

## RDSO Standards Compliance

### RDSO SMI Reference

**Document Details:**
- **Title**: EMU/MEMU Scheduled Maintenance Instructions (SMI)
- **Report Number**: RDSO/PE/EMU/0038-2021 (Rev.2)
- **Issue Date**: 24.06.2024
- **Issued By**: Research Designs & Standards Organisation (RDSO), Lucknow
- **Applicable Location**: EMU Car Shed, Ghaziabad, Northern Railway
- **Revision**: Revision 2

### POH Type Work Scope (RDSO Compliant)

#### 1st POH - Basic Overhaul
- Basic bogie inspection
- Traction motor basic servicing
- Brake system inspection
- Electrical system basic check
- Body shell minor repairs
- **Must Change Items (Every POH):**
  - Brake blocks (all coaches)
  - Rubber/Neoprene items in brake cylinder
  - Rubber items in EP valve
  - Air spring flexible hoses (3-phase only)


#### 2nd POH - Intermediate Overhaul
- All 1st POH activities PLUS:
- Intermediate bogie overhaul
- Traction motor intermediate servicing
- Brake system intermediate overhaul
- Electrical system detailed inspection
- Body shell repairs
- **Additional Must Change Items:**
  - Battery (120 AH VRLA) - age/condition basis
  - Bio-toilet tank rubber gasket
  - Air dryer rubber items
  - Air dryer desiccant

#### 3rd POH - Advanced Overhaul
- All 1st POH activities PLUS:
- Advanced bogie overhaul
- Traction motor advanced servicing
- Brake system complete overhaul
- Electrical system comprehensive check
- Body shell major repairs
- **Additional Must Change Items:**
  - ACP wire rope (MANDATORY - 72 months)
  - Carriage fans (as per codal life)
  - Air spring rubber packing (100%)

#### 4th POH - Complete Overhaul
- All 1st POH activities PLUS:
- Complete bogie overhaul and replacement
- Traction motor complete overhaul
- Brake system complete replacement
- Electrical system complete overhaul
- Body shell complete refurbishment
- **Additional Must Change Items:**
  - Traction motor bearing (MANDATORY - all makes)
    - Conventional: 72 months / 6 years
    - 3-Phase: 96 months / 8 years
  - TM rubber sandwich packing
  - All shock absorbers (100% replacement)
  - RMVU/AHU blower motor bearings
  - TCU/ACU blower fans
  - Pantograph consumables (as per OEM manual)

### Checklist Categories (RDSO SMI Aligned)

1. **Bogie & Suspension** (Section 4.1)
2. **Wheels & Axles** (Section 4.2)
3. **Traction Motor** (Section 5.1)
4. **Brake System** (Section 6.1)
5. **Pantograph** (Section 7.1)
6. **Couplers** (Section 8.1)
7. **Body Shell** (Section 9.1)
8. **Auxiliary Systems** (Section 10.1)
9. **Final Testing** (Section 11.1)


### Sample Checklist Items (1st POH)

#### Bogie & Suspension
- **chk-1-001**: Bogie frame inspection and crack detection (NDT) - Clause 4.1.1 - Mandatory
- **chk-1-002**: Primary suspension springs examination and replacement - Clause 4.1.2 - Mandatory
- **chk-1-003**: Secondary suspension coil springs and rubber pads check - Clause 4.1.3 - Mandatory
- **chk-1-004**: Axle box bearing examination and lubrication - Clause 4.1.4 - Mandatory

#### Wheels & Axles
- **chk-1-005**: Wheel profile measurement and re-profiling if required - Clause 4.2.1 - Mandatory
- **chk-1-006**: Axle ultrasonic testing (UST) for cracks - Clause 4.2.2 - Mandatory
- **chk-1-007**: Wheel disc crack detection by MPI - Clause 4.2.3 - Mandatory

#### Traction Motor
- **chk-1-008**: Traction motor dismantling and complete inspection - Clause 5.1.1 - Mandatory
- **chk-1-009**: Armature and field coil insulation resistance test - Clause 5.1.2 - Mandatory
- **chk-1-010**: Commutator undercutting and surface grinding - Clause 5.1.3 - Mandatory

#### Brake System
- **chk-1-011**: Brake cylinder overhaul and seal replacement - Clause 6.1.1 - Mandatory
- **chk-1-012**: Distributor valve (DV) overhaul and testing - Clause 6.1.2 - Mandatory
- **chk-1-013**: Brake block examination and replacement (MUST CHANGE) - Clause 6.1.4 - Mandatory

#### Final Testing
- **chk-1-014**: Electrical insulation resistance test (Megger test) - Clause 11.1.1 - Mandatory
- **chk-1-015**: Brake power test and brake percentage calculation - Clause 11.1.2 - Mandatory
- **chk-1-016**: Trial run on test track (minimum 50 km) - Clause 11.1.3 - Mandatory
- **chk-1-017**: Final inspection and clearance certificate - Clause 11.1.4 - Mandatory

---

## User Workflows

### Workflow 1: Register New Rake for POH

1. Section Engineer navigates to "New POH Registration"
2. System displays registration form
3. User enters:
   - Rake number
   - Selects rake type (EMU/MEMU)
   - Selects POH type (1st/2nd/3rd/4th)
   - Confirms shed location
   - Enters 12 coach numbers
4. System validates all inputs
5. System creates rake record and 12 coach records
6. System initializes all coaches to "Intake" stage
7. System associates appropriate checklist with each coach
8. System displays confirmation and rake dashboard


### Workflow 2: Progress Coach Through Stages

1. Section Engineer opens rake detail view
2. System displays all 12 coaches with current stages
3. User clicks on coach to open coach detail view
4. User reviews current stage status and checklist
5. When work complete, user clicks "Mark Stage Complete"
6. System validates:
   - Mandatory checklist items completed (if applicable)
   - All testing types complete (if in Testing stage)
7. System records completion timestamp
8. System advances coach to next stage
9. System records new stage start timestamp
10. System updates rake aggregate status
11. System displays updated coach status

### Workflow 3: Track Missing Parts

1. Section Engineer opens coach detail view
2. User navigates to "Parts" section
3. User updates part status to "Missing/Pending"
4. System prompts for:
   - Notes explaining why missing
   - Expected arrival date
5. User enters required information
6. System saves part status with timestamp
7. System displays warning indicator on coach card
8. System adds to missing parts report
9. When part arrives:
   - User updates status to appropriate stage
   - System removes from missing parts report
   - System clears warning indicator

### Workflow 4: Bulk Update Multiple Coaches

1. Section Engineer opens rake detail view
2. System displays all 12 coaches
3. User selects multiple coaches using checkboxes
4. User clicks "Bulk Actions" dropdown
5. User selects action (e.g., "Mark Stage Complete")
6. System displays confirmation dialog showing:
   - Number of coaches affected
   - Current stage for each
   - Action to be performed
7. User confirms action
8. System validates each coach individually
9. System applies action to all valid coaches
10. System displays summary:
    - Successful updates
    - Failed updates with reasons
11. System updates rake aggregate status


### Workflow 5: Complete Testing Phase

1. Section Engineer opens coach in Testing stage
2. System displays three test types with status
3. User performs electrical testing:
   - Marks "Electrical Testing" as "In Progress"
   - Completes tests per RDSO SMI
   - Marks "Electrical Testing" as "Completed"
   - System records completion timestamp
4. User performs mechanical testing:
   - Marks "Mechanical Testing" as "In Progress"
   - Completes tests per RDSO SMI
   - Marks "Mechanical Testing" as "Completed"
   - System records completion timestamp
5. User performs pneumatic testing:
   - Marks "Pneumatic Testing" as "In Progress"
   - Completes tests per RDSO SMI
   - Marks "Pneumatic Testing" as "Completed"
   - System records completion timestamp
6. System validates all three tests complete
7. System enables "Mark Stage Complete" button
8. User marks Testing stage complete
9. System advances coach to Trial stage

### Workflow 6: Monitor Rake Progress

1. Section Engineer opens dashboard
2. System displays all active rakes
3. User filters by POH type or timeline status
4. User clicks on specific rake
5. System displays detailed rake view with:
   - All 12 coaches and their stages
   - Visual progress indicators
   - Timeline status for each coach
   - Missing parts summary
6. User identifies delayed coaches (red indicators)
7. User clicks on delayed coach
8. System displays coach detail with:
   - Delay duration
   - Current stage elapsed time
   - Blocking issues (missing parts, incomplete checklist)
9. User takes corrective action
10. User adds notes documenting actions taken

---

## Reporting and Analytics

### Dashboard Metrics

**Real-Time Metrics:**
- Total active POH operations
- Total coaches in each stage
- Average POH completion time (last 30 days)
- On-time completion percentage
- Total coaches with missing parts
- Total delayed coaches

**Rake-Level Metrics:**
- Elapsed time since intake
- Estimated completion date
- Percentage complete
- Number of delayed coaches
- Number of coaches with missing parts
- Average checklist completion


### Performance Reports

#### POH Type Performance Report
- Average completion time per POH type
- On-time completion percentage per POH type
- Average delay duration per POH type
- Most common delay causes per POH type
- Average stage durations per POH type
- Comparison between POH types

#### Stage Performance Report
- Average duration per stage across all POH operations
- Percentage of coaches completing each stage on time
- Most delayed stages
- Stage-specific bottlenecks
- Trend analysis over time

#### Parts Management Report
- Most frequently missing parts
- Average delay caused by missing parts
- Parts with longest procurement times
- Parts availability trends
- Supplier performance (if tracked)

#### Timeline Performance Report
- Distribution of timeline statuses (On Schedule/Delayed/Ahead)
- Average delay duration
- Delay trends over time
- Coaches with longest delays
- Correlation between POH type and delays

#### Checklist Compliance Report
- Average checklist completion percentage
- Most frequently skipped items
- Mandatory items compliance rate
- Time to complete checklist per POH type
- Non-compliance incidents

### Export Capabilities

**Export Formats:**
- PDF (formatted reports with charts)
- Excel (raw data for analysis)
- CSV (data integration)

**Exportable Data:**
- Complete rake records
- Coach-level details
- Stage history
- Parts status history
- Checklist completion data
- Timeline performance data
- Notes and comments
- Missing parts reports

---

## Non-Functional Requirements

### Performance
- Dashboard load time: < 2 seconds
- Rake detail view load time: < 1 second
- Coach detail view load time: < 1 second
- Search results: < 500ms
- Bulk operations: < 5 seconds for 12 coaches
- Support 50+ concurrent users
- Support 100+ active POH operations simultaneously


### Usability
- Intuitive navigation with max 3 clicks to any feature
- Responsive design for desktop (1920x1080), tablet (768x1024), mobile (375x667)
- Color-coded visual indicators for quick status recognition
- Consistent UI patterns across all views
- Keyboard shortcuts for common actions
- Tooltips and help text for complex features
- Undo capability for critical operations

### Reliability
- 99.5% uptime during working hours (6 AM - 10 PM IST)
- Automatic data backup every 6 hours
- Data retention: 5 years for completed POH records
- Graceful error handling with user-friendly messages
- Auto-save for form inputs every 30 seconds
- Session recovery after network interruption

### Security
- Role-based access control:
  - Admin: Full access
  - Section Engineer: Create, update, view all
  - Technician: View only, add notes
  - Viewer: Read-only access
- Audit trail for all data modifications
- User authentication required
- Session timeout after 30 minutes of inactivity
- Data encryption at rest and in transit
- Regular security audits

### Data Integrity
- Atomic transactions for multi-record updates
- Referential integrity between rakes and coaches
- Validation at input and database level
- Prevent concurrent updates to same record
- Automatic timestamp recording (IST timezone)
- Data consistency checks on startup

### Scalability
- Support growth to 500+ active POH operations
- Support 200+ concurrent users
- Database optimization for large datasets
- Efficient indexing on frequently queried fields
- Pagination for large result sets
- Caching for frequently accessed data

### Localization
- All timestamps in IST (Indian Standard Time)
- Date format: DD/MM/YYYY
- Time format: 24-hour (HH:MM)
- Support for Hindi language interface (future enhancement)
- Indian Railways terminology and conventions


---

## Configuration Data

### POH Configuration by Type

This configuration data should be stored in the system and used to initialize new POH operations:

#### 1st POH Configuration
```
{
  "pohType": "1st POH",
  "rakeType": "MEMU",
  "totalTargetDuration": 20,
  "stageTargetDurations": {
    "Intake": 1,
    "Dismantling": 2,
    "Inspection": 6,
    "Reassembly": 3,
    "Finishing": 2,
    "Testing": 3,
    "Trial": 2,
    "Release": 1
  },
  "workScope": [
    "Basic bogie inspection",
    "Traction motor basic servicing",
    "Brake system inspection",
    "Electrical system basic check",
    "Body shell minor repairs"
  ],
  "smiReference": "RDSO 3-Phase MEMU SMI - 1st POH",
  "description": "First periodic overhaul for 3-phase MEMU rakes (every 24 months)"
}
```

#### Standard Parts List (All Coaches)
```
[
  { "id": "part-001", "name": "Motor Bogie", "category": "Bogie" },
  { "id": "part-002", "name": "Trailer Bogie", "category": "Bogie" },
  { "id": "part-003", "name": "Traction Motor", "category": "Electrical" },
  { "id": "part-004", "name": "Brake System", "category": "Brakes" },
  { "id": "part-005", "name": "Electrical System", "category": "Electrical" },
  { "id": "part-006", "name": "Pantograph", "category": "Electrical" },
  { "id": "part-007", "name": "Couplers", "category": "Mechanical" },
  { "id": "part-008", "name": "Suspension System", "category": "Mechanical" },
  { "id": "part-009", "name": "Body Shell", "category": "Structure" }
]
```

### Timeline Thresholds

```
{
  "onSchedule": {
    "condition": "actual <= target",
    "color": "green"
  },
  "minorDelay": {
    "condition": "target < actual <= target + 2",
    "color": "yellow"
  },
  "significantDelay": {
    "condition": "actual > target + 2",
    "color": "red"
  },
  "aheadOfSchedule": {
    "condition": "actual < target * 0.9",
    "color": "blue"
  }
}
```


---

## API Requirements (Backend Endpoints)

### Rake Management
- `POST /api/rakes` - Create new rake POH record
- `GET /api/rakes` - Get all active rakes (with filters)
- `GET /api/rakes/:rakeId` - Get specific rake details
- `PUT /api/rakes/:rakeId` - Update rake information
- `POST /api/rakes/:rakeId/complete` - Mark rake as completed
- `GET /api/rakes/completed` - Get completed rake records

### Coach Management
- `GET /api/rakes/:rakeId/coaches` - Get all coaches for a rake
- `GET /api/coaches/:coachNumber` - Get specific coach details
- `PUT /api/coaches/:coachNumber/stage` - Update coach stage
- `POST /api/coaches/:coachNumber/notes` - Add note to coach
- `GET /api/coaches/:coachNumber/notes` - Get all notes for coach

### Parts Management
- `GET /api/coaches/:coachNumber/parts` - Get all parts for coach
- `PUT /api/coaches/:coachNumber/parts/:partId` - Update part status
- `GET /api/rakes/:rakeId/missing-parts` - Get missing parts report

### Checklist Management
- `GET /api/coaches/:coachNumber/checklist` - Get checklist for coach
- `PUT /api/coaches/:coachNumber/checklist/:itemId` - Update checklist item
- `GET /api/poh-types/:pohType/checklist` - Get standard checklist for POH type

### Testing Management
- `GET /api/coaches/:coachNumber/testing` - Get testing status
- `PUT /api/coaches/:coachNumber/testing/:testType` - Update test type status

### Bulk Operations
- `POST /api/rakes/:rakeId/bulk/stage-complete` - Bulk stage completion
- `POST /api/rakes/:rakeId/bulk/part-update` - Bulk part status update
- `POST /api/rakes/:rakeId/bulk/note` - Bulk note addition

### Analytics and Reports
- `GET /api/analytics/dashboard` - Get dashboard metrics
- `GET /api/analytics/poh-type-performance` - POH type performance report
- `GET /api/analytics/stage-performance` - Stage performance report
- `GET /api/analytics/timeline-performance` - Timeline performance report
- `GET /api/reports/missing-parts` - Missing parts report
- `GET /api/reports/delayed-coaches` - Delayed coaches report

### Configuration
- `GET /api/config/poh-types` - Get all POH type configurations
- `GET /api/config/poh-types/:pohType` - Get specific POH type config
- `GET /api/config/parts` - Get standard parts list
- `GET /api/config/timeline-thresholds` - Get timeline threshold settings

---

## Success Criteria

### Operational Success
- 100% of POH operations tracked in system (no paper records)
- 95%+ data accuracy compared to physical verification
- 80%+ of POH operations completed within target timeline
- 50% reduction in time spent on status reporting
- 30% reduction in missing parts delays through better tracking


### User Adoption
- 90%+ of Section Engineers using system daily within 3 months
- 80%+ user satisfaction score
- < 2 hours training time required per user
- < 5 support tickets per user per month after initial training

### System Performance
- 99.5% uptime during working hours
- < 2 second page load times
- Zero data loss incidents
- < 1% error rate on transactions

### Compliance
- 100% RDSO SMI checklist items tracked
- 100% mandatory items completion before stage progression
- Complete audit trail for all operations
- All must-change items documented per POH type

---

## Future Enhancements (Out of Scope for v1.0)

### Phase 2 Enhancements
- Mobile app for technicians to update status from workshop floor
- Barcode/QR code scanning for coach and part identification
- Integration with parts inventory management system
- Automated notifications via SMS/email for delays and missing parts
- Predictive analytics for delay forecasting
- Resource allocation and workforce management
- Integration with railway maintenance management system

### Phase 3 Enhancements
- AI-powered delay prediction based on historical patterns
- Automated scheduling optimization
- Integration with supplier systems for parts tracking
- Real-time IoT sensor data integration
- Advanced analytics and machine learning insights
- Multi-shed coordination and resource sharing
- Integration with financial systems for cost tracking

---

## Glossary

- **POH**: Periodic Overhaul - Scheduled comprehensive maintenance of railway rolling stock
- **EMU**: Electric Multiple Unit - Self-propelled electric train for urban/suburban service
- **MEMU**: Mainline Electric Multiple Unit - Electric train for mainline operations
- **Rake**: Complete train set consisting of multiple coaches (typically 12)
- **Coach**: Individual railway carriage, part of a rake
- **Coach Number**: Unique 6-digit identifier for each coach
- **RDSO**: Research Designs & Standards Organisation - Indian Railways standards body
- **SMI**: Standard Maintenance Instruction - RDSO-approved maintenance procedures
- **Section Engineer**: Railway maintenance supervisor responsible for POH operations
- **Shed**: Maintenance facility where POH operations are performed
- **Stage**: One of eight sequential phases in POH process
- **Must-Change Item**: Component that must be replaced during specific POH type per RDSO SMI
- **IST**: Indian Standard Time (UTC+5:30)
- **MPI**: Magnetic Particle Inspection - Non-destructive testing method
- **NDT**: Non-Destructive Testing
- **UST**: Ultrasonic Testing
- **Megger Test**: Insulation resistance testing
- **ACP**: Automatic Coupling Point
- **RMVU**: Roof Mounted Ventilation Unit
- **AHU**: Air Handling Unit
- **TCU**: Traction Control Unit
- **ACU**: Auxiliary Control Unit
- **EP Valve**: Electro-Pneumatic Valve

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 26, 2026 | System Analyst | Initial PRD creation |

---

**End of Document**
