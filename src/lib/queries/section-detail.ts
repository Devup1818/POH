'use server';

import { createClient } from '@/lib/supabase/server';
import type { SectionDetailData, SectionWorkItem, MustChangeItemInstance, SectionTestInstance, M4CoordinationEntry, SectionCode } from '@/types';

export async function getSectionDetail(coachId: string, sectionCode: string): Promise<SectionDetailData | null> {
  const supabase = await createClient();

  // Get workshop section metadata — fall back to constants if table doesn't exist
  let section: any = null;
  try {
    const { data } = await supabase
      .from('workshop_sections')
      .select('*')
      .eq('section_code', sectionCode)
      .single();
    section = data;
  } catch {
    // Table doesn't exist yet
  }

  // If table missing or section not found, build from constants
  if (!section) {
    const sectionMeta: Record<string, { hindi: string; english: string; type: string }> = {
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
    const meta = sectionMeta[sectionCode];
    if (!meta) return null;
    section = {
      id: null,
      section_code: sectionCode,
      name_hindi: meta.hindi,
      name_english: meta.english,
      section_type: meta.type,
    };
  }

  // Get coach's POH cycle from rake
  const { data: coach } = await supabase
    .from('coaches')
    .select('id, rakes(poh_type)')
    .eq('id', coachId)
    .single();

  const pohCycle = (coach as any)?.rakes?.poh_type ?? '1st POH';

  // Check if current user is assigned SSE for this section
  const { data: { user } } = await supabase.auth.getUser();
  let isEditable = false;
  if (user) {
    // Check if admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role === 'Admin') {
      isEditable = true;
    } else {
      const { data: assignment } = await supabase
        .from('user_section_assignments')
        .select('sub_section')
        .eq('user_id', user.id)
        .eq('sub_section', sectionCode)
        .limit(1)
        .single();
      isEditable = !!assignment;
    }
  }

  // Fetch work items with WI details (resilient to missing tables)
  let workItems: SectionWorkItem[] = [];
  if (section.id) {
    try {
      const { data: workItemsRaw } = await supabase
        .from('section_work_items')
        .select('*, work_instructions(wi_number, version_number, rake_type)')
        .eq('coach_id', coachId)
        .eq('section_id', section.id);

      workItems = (workItemsRaw ?? []).map((wi: any) => ({
        id: wi.id,
        coachId: wi.coach_id,
        sectionId: wi.section_id,
        wiId: wi.wi_id,
        wiNumber: wi.work_instructions?.wi_number ?? '',
        versionNumber: wi.work_instructions?.version_number ?? '',
        rakeType: wi.work_instructions?.rake_type ?? '',
        status: wi.status,
        completionDate: wi.completion_date,
        completedBy: wi.completed_by,
        notes: wi.notes,
      }));
    } catch {
      // Table doesn't exist yet
    }
  }

  // Fetch must change items with template details (resilient to missing tables)
  let mustChangeItems: MustChangeItemInstance[] = [];
  if (section.id) {
    try {
      const { data: mustChangeRaw } = await supabase
        .from('must_change_item_instances')
        .select('*, must_change_item_templates(item_name, description)')
        .eq('coach_id', coachId)
        .eq('section_id', section.id);

      mustChangeItems = (mustChangeRaw ?? []).map((mc: any) => ({
        id: mc.id,
        coachId: mc.coach_id,
        templateId: mc.template_id,
        sectionId: mc.section_id,
        itemName: mc.must_change_item_templates?.item_name ?? '',
        description: mc.must_change_item_templates?.description ?? null,
        isReplaced: mc.is_replaced,
        oldPartDetail: mc.old_part_detail,
        newPartDetail: mc.new_part_detail,
        replacedAt: mc.replaced_at,
        replacedBy: mc.replaced_by,
      }));
    } catch {
      // Table doesn't exist yet
    }
  }

  // Fetch test instances with template details (resilient to missing tables)
  let tests: SectionTestInstance[] = [];
  if (section.id) {
    try {
      const { data: testsRaw } = await supabase
        .from('section_test_instances')
        .select('*, section_test_templates(test_name, test_description)')
        .eq('coach_id', coachId)
        .eq('section_id', section.id);

      tests = (testsRaw ?? []).map((t: any) => ({
        id: t.id,
        coachId: t.coach_id,
        templateId: t.template_id,
        sectionId: t.section_id,
        testName: t.section_test_templates?.test_name ?? '',
        testDescription: t.section_test_templates?.test_description ?? null,
        status: t.status,
        measuredValues: t.measured_values,
        passed: t.passed,
        testedAt: t.tested_at,
        testedBy: t.tested_by,
        notes: t.notes,
      }));
    } catch {
      // Table doesn't exist yet
    }
  }

  // For M4: fetch coordination entries (resilient to missing tables)
  let m4Entries: M4CoordinationEntry[] | undefined;
  if (section.section_type === 'coordination' && section.id) {
    try {
      const { data: m4Raw } = await supabase
        .from('m4_coordination_entries')
        .select('*, supported:workshop_sections!m4_coordination_entries_supported_section_id_fkey(section_code)')
        .eq('coach_id', coachId)
        .eq('section_id', section.id);

      m4Entries = (m4Raw ?? []).map((e: any) => ({
        id: e.id,
        coachId: e.coach_id,
        sectionId: e.section_id,
        supportedSectionId: e.supported_section_id,
        supportedSectionCode: e.supported?.section_code ?? '',
        activityType: e.activity_type,
        status: e.status,
        notes: e.notes,
        loggedBy: e.logged_by,
        createdAt: e.created_at,
      }));
    } catch {
      // Table doesn't exist yet
    }
  }

  return {
    sectionCode: section.section_code as SectionCode,
    nameHindi: section.name_hindi,
    nameEnglish: section.name_english,
    sectionType: section.section_type,
    pohCycle,
    isEditable,
    workItems,
    mustChangeItems,
    tests,
    m4Entries,
  };
}
