-- ============================================
-- Section Stage Completions
-- ============================================
-- Tracks which sections have completed which POH stages for a coach.
-- When ALL sections complete the current stage, the coach auto-advances.
-- ============================================

CREATE TABLE IF NOT EXISTS section_stage_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES workshop_sections(id) ON DELETE CASCADE,
  stage VARCHAR(20) NOT NULL CHECK (
    stage IN ('Intake', 'Dismantling', 'Inspection', 'Overhaul',
              'Reassembly', 'Finishing', 'Testing', 'Trial', 'Release')
  ),
  completed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  UNIQUE(coach_id, section_id, stage)
);

CREATE INDEX IF NOT EXISTS idx_ssc_coach ON section_stage_completions(coach_id);
CREATE INDEX IF NOT EXISTS idx_ssc_section ON section_stage_completions(section_id);
CREATE INDEX IF NOT EXISTS idx_ssc_stage ON section_stage_completions(stage);

COMMENT ON TABLE section_stage_completions IS 'Tracks per-section per-stage completion for auto-advancing coaches';
COMMENT ON COLUMN section_stage_completions.notes IS 'Optional note from the SSE when marking stage complete';
