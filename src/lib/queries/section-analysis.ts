'use server';

import { createClient } from '@/lib/supabase/server';
import type { SectionAnalysisData, CoachType, SectionCode } from '@/types';
import { SECTION_CODES, SECTION_COACH_TYPE_APPLICABILITY } from '@/lib/constants';

export async function getRakeSectionAnalysis(rakeId: string): Promise<SectionAnalysisData | null> {
  const supabase = await createClient();

  // Get rake info
  const { data: rake } = await supabase
    .from('rakes')
    .select('id, rake_number')
    .eq('id', rakeId)
    .single();

  if (!rake) return null;

  // Get all coaches in this rake
  const { data: coaches } = await supabase
    .from('coaches')
    .select('id, coach_number, coach_type')
    .eq('rake_id', rakeId)
    .order('coach_number');

  if (!coaches || coaches.length === 0) return null;

  // Get all section progress for coaches in this rake
  const coachIds = coaches.map((c: any) => c.id);
  let progressData: any[] = [];
  try {
    const { data } = await supabase
      .from('v_coach_section_progress')
      .select('*')
      .in('coach_id', coachIds);
    progressData = data ?? [];
  } catch {
    // View doesn't exist yet — continue with empty progress
  }

  // Build progress lookup: coachId -> sectionCode -> progressPct
  const progressLookup = new Map<string, Map<string, number>>();
  for (const p of progressData) {
    if (!progressLookup.has(p.coach_id)) {
      progressLookup.set(p.coach_id, new Map());
    }
    progressLookup.get(p.coach_id)!.set(p.section_code, Number(p.progress_pct));
  }

  // Build coach rows
  const coachRows = coaches.map((c: any) => {
    const coachType = (c.coach_type ?? 'MC') as CoachType;
    const coachProgress = progressLookup.get(c.id) ?? new Map();

    const sections = {} as Record<SectionCode, { progressPct: number; isApplicable: boolean }>;
    for (const code of SECTION_CODES) {
      const isApplicable = SECTION_COACH_TYPE_APPLICABILITY[code]?.includes(coachType) ?? false;
      sections[code] = {
        progressPct: isApplicable ? (coachProgress.get(code) ?? 0) : 0,
        isApplicable,
      };
    }

    return {
      coachId: c.id,
      coachNumber: c.coach_number,
      coachType,
      sections,
    };
  });

  // Calculate averages per section (excluding N/A coaches)
  const averages = {} as Record<SectionCode, number>;
  for (const code of SECTION_CODES) {
    const applicableCoaches = coachRows.filter(c => c.sections[code].isApplicable);
    if (applicableCoaches.length === 0) {
      averages[code] = 0;
    } else {
      const sum = applicableCoaches.reduce((s, c) => s + c.sections[code].progressPct, 0);
      averages[code] = Math.round(sum / applicableCoaches.length);
    }
  }

  return {
    rakeId,
    rakeNumber: rake.rake_number,
    coaches: coachRows,
    averages,
  };
}
