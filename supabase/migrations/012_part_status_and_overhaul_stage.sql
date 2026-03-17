-- Migration 012: Add 'Intake' part status, 'Overhaul' POH stage
-- Safe to re-run: drops constraints before any data changes

-- 1. Drop the old CHECK constraint first (safe even if already dropped)
ALTER TABLE coach_parts
  DROP CONSTRAINT IF EXISTS coach_parts_status_check;

-- 2. No data migration needed — 'Not Started' remains valid as the initial state

-- 3. Add the new CHECK constraint (now safe — no 'Not Started' rows remain)
ALTER TABLE coach_parts
  ADD CONSTRAINT coach_parts_status_check CHECK (
    status IN ('Not Started', 'Intake', 'Dismantled', 'Under Inspection', 'Overhauled/Repaired',
               'Reassembled', 'Tested', 'Missing/Pending')
  );

-- 4. Keep default as 'Not Started' (unchanged)
-- ALTER TABLE coach_parts ALTER COLUMN status SET DEFAULT 'Not Started';

-- 5. Update the trigger function that initialises parts on coach creation
CREATE OR REPLACE FUNCTION initialize_coach_parts()
RETURNS TRIGGER AS $$
DECLARE
  part_names TEXT[] := ARRAY[
    'Motor Bogie', 'Trailer Bogie', 'Traction Motor', 'Brake System',
    'Electrical System', 'Pantograph', 'Couplers', 'Suspension System', 'Body Shell'
  ];
  part_name TEXT;
BEGIN
  FOREACH part_name IN ARRAY part_names
  LOOP
    INSERT INTO coach_parts (coach_id, part_name, status)
    VALUES (NEW.id, part_name, 'Not Started');
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Drop old stage constraints (safe even if they don't exist)
ALTER TABLE coach_stage_history
  DROP CONSTRAINT IF EXISTS coach_stage_history_stage_check;

ALTER TABLE coaches
  DROP CONSTRAINT IF EXISTS coaches_current_stage_check;

-- 7. Add new stage constraints including 'Overhaul'
ALTER TABLE coach_stage_history
  ADD CONSTRAINT coach_stage_history_stage_check CHECK (
    stage IN ('Intake', 'Dismantling', 'Inspection', 'Overhaul',
              'Reassembly', 'Finishing', 'Testing', 'Trial', 'Release')
  );

ALTER TABLE coaches
  ADD CONSTRAINT coaches_current_stage_check CHECK (
    current_stage IN ('Intake', 'Dismantling', 'Inspection', 'Overhaul',
                      'Reassembly', 'Finishing', 'Testing', 'Trial', 'Release')
  );
