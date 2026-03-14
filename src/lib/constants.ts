import type { POHStage, SectionName, SectionCode, CoachType } from '@/types';

/** Ordered array of all 8 POH stages */
export const POH_STAGE_ORDER: POHStage[] = [
  'Intake',
  'Dismantling',
  'Inspection',
  'Reassembly',
  'Finishing',
  'Testing',
  'Trial',
  'Release',
];

/** The 10 fixed POH workshop sections */
export const POH_SECTIONS = [
  'E2', 'E3', 'E5', 'M2', 'M3', 'M5', 'M6', 'Painting', 'M8', 'M4',
] as const;

/** Valid rake type options (user-facing labels) */
export const RAKE_TYPES = ['3-Phase Rake', 'Conventional Rake'] as const;

/** Valid rake category options */
export const RAKE_CATEGORIES = ['EMU', 'MEMU'] as const;

/** Valid coach type options */
export const COACH_TYPES = ['MC', 'TC'] as const;

/**
 * Compute the expected MC/TC split for a given rake category and total coaches.
 *
 * EMU ratio: 1 MC per 2 TC  (e.g. 12-car → 4 MC + 8 TC)
 * MEMU ratio: 1 MC per 3 TC (e.g. 12-car → 3 MC + 9 TC)
 *
 * Returns an array of 'MC'/'TC' strings with MCs first, then TCs.
 */
export function getCoachTypeSplit(
  rakeCategory: 'EMU' | 'MEMU',
  totalCoaches: number,
): ('MC' | 'TC')[] {
  const groupSize = rakeCategory === 'EMU' ? 3 : 4; // 1 MC + 2 TC = 3, or 1 MC + 3 TC = 4
  const mcCount = Math.floor(totalCoaches / groupSize);
  const tcCount = totalCoaches - mcCount;
  return [
    ...Array.from<'MC'>({ length: mcCount }).fill('MC'),
    ...Array.from<'TC'>({ length: tcCount }).fill('TC'),
  ];
}


/** Target duration in days for each POH stage (total: 20 days) */
export const TARGET_DURATIONS: Record<POHStage, number> = {
  Intake: 1,
  Dismantling: 2,
  Inspection: 6,
  Reassembly: 3,
  Finishing: 2,
  Testing: 3,
  Trial: 2,
  Release: 1,
};

/** Total target POH duration in days */
export const TOTAL_TARGET_DURATION = 20;

/** Standard 9 major parts tracked per coach */
export const PART_NAMES = [
  'Motor Bogie',
  'Trailer Bogie',
  'Traction Motor',
  'Brake System',
  'Electrical System',
  'Pantograph',
  'Couplers',
  'Suspension System',
  'Body Shell',
] as const;

/** Delay threshold configuration (days over target) */
export const DELAY_THRESHOLDS = {
  /** 1-2 days over target = minor delay */
  minor: { min: 1, max: 2 },
  /** >2 days over target = significant delay */
  significant: { min: 3 },
} as const;

/** Main sections in a shed */
export const MAIN_SECTIONS = [
  'Electrical',
  'Mechanical',
  'Pneumatic',
  'Bogey',
  'Tool Room',
] as const;

/** Sub-sections that can be assigned to users within any section */
export const SUB_SECTIONS = [
  'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10',
  'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9', 'M10',
] as const;

/** All assignable section names (kept for backward compat) */
export const SECTION_NAMES: readonly string[] = [
  ...MAIN_SECTIONS,
  ...SUB_SECTIONS,
] as const;

// ============================================
// Job Card Section Analysis Constants
// ============================================

// Section codes in display order (M2→E5)
export const SECTION_CODES: SectionCode[] = ['M2', 'M3', 'M4', 'M5', 'M6', 'M8', 'Painting', 'E2', 'E3', 'E5'];

// PDF section order (same as display order)
export const PDF_SECTION_ORDER: SectionCode[] = ['M2', 'M3', 'M4', 'M5', 'M6', 'M8', 'Painting', 'E2', 'E3', 'E5'];

// Section display order mapping
export const SECTION_DISPLAY_ORDER: Record<SectionCode, number> = {
  M2: 1, M3: 2, M4: 3, M5: 4, M6: 5, M8: 6, Painting: 7, E2: 8, E3: 9, E5: 10,
};

// Section ↔ Coach Type Applicability Matrix
export const SECTION_COACH_TYPE_APPLICABILITY: Record<SectionCode, CoachType[]> = {
  M2: ['MC', 'TC', 'DTC', 'DMC', 'NDTC'],
  M3: ['MC', 'TC', 'DTC', 'DMC', 'NDTC'],
  M4: ['MC', 'TC', 'DTC', 'DMC', 'NDTC'],
  M5: ['MC', 'TC', 'DTC', 'DMC', 'NDTC'],
  M6: ['MC', 'TC', 'DTC', 'DMC', 'NDTC'],
  M8: ['MC'],
  Painting: ['MC', 'TC', 'DTC', 'DMC', 'NDTC'],
  E2: ['MC', 'TC', 'DTC', 'DMC'],
  E3: ['MC', 'DMC'],
  E5: ['MC', 'TC', 'DTC', 'DMC', 'NDTC'],
};

// Section color coding based on progress state
export function getSectionColor(progressPct: number, totalWorkItems: number, allCompleted: boolean): string {
  if (allCompleted) return 'green';
  if (totalWorkItems === 0 || progressPct === 0) return 'grey';
  if (progressPct <= 50) return 'yellow';
  return 'blue';
}

// Check if a section is applicable to a coach type
export function isSectionApplicable(sectionCode: SectionCode, coachType: CoachType): boolean {
  return SECTION_COACH_TYPE_APPLICABILITY[sectionCode]?.includes(coachType) ?? false;
}
