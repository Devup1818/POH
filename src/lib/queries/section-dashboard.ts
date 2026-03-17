'use server';

import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/supabase/dev-session';
import type { SectionDashboardData, SectionProgressSummary, CoachType, SectionCode } from '@/types';
import { SECTION_COACH_TYPE_APPLICABILITY } from '@/lib/constants';

export async function getCoachSectionDashboard(coachId: string): Promise<SectionDashboardData | null> {
  const supabase = await createClient();

  // Get coach + rake metadata — try with coach_type first, fall back without it
  let coach: any = null;
  const { data: coachData, error: coachError } = await supabase
    .from('coaches')
    .select('id, coach_number, coach_type, rake_id, rakes(rake_number, rake_type, poh_type)')
    .eq('id', coachId)
    .single();

  if (!coachError && coachData) {
    coach = coachData;
  } else {
    // Fallback: coach_type column might not exist (pre-migration 010)
    const { data: fallback } = await supabase
      .from('coaches')
      .select('id, coach_number, rake_id, rakes(rake_number, rake_type, poh_type)')
      .eq('id', coachId)
      .single();
    if (fallback) {
      coach = { ...fallback, coach_type: 'MC' };
    }
  }

  if (!coach) return null;

  const coachType = (coach.coach_type ?? 'MC') as CoachType;
  const rake = coach.rakes;
  const rakeType = rake?.rake_type ?? 'Conventional Rake';
  const pohCycle = rake?.poh_type ?? '1st POH';

  // Get section progress from view (may not exist if migration 011 not applied)
  let progressData: any[] = [];
  try {
    const { data } = await supabase
      .from('v_coach_section_progress')
      .select('*')
      .eq('coach_id', coachId);
    progressData = data ?? [];
  } catch {
    // View doesn't exist yet — continue with empty progress
  }

  // Get all workshop sections (may not exist if migration 011 not applied)
  let allSections: any[] = [];
  try {
    const { data, error } = await supabase
      .from('workshop_sections')
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    if (!error && data) {
      allSections = data;
    }
  } catch {
    // Table doesn't exist yet
  }

  // If workshop_sections table doesn't exist or is empty, build from constants
  if (allSections.length === 0) {
    const { SECTION_CODES, SECTION_DISPLAY_ORDER } = await import('@/lib/constants');
    const sectionNames: Record<string, { hindi: string; english: string; type: string }> = {
      M2: { hindi: 'Furnishing & Body Section', english: 'Furnishing & Body Section', type: 'standard' },
      M3: { hindi: 'Pantograph & Speedometer Section', english: 'Pantograph & Speedometer Section', type: 'standard' },
      M4: { hindi: 'M&P / Machinery Section', english: 'M&P / Machinery Section', type: 'coordination' },
      M5: { hindi: 'Brake/Pneumatic Section', english: 'Brake/Pneumatic Section', type: 'standard' },
      M6: { hindi: 'Bogie & Mechanical Section', english: 'Bogie & Mechanical Section', type: 'standard' },
      M8: { hindi: 'Compressor Section', english: 'Compressor Section', type: 'standard' },
      Painting: { hindi: 'Painting Section', english: 'Painting Section', type: 'placeholder' },
      E2: { hindi: 'HT Electrical Section', english: 'HT Electrical Section', type: 'standard' },
      E3: { hindi: 'Traction Motor Section', english: 'Traction Motor Section', type: 'standard' },
      E5: { hindi: 'Train Lighting & LT Electrical Section', english: 'Train Lighting & LT Electrical Section', type: 'standard' },
    };
    allSections = SECTION_CODES.map((code) => ({
      section_code: code,
      name_hindi: sectionNames[code]?.hindi ?? code,
      name_english: sectionNames[code]?.english ?? code,
      section_type: sectionNames[code]?.type ?? 'standard',
      display_order: SECTION_DISPLAY_ORDER[code] ?? 99,
    }));
  }

  // Build sections array
  const progressMap = new Map(
    progressData.map((p: any) => [p.section_code, p])
  );

  const sections: SectionProgressSummary[] = allSections.map((ws: any) => {
    const progress = progressMap.get(ws.section_code);
    const isApplicable = SECTION_COACH_TYPE_APPLICABILITY[ws.section_code as SectionCode]?.includes(coachType) ?? false;

    return {
      sectionCode: ws.section_code as SectionCode,
      nameHindi: ws.name_hindi,
      nameEnglish: ws.name_english,
      sectionType: ws.section_type,
      progressPct: progress ? Number(progress.progress_pct) : 0,
      totalWorkItems: progress ? Number(progress.total_work_items) : 0,
      completedWorkItems: progress ? Number(progress.completed_work_items) : 0,
      mustChangeTotal: progress ? Number(progress.must_change_total) : 0,
      mustChangeReplaced: progress ? Number(progress.must_change_replaced) : 0,
      testsTotal: progress ? Number(progress.tests_total) : 0,
      testsPassed: progress ? Number(progress.tests_passed) : 0,
      testsFailed: progress ? Number(progress.tests_failed) : 0,
      isApplicable,
    };
  });

  // Calculate aggregate completion
  const applicableSections = sections.filter(s => s.isApplicable && s.totalWorkItems > 0);
  const aggregateCompletionPct = applicableSections.length > 0
    ? Math.round(applicableSections.reduce((sum, s) => sum + s.progressPct, 0) / applicableSections.length)
    : 0;

  return {
    coachId,
    coachNumber: coach.coach_number,
    coachType,
    rakeType,
    pohCycle,
    sections,
    aggregateCompletionPct,
  };
}

// Get current user's assigned section for SSE highlighting
export async function getUserAssignedSection(): Promise<string | null> {
  const supabase = await createClient();
  const user = await getEffectiveUser();
  if (!user) return null;

  const { data } = await supabase
    .from('user_section_assignments')
    .select('sub_section')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  return data?.sub_section ?? null;
}
