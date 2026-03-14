import type {
  POHStage,
  POHType,
  RakeType,
  RakeStatus,
  TimelineStatus,
  PartStatus,
  ChecklistStatus,
  TestStatus,
  TestType,
  NoteType,
} from '@/types';
import { POH_STAGE_ORDER, TARGET_DURATIONS, PART_NAMES } from './constants';

// ─── Mock Data Interfaces ────────────────────────────────────────────────────

export interface MockShed {
  id: string;
  name: string;
  shedCode: string;
  railwayZone: string;
  isActive: boolean;
}

export interface MockRake {
  id: string;
  rakeNumber: string;
  rakeType: RakeType;
  pohType: POHType;
  shedId: string;
  totalCoaches: number;
  status: RakeStatus;
  intakeDate: string; // ISO string
}

export interface MockStageHistory {
  stage: POHStage;
  startDate: string;
  completionDate: string | null;
  targetDurationDays: number;
  actualDurationDays: number | null;
  timelineStatus: TimelineStatus | null;
}

export interface MockCoach {
  id: string;
  rakeId: string;
  coachNumber: string;
  currentStage: POHStage;
  stageStartDate: string;
  stageHistory: MockStageHistory[];
  timelineStatus: TimelineStatus;
  completionPercentage: number;
}

export interface MockPart {
  id: string;
  coachId: string;
  partName: (typeof PART_NAMES)[number];
  status: PartStatus;
  statusUpdatedAt: string;
  notes: string | null;
  expectedArrivalDate: string | null;
}

export interface MockChecklistItem {
  id: string;
  coachId: string;
  itemCode: string;
  description: string;
  category: string;
  rdsoSmiReference: string;
  isMandatory: boolean;
  executionOrder: number;
  status: ChecklistStatus;
  completionDate: string | null;
}

export interface MockNote {
  id: string;
  coachId: string;
  noteType: NoteType;
  content: string;
  isImportant: boolean;
  relatedStage: POHStage | null;
  relatedPart: string | null;
  createdBy: string;
  createdAt: string;
}

export interface MockTest {
  id: string;
  coachId: string;
  testType: TestType;
  status: TestStatus;
  startDate: string | null;
  completionDate: string | null;
  completedBy: string | null;
  notes: string | null;
}

// ─── Helper: date offsets ────────────────────────────────────────────────────
// Use a fixed anchor date to avoid hydration mismatches between server and client.
// The anchor is midnight UTC on the current date, computed once at module load.
const ANCHOR = new Date();
ANCHOR.setUTCHours(0, 0, 0, 0);
export const ANCHOR_MS = ANCHOR.getTime();

function daysAgo(days: number): string {
  return new Date(ANCHOR_MS - days * 86_400_000).toISOString();
}

function daysFromNow(days: number): string {
  return new Date(ANCHOR_MS + days * 86_400_000).toISOString();
}

// ─── Sheds ───────────────────────────────────────────────────────────────────

export const MOCK_SHEDS: MockShed[] = [
  {
    id: 'gzb-emu',
    name: 'EMU Car Shed Ghaziabad',
    shedCode: 'GZB-EMU',
    railwayZone: 'Northern Railway',
    isActive: true,
  },
  {
    id: 'vr-emu',
    name: 'EMU Car Shed Virar',
    shedCode: 'VR-EMU',
    railwayZone: 'Western Railway',
    isActive: true,
  },
  {
    id: 'lko-memu',
    name: 'MEMU Shed Lucknow',
    shedCode: 'LKO-MEMU',
    railwayZone: 'Northern Railway',
    isActive: true,
  },
];

// ─── Rakes ───────────────────────────────────────────────────────────────────

export const MOCK_RAKES: MockRake[] = [
  {
    id: 'rake-001',
    rakeNumber: 'GZB-EMU-2024-001',
    rakeType: 'EMU',
    pohType: '1st POH',
    shedId: 'gzb-emu',
    totalCoaches: 8,
    status: 'Active',
    intakeDate: daysAgo(5),
  },
  {
    id: 'rake-002',
    rakeNumber: 'GZB-MEMU-2024-002',
    rakeType: 'MEMU',
    pohType: '2nd POH',
    shedId: 'gzb-emu',
    totalCoaches: 12,
    status: 'Active',
    intakeDate: daysAgo(12),
  },
  {
    id: 'rake-003',
    rakeNumber: 'VR-EMU-2024-003',
    rakeType: 'EMU',
    pohType: '3rd POH',
    shedId: 'vr-emu',
    totalCoaches: 16,
    status: 'Active',
    intakeDate: daysAgo(18),
  },
  {
    id: 'rake-004',
    rakeNumber: 'VR-MEMU-2024-004',
    rakeType: 'MEMU',
    pohType: '1st POH',
    shedId: 'vr-emu',
    totalCoaches: 10,
    status: 'Active',
    intakeDate: daysAgo(2),
  },
  {
    id: 'rake-005',
    rakeNumber: 'LKO-EMU-2024-005',
    rakeType: 'EMU',
    pohType: '4th POH',
    shedId: 'lko-memu',
    totalCoaches: 6,
    status: 'Active',
    intakeDate: daysAgo(10),
  },
];


// ─── Coach generation helpers ────────────────────────────────────────────────

function buildStageHistory(
  completedStages: { stage: POHStage; actualDays: number }[],
  currentStage: POHStage,
  rakeIntakeDaysAgo: number,
): MockStageHistory[] {
  const history: MockStageHistory[] = [];
  let dayOffset = rakeIntakeDaysAgo;

  for (const { stage, actualDays } of completedStages) {
    const target = TARGET_DURATIONS[stage];
    let status: TimelineStatus = 'On Schedule';
    if (actualDays < target) status = 'Ahead of Schedule';
    else if (actualDays > target + 2) status = 'Significant Delay';
    else if (actualDays > target) status = 'Minor Delay';

    history.push({
      stage,
      startDate: daysAgo(dayOffset),
      completionDate: daysAgo(dayOffset - actualDays),
      targetDurationDays: target,
      actualDurationDays: actualDays,
      timelineStatus: status,
    });
    dayOffset -= actualDays;
  }

  // Current in-progress stage
  history.push({
    stage: currentStage,
    startDate: daysAgo(dayOffset),
    completionDate: null,
    targetDurationDays: TARGET_DURATIONS[currentStage],
    actualDurationDays: null,
    timelineStatus: null,
  });

  return history;
}

function calcCompletionPercentage(currentStage: POHStage): number {
  const idx = POH_STAGE_ORDER.indexOf(currentStage);
  return Math.round((idx / POH_STAGE_ORDER.length) * 100);
}

function calcTimelineStatus(
  currentStage: POHStage,
  stageHistory: MockStageHistory[],
): TimelineStatus {
  const current = stageHistory.find((h) => h.stage === currentStage && !h.completionDate);
  if (!current) return 'On Schedule';
  const elapsed = Math.ceil(
    (ANCHOR_MS - new Date(current.startDate).getTime()) / (1000 * 60 * 60 * 24),
  );
  const target = TARGET_DURATIONS[currentStage];
  if (elapsed < target) return 'Ahead of Schedule';
  if (elapsed <= target) return 'On Schedule';
  if (elapsed <= target + 2) return 'Minor Delay';
  return 'Significant Delay';
}

// ─── Coaches ─────────────────────────────────────────────────────────────────

function generateCoaches(): MockCoach[] {
  const coaches: MockCoach[] = [];

  // Rake 1: GZB, 8 coaches, EMU, 1st POH - mostly early stages (5 days ago)
  const rake1Stages: { stage: POHStage; completed: { stage: POHStage; actualDays: number }[] }[] = [
    { stage: 'Dismantling', completed: [{ stage: 'Intake', actualDays: 1 }] },
    { stage: 'Dismantling', completed: [{ stage: 'Intake', actualDays: 1 }] },
    { stage: 'Inspection', completed: [{ stage: 'Intake', actualDays: 1 }, { stage: 'Dismantling', actualDays: 2 }] },
    { stage: 'Intake', completed: [] },
    { stage: 'Dismantling', completed: [{ stage: 'Intake', actualDays: 1 }] },
    { stage: 'Intake', completed: [] },
    { stage: 'Dismantling', completed: [{ stage: 'Intake', actualDays: 2 }] }, // minor delay on intake
    { stage: 'Inspection', completed: [{ stage: 'Intake', actualDays: 1 }, { stage: 'Dismantling', actualDays: 2 }] },
  ];
  rake1Stages.forEach((cfg, i) => {
    const history = buildStageHistory(cfg.completed, cfg.stage, 5);
    coaches.push({
      id: `coach-r1-${i + 1}`,
      rakeId: 'rake-001',
      coachNumber: String(100001 + i),
      currentStage: cfg.stage,
      stageStartDate: history[history.length - 1].startDate,
      stageHistory: history,
      timelineStatus: calcTimelineStatus(cfg.stage, history),
      completionPercentage: calcCompletionPercentage(cfg.stage),
    });
  });

  // Rake 2: GZB, 12 coaches, MEMU, 2nd POH - mid-progress (12 days ago)
  const rake2Configs: { stage: POHStage; completed: { stage: POHStage; actualDays: number }[] }[] = [
    { stage: 'Reassembly', completed: [{ stage: 'Intake', actualDays: 1 }, { stage: 'Dismantling', actualDays: 2 }, { stage: 'Inspection', actualDays: 6 }] },
    { stage: 'Inspection', completed: [{ stage: 'Intake', actualDays: 1 }, { stage: 'Dismantling', actualDays: 3 }] }, // minor delay
    { stage: 'Reassembly', completed: [{ stage: 'Intake', actualDays: 1 }, { stage: 'Dismantling', actualDays: 2 }, { stage: 'Inspection', actualDays: 7 }] }, // minor delay
    { stage: 'Finishing', completed: [{ stage: 'Intake', actualDays: 1 }, { stage: 'Dismantling', actualDays: 2 }, { stage: 'Inspection', actualDays: 5 }, { stage: 'Reassembly', actualDays: 3 }] },
    { stage: 'Inspection', completed: [{ stage: 'Intake', actualDays: 1 }, { stage: 'Dismantling', actualDays: 2 }] },
    { stage: 'Reassembly', completed: [{ stage: 'Intake', actualDays: 1 }, { stage: 'Dismantling', actualDays: 2 }, { stage: 'Inspection', actualDays: 6 }] },
    { stage: 'Inspection', completed: [{ stage: 'Intake', actualDays: 1 }, { stage: 'Dismantling', actualDays: 4 }] }, // significant delay
    { stage: 'Dismantling', completed: [{ stage: 'Intake', actualDays: 1 }] },
    { stage: 'Reassembly', completed: [{ stage: 'Intake', actualDays: 1 }, { stage: 'Dismantling', actualDays: 2 }, { stage: 'Inspection', actualDays: 6 }] },
    { stage: 'Finishing', completed: [{ stage: 'Intake', actualDays: 1 }, { stage: 'Dismantling', actualDays: 2 }, { stage: 'Inspection', actualDays: 5 }, { stage: 'Reassembly', actualDays: 2 }] },
    { stage: 'Inspection', completed: [{ stage: 'Intake', actualDays: 1 }, { stage: 'Dismantling', actualDays: 2 }] },
    { stage: 'Reassembly', completed: [{ stage: 'Intake', actualDays: 1 }, { stage: 'Dismantling', actualDays: 2 }, { stage: 'Inspection', actualDays: 6 }] },
  ];
  rake2Configs.forEach((cfg, i) => {
    const history = buildStageHistory(cfg.completed, cfg.stage, 12);
    coaches.push({
      id: `coach-r2-${i + 1}`,
      rakeId: 'rake-002',
      coachNumber: String(200001 + i),
      currentStage: cfg.stage,
      stageStartDate: history[history.length - 1].startDate,
      stageHistory: history,
      timelineStatus: calcTimelineStatus(cfg.stage, history),
      completionPercentage: calcCompletionPercentage(cfg.stage),
    });
  });

  // Rake 3: VR, 16 coaches, EMU, 3rd POH - near completion (18 days ago)
  const lateStages: POHStage[] = [
    'Testing', 'Trial', 'Release', 'Testing', 'Finishing', 'Testing',
    'Trial', 'Testing', 'Finishing', 'Testing', 'Trial', 'Release',
    'Testing', 'Trial', 'Finishing', 'Testing',
  ];
  const baseCompleted: { stage: POHStage; actualDays: number }[] = [
    { stage: 'Intake', actualDays: 1 },
    { stage: 'Dismantling', actualDays: 2 },
    { stage: 'Inspection', actualDays: 5 },
    { stage: 'Reassembly', actualDays: 3 },
  ];
  lateStages.forEach((stage, i) => {
    const completed = [...baseCompleted];
    if (POH_STAGE_ORDER.indexOf(stage) > 4) {
      completed.push({ stage: 'Finishing', actualDays: 2 });
    }
    if (POH_STAGE_ORDER.indexOf(stage) > 5) {
      completed.push({ stage: 'Testing', actualDays: 3 });
    }
    if (POH_STAGE_ORDER.indexOf(stage) > 6) {
      completed.push({ stage: 'Trial', actualDays: 2 });
    }
    const history = buildStageHistory(completed, stage, 18);
    coaches.push({
      id: `coach-r3-${i + 1}`,
      rakeId: 'rake-003',
      coachNumber: String(300001 + i),
      currentStage: stage,
      stageStartDate: history[history.length - 1].startDate,
      stageHistory: history,
      timelineStatus: calcTimelineStatus(stage, history),
      completionPercentage: calcCompletionPercentage(stage),
    });
  });

  // Rake 4: VR, 10 coaches, MEMU, 1st POH - just started (2 days ago)
  for (let i = 0; i < 10; i++) {
    const isIntake = i < 6;
    const completed = isIntake ? [] : [{ stage: 'Intake' as POHStage, actualDays: 1 }];
    const stage: POHStage = isIntake ? 'Intake' : 'Dismantling';
    const history = buildStageHistory(completed, stage, 2);
    coaches.push({
      id: `coach-r4-${i + 1}`,
      rakeId: 'rake-004',
      coachNumber: String(400001 + i),
      currentStage: stage,
      stageStartDate: history[history.length - 1].startDate,
      stageHistory: history,
      timelineStatus: calcTimelineStatus(stage, history),
      completionPercentage: calcCompletionPercentage(stage),
    });
  }

  // Rake 5: LKO, 6 coaches, EMU, 4th POH - mixed progress (10 days ago)
  const rake5Configs: { stage: POHStage; completed: { stage: POHStage; actualDays: number }[] }[] = [
    { stage: 'Finishing', completed: [{ stage: 'Intake', actualDays: 1 }, { stage: 'Dismantling', actualDays: 2 }, { stage: 'Inspection', actualDays: 5 }, { stage: 'Reassembly', actualDays: 2 }] },
    { stage: 'Inspection', completed: [{ stage: 'Intake', actualDays: 1 }, { stage: 'Dismantling', actualDays: 2 }] },
    { stage: 'Reassembly', completed: [{ stage: 'Intake', actualDays: 1 }, { stage: 'Dismantling', actualDays: 2 }, { stage: 'Inspection', actualDays: 6 }] },
    { stage: 'Dismantling', completed: [{ stage: 'Intake', actualDays: 2 }] }, // minor delay
    { stage: 'Testing', completed: [{ stage: 'Intake', actualDays: 1 }, { stage: 'Dismantling', actualDays: 2 }, { stage: 'Inspection', actualDays: 4 }, { stage: 'Reassembly', actualDays: 2 }, { stage: 'Finishing', actualDays: 1 }] },
    { stage: 'Inspection', completed: [{ stage: 'Intake', actualDays: 1 }, { stage: 'Dismantling', actualDays: 5 }] }, // significant delay
  ];
  rake5Configs.forEach((cfg, i) => {
    const history = buildStageHistory(cfg.completed, cfg.stage, 10);
    coaches.push({
      id: `coach-r5-${i + 1}`,
      rakeId: 'rake-005',
      coachNumber: String(500001 + i),
      currentStage: cfg.stage,
      stageStartDate: history[history.length - 1].startDate,
      stageHistory: history,
      timelineStatus: calcTimelineStatus(cfg.stage, history),
      completionPercentage: calcCompletionPercentage(cfg.stage),
    });
  });

  return coaches;
}

export const MOCK_COACHES: MockCoach[] = generateCoaches();


// ─── Parts ───────────────────────────────────────────────────────────────────

function generateParts(): MockPart[] {
  const parts: MockPart[] = [];
  const stageToPartStatus: Record<POHStage, PartStatus[]> = {
    Intake: ['Not Started'],
    Dismantling: ['Not Started', 'Dismantled'],
    Inspection: ['Dismantled', 'Under Inspection'],
    Reassembly: ['Under Inspection', 'Overhauled/Repaired', 'Reassembled'],
    Finishing: ['Reassembled', 'Overhauled/Repaired'],
    Testing: ['Reassembled', 'Tested'],
    Trial: ['Tested', 'Reassembled'],
    Release: ['Tested'],
  };

  for (const coach of MOCK_COACHES) {
    const possibleStatuses = stageToPartStatus[coach.currentStage];
    PART_NAMES.forEach((partName, pi) => {
      let status: PartStatus = possibleStatuses[pi % possibleStatuses.length];
      let notes: string | null = null;
      let expectedArrivalDate: string | null = null;

      // Add some Missing/Pending parts for realism
      const isMissing =
        (coach.id === 'coach-r2-3' && partName === 'Pantograph') ||
        (coach.id === 'coach-r2-7' && partName === 'Brake System') ||
        (coach.id === 'coach-r5-4' && partName === 'Traction Motor') ||
        (coach.id === 'coach-r3-5' && partName === 'Suspension System') ||
        (coach.id === 'coach-r1-7' && partName === 'Couplers');

      if (isMissing) {
        status = 'Missing/Pending';
        notes = `${partName} awaiting procurement from central stores`;
        expectedArrivalDate = daysFromNow(Math.floor(Math.random() * 5) + 2);
      }

      parts.push({
        id: `part-${coach.id}-${pi + 1}`,
        coachId: coach.id,
        partName,
        status,
        statusUpdatedAt: daysAgo(Math.floor(Math.random() * 3)),
        notes,
        expectedArrivalDate,
      });
    });
  }

  return parts;
}

export const MOCK_PARTS: MockPart[] = generateParts();

// ─── Checklist Items ─────────────────────────────────────────────────────────

const SAMPLE_CHECKLIST_TEMPLATES: Omit<MockChecklistItem, 'id' | 'coachId' | 'status' | 'completionDate'>[] = [
  { itemCode: 'chk-1-001', description: 'Bogie frame inspection and crack detection (NDT)', category: 'Bogie & Suspension', rdsoSmiReference: 'Section 4.1.1', isMandatory: true, executionOrder: 1 },
  { itemCode: 'chk-1-002', description: 'Primary suspension springs examination and replacement', category: 'Bogie & Suspension', rdsoSmiReference: 'Section 4.1.2', isMandatory: true, executionOrder: 2 },
  { itemCode: 'chk-1-003', description: 'Axle box bearing examination and lubrication', category: 'Bogie & Suspension', rdsoSmiReference: 'Section 4.1.4', isMandatory: true, executionOrder: 3 },
  { itemCode: 'chk-1-004', description: 'Wheel profile measurement and re-profiling if required', category: 'Wheels & Axles', rdsoSmiReference: 'Section 4.2.1', isMandatory: true, executionOrder: 4 },
  { itemCode: 'chk-1-005', description: 'Axle ultrasonic testing (UST) for cracks', category: 'Wheels & Axles', rdsoSmiReference: 'Section 4.2.2', isMandatory: true, executionOrder: 5 },
  { itemCode: 'chk-1-006', description: 'Traction motor dismantling and complete inspection', category: 'Traction Motor', rdsoSmiReference: 'Section 5.1.1', isMandatory: true, executionOrder: 6 },
  { itemCode: 'chk-1-007', description: 'Armature and field coil insulation resistance test', category: 'Traction Motor', rdsoSmiReference: 'Section 5.1.2', isMandatory: true, executionOrder: 7 },
  { itemCode: 'chk-1-008', description: 'Brake cylinder overhaul and seal replacement', category: 'Brake System', rdsoSmiReference: 'Section 6.1.1', isMandatory: true, executionOrder: 8 },
  { itemCode: 'chk-1-009', description: 'Distributor valve (DV) overhaul and testing', category: 'Brake System', rdsoSmiReference: 'Section 6.1.2', isMandatory: true, executionOrder: 9 },
  { itemCode: 'chk-1-010', description: 'Brake block examination and replacement (MUST CHANGE)', category: 'Brake System', rdsoSmiReference: 'Section 6.1.4', isMandatory: true, executionOrder: 10 },
  { itemCode: 'chk-1-011', description: 'Pantograph carbon strip inspection', category: 'Pantograph', rdsoSmiReference: 'Section 7.1.1', isMandatory: false, executionOrder: 11 },
  { itemCode: 'chk-1-012', description: 'Coupler alignment and wear check', category: 'Couplers', rdsoSmiReference: 'Section 8.1.1', isMandatory: false, executionOrder: 12 },
  { itemCode: 'chk-1-013', description: 'Electrical insulation resistance test (Megger test)', category: 'Final Testing', rdsoSmiReference: 'Section 11.1.1', isMandatory: true, executionOrder: 13 },
  { itemCode: 'chk-1-014', description: 'Brake power test and brake percentage calculation', category: 'Final Testing', rdsoSmiReference: 'Section 11.1.2', isMandatory: true, executionOrder: 14 },
  { itemCode: 'chk-1-015', description: 'Trial run on test track (minimum 50 km)', category: 'Final Testing', rdsoSmiReference: 'Section 11.1.3', isMandatory: true, executionOrder: 15 },
];

function generateChecklistItems(): MockChecklistItem[] {
  const items: MockChecklistItem[] = [];

  for (const coach of MOCK_COACHES) {
    const stageIdx = POH_STAGE_ORDER.indexOf(coach.currentStage);
    SAMPLE_CHECKLIST_TEMPLATES.forEach((template, ti) => {
      // Determine status based on coach progress
      let status: ChecklistStatus = 'Not Started';
      let completionDate: string | null = null;

      if (stageIdx >= 5) {
        // Testing or later: most items completed
        status = ti < 12 ? 'Completed' : (ti < 13 ? 'In Progress' : 'Not Started');
      } else if (stageIdx >= 3) {
        // Reassembly/Finishing: some items done
        status = ti < 8 ? 'Completed' : (ti < 10 ? 'In Progress' : 'Not Started');
      } else if (stageIdx >= 1) {
        // Dismantling/Inspection: early items
        status = ti < 4 ? 'Completed' : (ti < 6 ? 'In Progress' : 'Not Started');
      }

      if (status === 'Completed') {
        completionDate = daysAgo(Math.floor(Math.random() * 5) + 1);
      }

      items.push({
        id: `chk-${coach.id}-${ti + 1}`,
        coachId: coach.id,
        ...template,
        status,
        completionDate,
      });
    });
  }

  return items;
}

export const MOCK_CHECKLIST_ITEMS: MockChecklistItem[] = generateChecklistItems();


// ─── Notes ───────────────────────────────────────────────────────────────────

export const MOCK_NOTES: MockNote[] = [
  {
    id: 'note-001',
    coachId: 'coach-r2-3',
    noteType: 'Part-Specific',
    content: 'Pantograph carbon strip severely worn. Replacement ordered from central stores.',
    isImportant: true,
    relatedStage: null,
    relatedPart: 'Pantograph',
    createdBy: 'Rajesh Kumar',
    createdAt: daysAgo(3),
  },
  {
    id: 'note-002',
    coachId: 'coach-r2-7',
    noteType: 'Stage-Specific',
    content: 'Dismantling delayed due to corroded bolts on underframe. Extra time needed for safe removal.',
    isImportant: true,
    relatedStage: 'Dismantling',
    relatedPart: null,
    createdBy: 'Suresh Patel',
    createdAt: daysAgo(8),
  },
  {
    id: 'note-003',
    coachId: 'coach-r1-3',
    noteType: 'General',
    content: 'Coach in good overall condition. Minor surface rust on body shell noted.',
    isImportant: false,
    relatedStage: null,
    relatedPart: null,
    createdBy: 'Amit Singh',
    createdAt: daysAgo(4),
  },
  {
    id: 'note-004',
    coachId: 'coach-r5-6',
    noteType: 'Stage-Specific',
    content: 'Significant corrosion found during dismantling. Body shell requires additional repair work.',
    isImportant: true,
    relatedStage: 'Dismantling',
    relatedPart: null,
    createdBy: 'Vikram Sharma',
    createdAt: daysAgo(6),
  },
  {
    id: 'note-005',
    coachId: 'coach-r3-1',
    noteType: 'General',
    content: 'All electrical tests passed on first attempt. Coach ready for trial run.',
    isImportant: false,
    relatedStage: null,
    relatedPart: null,
    createdBy: 'Priya Verma',
    createdAt: daysAgo(1),
  },
  {
    id: 'note-006',
    coachId: 'coach-r5-4',
    noteType: 'Part-Specific',
    content: 'Traction motor bearing replacement pending. Part expected from Chittaranjan workshop.',
    isImportant: true,
    relatedStage: null,
    relatedPart: 'Traction Motor',
    createdBy: 'Rajesh Kumar',
    createdAt: daysAgo(5),
  },
];

// ─── Tests ───────────────────────────────────────────────────────────────────

function generateTests(): MockTest[] {
  const tests: MockTest[] = [];
  const testTypes: TestType[] = ['Electrical', 'Mechanical', 'Pneumatic'];

  for (const coach of MOCK_COACHES) {
    if (POH_STAGE_ORDER.indexOf(coach.currentStage) < 5) continue; // Only Testing stage and beyond

    testTypes.forEach((testType, ti) => {
      let status: TestStatus = 'Not Started';
      let startDate: string | null = null;
      let completionDate: string | null = null;
      let completedBy: string | null = null;
      let notes: string | null = null;

      if (coach.currentStage === 'Testing') {
        // Varied test progress
        if (ti === 0) {
          status = 'Completed';
          startDate = daysAgo(2);
          completionDate = daysAgo(1);
          completedBy = 'Priya Verma';
          notes = 'All insulation resistance values within limits';
        } else if (ti === 1) {
          status = 'In Progress';
          startDate = daysAgo(1);
          notes = 'Structural integrity check ongoing';
        }
        // Pneumatic stays Not Started
      } else if (POH_STAGE_ORDER.indexOf(coach.currentStage) > 5) {
        // Trial or Release: all tests completed
        status = 'Completed';
        startDate = daysAgo(5);
        completionDate = daysAgo(3);
        completedBy = ti === 0 ? 'Priya Verma' : ti === 1 ? 'Amit Singh' : 'Suresh Patel';
        notes = 'Test completed successfully';
      }

      tests.push({
        id: `test-${coach.id}-${testType.toLowerCase()}`,
        coachId: coach.id,
        testType,
        status,
        startDate,
        completionDate,
        completedBy,
        notes,
      });
    });
  }

  return tests;
}

export const MOCK_TESTS: MockTest[] = generateTests();

// ─── Query Helper Functions ──────────────────────────────────────────────────

export function getMockSheds(): MockShed[] {
  return MOCK_SHEDS;
}

export function getMockShed(shedId: string): MockShed | undefined {
  return MOCK_SHEDS.find((s) => s.id === shedId);
}

export function getMockRakes(shedId?: string): MockRake[] {
  if (!shedId || shedId === 'all') return MOCK_RAKES;
  return MOCK_RAKES.filter((r) => r.shedId === shedId);
}

export function getMockRake(rakeId: string): MockRake | undefined {
  return MOCK_RAKES.find((r) => r.id === rakeId);
}

export function getMockCoaches(rakeId: string): MockCoach[] {
  return MOCK_COACHES.filter((c) => c.rakeId === rakeId);
}

export function getMockCoach(coachId: string): MockCoach | undefined {
  return MOCK_COACHES.find((c) => c.id === coachId);
}

export function getMockParts(coachId: string): MockPart[] {
  return MOCK_PARTS.filter((p) => p.coachId === coachId);
}

export function getMockMissingParts(shedId?: string): MockPart[] {
  const rakeIds = shedId && shedId !== 'all'
    ? MOCK_RAKES.filter((r) => r.shedId === shedId).map((r) => r.id)
    : MOCK_RAKES.map((r) => r.id);
  const coachIds = MOCK_COACHES.filter((c) => rakeIds.includes(c.rakeId)).map((c) => c.id);
  return MOCK_PARTS.filter((p) => coachIds.includes(p.coachId) && p.status === 'Missing/Pending');
}

export function getMockChecklistItems(coachId: string): MockChecklistItem[] {
  return MOCK_CHECKLIST_ITEMS.filter((item) => item.coachId === coachId);
}

export function getMockNotes(coachId: string): MockNote[] {
  return MOCK_NOTES.filter((n) => n.coachId === coachId);
}

export function getMockTests(coachId: string): MockTest[] {
  return MOCK_TESTS.filter((t) => t.coachId === coachId);
}

/** Get count of delayed coaches for a rake */
export function getDelayedCoachCount(rakeId: string): number {
  return MOCK_COACHES.filter(
    (c) => c.rakeId === rakeId && (c.timelineStatus === 'Minor Delay' || c.timelineStatus === 'Significant Delay'),
  ).length;
}

/** Get count of coaches with missing parts for a rake */
export function getMissingPartsCoachCount(rakeId: string): number {
  const coachIds = MOCK_COACHES.filter((c) => c.rakeId === rakeId).map((c) => c.id);
  const coachesWithMissing = new Set(
    MOCK_PARTS.filter((p) => coachIds.includes(p.coachId) && p.status === 'Missing/Pending').map((p) => p.coachId),
  );
  return coachesWithMissing.size;
}

/** Get checklist completion percentage for a coach */
export function getChecklistCompletion(coachId: string): number {
  const items = getMockChecklistItems(coachId);
  if (items.length === 0) return 0;
  const completed = items.filter((i) => i.status === 'Completed').length;
  return Math.round((completed / items.length) * 100);
}

/** Get the earliest stage among all coaches in a rake (rake-level stage) */
export function getRakeCurrentStage(rakeId: string): POHStage {
  const coaches = getMockCoaches(rakeId);
  if (coaches.length === 0) return 'Intake';
  let earliest = POH_STAGE_ORDER.length - 1;
  for (const coach of coaches) {
    const idx = POH_STAGE_ORDER.indexOf(coach.currentStage);
    if (idx < earliest) earliest = idx;
  }
  return POH_STAGE_ORDER[earliest];
}

// ─── Rake Registration (mock in-memory) ──────────────────────────────────────

let _nextRakeId = 100;

export interface RegisterRakeInput {
  rakeNumber: string;
  rakeType: RakeType;
  pohType: POHType;
  shedId: string;
  coachNumbers: string[];
}

export function registerMockRake(input: RegisterRakeInput): MockRake {
  const rakeId = `rake-reg-${++_nextRakeId}`;
  const now = new Date().toISOString();

  const rake: MockRake = {
    id: rakeId,
    rakeNumber: input.rakeNumber,
    rakeType: input.rakeType,
    pohType: input.pohType,
    shedId: input.shedId,
    totalCoaches: input.coachNumbers.length,
    status: 'Active',
    intakeDate: now,
  };
  MOCK_RAKES.push(rake);

  // Create coaches — all start at Intake
  for (let i = 0; i < input.coachNumbers.length; i++) {
    const coachId = `${rakeId}-coach-${i + 1}`;
    const history: MockStageHistory[] = [
      {
        stage: 'Intake',
        startDate: now,
        completionDate: null,
        targetDurationDays: TARGET_DURATIONS['Intake'],
        actualDurationDays: null,
        timelineStatus: null,
      },
    ];
    MOCK_COACHES.push({
      id: coachId,
      rakeId,
      coachNumber: input.coachNumbers[i],
      currentStage: 'Intake',
      stageStartDate: now,
      stageHistory: history,
      timelineStatus: 'On Schedule',
      completionPercentage: 0,
    });

    // Create parts for each coach
    PART_NAMES.forEach((partName, pi) => {
      MOCK_PARTS.push({
        id: `part-${coachId}-${pi + 1}`,
        coachId,
        partName,
        status: 'Not Started',
        statusUpdatedAt: now,
        notes: null,
        expectedArrivalDate: null,
      });
    });
  }

  return rake;
}
