// Core POH Stage Types
export type POHStage =
  | 'Intake'
  | 'Dismantling'
  | 'Inspection'
  | 'Reassembly'
  | 'Finishing'
  | 'Testing'
  | 'Trial'
  | 'Release';

export type POHType = '1st POH' | '2nd POH' | '3rd POH' | '4th POH';

export type RakeType = 'EMU' | 'MEMU' | '3-Phase Rake' | 'Conventional Rake';

export type RakeCategory = 'EMU' | 'MEMU';

export type CoachType = 'MC' | 'TC' | 'DTC' | 'DMC' | 'NDTC';

export type POHSection = 'E2' | 'E3' | 'E5' | 'M2' | 'M3' | 'M5' | 'M6' | 'Painting' | 'M8' | 'M4';

export type SectionWorkStatus = 'Not Started' | 'In Progress' | 'Completed';

export type RakeStatus = 'Active' | 'Completed';

export type TimelineStatus =
  | 'On Schedule'
  | 'Minor Delay'
  | 'Significant Delay'
  | 'Ahead of Schedule';

export type PartStatus =
  | 'Not Started'
  | 'Dismantled'
  | 'Under Inspection'
  | 'Overhauled/Repaired'
  | 'Reassembled'
  | 'Tested'
  | 'Missing/Pending';

export type ChecklistStatus = 'Not Started' | 'In Progress' | 'Completed';

export type TestStatus = 'Not Started' | 'In Progress' | 'Completed';

export type TestType = 'Electrical' | 'Mechanical' | 'Pneumatic';

export type NoteType = 'General' | 'Stage-Specific' | 'Part-Specific';

export type UserRole = 'Admin' | 'Senior_Section_Engineer' | 'Junior_Engineer' | 'Technician' | 'Viewer';

export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Section Names for POH functional areas
// Main sections: Electrical, Mechanical, Pneumatic, Bogey, Tool Room
// Sub-sections: E1-E10, M1-M10
export type SectionName = string;

// Coach Section Status - tracks per-coach, per-section work status
export interface CoachSectionStatus {
  id?: string;
  coach_id: string;
  section_name: POHSection;
  status: SectionWorkStatus;
  started_at: string | null;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
}

// Section In-Charge Assignment - links SSE users to specific POH sections within a shed
export interface SectionInChargeAssignment {
  id?: string;
  user_id: string;
  shed_id: string;
  section_name: POHSection;
}

// Admin User Management Types
export interface UserRecord {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  shed_assignments: { shed_id: string; shed_name: string }[];
  section_assignments: { shed_id: string; section_name: string; sub_section?: string }[];
}

export interface CreateUserInput {
  email: string;
  full_name: string;
  role: UserRole;
  shed_ids: string[];
  section_assignments: { shed_id: string; section_name: string; sub_section?: string }[];
}

export interface UpdateUserInput {
  user_id: string;
  full_name: string;
  role: UserRole;
  shed_ids: string[];
  section_assignments: { shed_id: string; section_name: string; sub_section?: string }[];
}

// Notification Types
export type NotificationType =
  | 'stage_completion'
  | 'significant_delay'
  | 'missing_part_overdue'
  | 'testing_complete'
  | 'general';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  related_entity_type: string | null;
  related_entity_id: string | null;
  shed_id: string | null;
  created_at: string;
}

export interface NotificationPreferences {
  stage_completion: boolean;
  significant_delay: boolean;
  missing_parts: boolean;
  testing_complete: boolean;
}

// ============================================
// Job Card Section Analysis Types
// ============================================

export type SectionCode = 'M5' | 'M6' | 'M8' | 'E2' | 'E3' | 'E5' | 'M2' | 'M3' | 'Painting' | 'M4';
export type SectionType = 'standard' | 'placeholder' | 'coordination';
export type WorkItemStatus = 'Not Started' | 'In Progress' | 'Completed';
export type SectionTestStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Failed';
export type M4ActivityType = 'Lifting' | 'Lowering' | 'Shifting' | 'Crane Operation' | 'Other';

export interface WorkshopSection {
  id: string;
  sectionCode: SectionCode;
  nameHindi: string;
  nameEnglish: string;
  description: string;
  sectionType: SectionType;
  displayOrder: number;
}

export interface SectionProgressSummary {
  sectionCode: SectionCode;
  nameHindi: string;
  nameEnglish: string;
  sectionType: SectionType;
  progressPct: number;
  totalWorkItems: number;
  completedWorkItems: number;
  mustChangeTotal: number;
  mustChangeReplaced: number;
  testsTotal: number;
  testsPassed: number;
  testsFailed: number;
  isApplicable: boolean;
}

export interface SectionDashboardData {
  coachId: string;
  coachNumber: string;
  coachType: CoachType;
  rakeType: string;
  pohCycle: string;
  sections: SectionProgressSummary[];
  aggregateCompletionPct: number;
}

export interface SectionAnalysisData {
  rakeId: string;
  rakeNumber: string;
  coaches: {
    coachId: string;
    coachNumber: string;
    coachType: CoachType;
    sections: Record<SectionCode, { progressPct: number; isApplicable: boolean }>;
  }[];
  averages: Record<SectionCode, number>;
}

export interface SectionWorkItem {
  id: string;
  coachId: string;
  sectionId: string;
  wiId: string;
  wiNumber: string;
  versionNumber: string;
  rakeType: string;
  status: WorkItemStatus;
  completionDate: string | null;
  completedBy: string | null;
  notes: string | null;
}

export interface MustChangeItemInstance {
  id: string;
  coachId: string;
  templateId: string;
  sectionId: string;
  itemName: string;
  description: string | null;
  isReplaced: boolean;
  oldPartDetail: string | null;
  newPartDetail: string | null;
  replacedAt: string | null;
  replacedBy: string | null;
}

export interface SectionTestInstance {
  id: string;
  coachId: string;
  templateId: string;
  sectionId: string;
  testName: string;
  testDescription: string | null;
  status: SectionTestStatus;
  measuredValues: string | null;
  passed: boolean | null;
  testedAt: string | null;
  testedBy: string | null;
  notes: string | null;
}

export interface M4CoordinationEntry {
  id: string;
  coachId: string;
  sectionId: string;
  supportedSectionId: string;
  supportedSectionCode: string;
  activityType: M4ActivityType;
  status: 'Pending' | 'In Progress' | 'Completed';
  notes: string | null;
  loggedBy: string | null;
  createdAt: string;
}

export interface TestResultInput {
  measuredValues: string;
  passed: boolean;
  notes?: string;
}

export interface M4CoordinationInput {
  coachId: string;
  activityType: M4ActivityType;
  supportedSection: string;
  notes?: string;
}

export interface SectionDetailData {
  sectionCode: SectionCode;
  nameHindi: string;
  nameEnglish: string;
  sectionType: SectionType;
  pohCycle: string;
  isEditable: boolean;
  workItems: SectionWorkItem[];
  mustChangeItems: MustChangeItemInstance[];
  tests: SectionTestInstance[];
  m4Entries?: M4CoordinationEntry[];
}
