# Bugfix Requirements Document

## Introduction

When a new Rake is registered through the registration form with coaches (e.g., "GZB-EMU-Medha 12226-12227" with 12 coaches), the Rake detail page displays the correct coach count in the header ("Coaches: 12" from the stored `total_coaches` field) but shows "Coaches (0)" in the coach grid section with all stats at 0%/empty. The coach-wise data is not being displayed despite the Rake record being created successfully.

The bug has two contributing factors:

1. **Silent coach INSERT failure during registration**: The `createRake` server action inserts coach records into the `coaches` table, but the Supabase `.insert()` call may silently fail due to database constraint violations or RLS policy evaluation issues without properly propagating the error. The action only checks for `coachError` from the INSERT response, but Supabase may return `null` data without an explicit error object in certain failure modes (e.g., RLS WITH CHECK failures return zero rows inserted rather than an error). The rake record persists with `total_coaches: 12` while zero coach rows exist.

2. **Missing error handling on coach SELECT in `getRakeDetail`**: The `getRakeDetail` query function fetches coaches with `const { data: coaches } = await supabase.from('coaches').select(...)` but does not check for an `error` response. If the query fails (e.g., due to RLS policy denial), `data` is `null`, and the function silently falls back to an empty array via `const coachList = coaches ?? []`. This masks any data access issues and presents an empty coach list to the UI.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user registers a new Rake with N coaches through the registration form AND the coach INSERT operation silently fails (due to RLS WITH CHECK policy evaluation or constraint issues) THEN the system creates the rake record with `total_coaches = N` but zero actual coach rows in the `coaches` table, and the `createRake` action returns success without detecting the failure

1.2 WHEN the `createRake` action attempts to re-read the just-inserted coaches (`supabase.from('coaches').select('id').eq('rake_id', rake.id)`) AND the SELECT returns null or empty due to RLS policy denial THEN the system skips creation of `coach_stage_history` and `coach_section_status` rows without reporting an error, leaving the rake with no associated stage tracking data

1.3 WHEN a user navigates to the Rake detail page for a rake whose coach records were not persisted THEN the system displays "Coaches (0)" in the coach grid, all aggregate stats show 0%/None, and the stage distribution chart shows all stages at 0, despite the rake header correctly showing the stored `total_coaches` count

1.4 WHEN the `getRakeDetail` query function fetches coaches from the database AND the Supabase query returns an error (e.g., RLS denial) THEN the system silently falls back to an empty array (`coaches ?? []`) without logging or surfacing the error, masking the root cause of missing data

### Expected Behavior (Correct)

2.1 WHEN a user registers a new Rake with N coaches through the registration form THEN the system SHALL atomically create the rake record AND all N coach records, and if any coach INSERT fails, the system SHALL roll back the rake creation and return a clear error message to the user

2.2 WHEN the `createRake` action inserts coaches and then re-reads them to create stage history and section status rows THEN the system SHALL verify that the expected number of coach records were actually persisted (matching `totalCoaches`), and if the count does not match, SHALL treat it as a failure, clean up the rake, and return an error

2.3 WHEN a user navigates to the Rake detail page for a successfully registered rake THEN the system SHALL display all N coaches in the coach grid with their correct stage, timeline status, and aggregate statistics matching the actual coach data

2.4 WHEN the `getRakeDetail` query function encounters a Supabase error while fetching coaches THEN the system SHALL log the error and either return null (triggering the "Rake not found" UI) or propagate the error so the UI can display an appropriate error state, rather than silently returning an empty coach list

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user registers a Rake with valid coach numbers (5-8 digits) and valid coach types (MC/TC) AND all database constraints and RLS policies are satisfied THEN the system SHALL CONTINUE TO create the rake and all coaches successfully and redirect to the rake detail page

3.2 WHEN a user views the detail page of a previously registered rake that has existing coach records THEN the system SHALL CONTINUE TO display all coaches with their current stages, timeline statuses, missing parts counts, and checklist completion percentages

3.3 WHEN the `createRake` action detects an explicit coach INSERT error (non-null `coachError`) THEN the system SHALL CONTINUE TO delete the orphaned rake record and return the error message to the user

3.4 WHEN the Rake header component receives `totalCoaches` from the rake record THEN the system SHALL CONTINUE TO display the stored coach count in the header section

3.5 WHEN aggregate stats (Avg Completion, Missing Parts, Avg Delay, Blocking Progression) are computed from the coaches array THEN the system SHALL CONTINUE TO calculate them correctly based on the actual coach data returned by `getRakeDetail`

3.6 WHEN RLS policies correctly grant a user access to coaches in their assigned sheds THEN the system SHALL CONTINUE TO return all coach records for those rakes without any data loss
