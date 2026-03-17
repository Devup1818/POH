# Job Card System — Brainstorm & Portal Mapping

## Section Mapping (from 19 Job Card Files)

Files have been mapped into 8 sections:

| File(s) | Section | Coach Types |
|---------|---------|-------------|
| POH-E2-Conv / E2-3phase | E2 — Transformer & Choke Tank | MC only |
| POH-E3-Conv / E3-3phase | E3 — Control Gear, Relays, Switch Group | MC only |
| POH-E5-Conv / E5-3phase | E5 — Electronics, Lighting | All |
| POH-M2-Conv / M2-3phase | M2 — Bogie & Under-gear | All coaches |
| POH-M3-Conv / M3-3phase | M3 — Wheels, Axles, Suspension | All coaches |
| POH-M5-conv-MC / M5-3ph-DTC-DMC / M5-3ph-TC / M5-3ph-NDTC | M5 — Pneumatic Brakes | Coach-type specific |
| POH-M6-Conv / M6-3phase | M6 — Furnishing & Interior | All |
| POH-M8-conv / M8-3ph | M8 — Speedometer, AWS, TPWS | MC/DTC only |

---

## Digital Job Card — 4 Parts

Each job card file has exactly 4 parts — the portal will mirror this structure:

### Part A — Must-Change Items
- Auto-load based on POH number (1st/2nd/3rd/4th POH)
- Items not applicable for current POH show "N/A this POH" automatically
- SSE does not need to manually decide applicability

### Part B — Maintenance Activities
- Each task has a Remarks / Work Done field
- SSE writes observations (e.g., "Found crack in dust excluder — attended")

### Part C — Final Testing Values
- Brake test actual data entry: Application time, Release time, MR/BP/BC pressure
- Matches the printed table format from physical files
- System automatically compares standard vs actual values

### Part D — Staff Register
- Employee Name + Coach No. + Job Sr. No. + Signature
- Logged-in user's name auto-fills
- Only need to select job no. and coach

---

## Submission & Rake Release Flow

```
SSE → Portal pe tasks complete
    → "SUBMIT JOB CARD" button
    → Digital signature (OTP/PIN)
    → Admin ko notification

Admin → Job card review:
    ✅ APPROVE  → Section cleared
    ❌ SEND BACK → SSE ko reason ke saath wapas

RAKE RELEASE → Sirf tab jab:
    ✅ Sab sections ke job cards = APPROVED
    ✅ S10 Final Testing = DONE
    → Admin clicks "RELEASE RAKE FOR SERVICE"
```

---

## Database Table — `poh_job_cards`

```sql
CREATE TABLE poh_job_cards (
  id                  UUID PRIMARY KEY,
  rake_id             UUID REFERENCES rakes(id),
  coach_no            TEXT NOT NULL,
  section_id          TEXT NOT NULL,           -- 'E2','M5','M2' etc.
  job_card_file_ref   TEXT,                    -- 'POH-M5-Conv-MC'
  poh_number          INTEGER NOT NULL,        -- 1,2,3,4 (for must-change logic)
  rake_type           TEXT,                    -- 'CONVENTIONAL'|'3PHASE'

  -- 4 parts stored as JSONB
  must_change_items   JSONB,   -- [{item, required_this_poh, done, remarks}]
  activity_remarks    JSONB,   -- [{sr_no, activity, remarks, status}]
  test_values         JSONB,   -- {brake_test:{ep,auto,emergency}, leakage:{MR,BP,BC}}
  staff_register      JSONB,   -- [{name, coach, job_sr_no, user_id}]

  -- Workflow
  status              TEXT DEFAULT 'DRAFT',    -- DRAFT→SUBMITTED→APPROVED/SENT_BACK
  submitted_by        UUID REFERENCES users(id),
  submitted_at        TIMESTAMPTZ,
  admin_approved_by   UUID REFERENCES users(id),
  admin_approved_at   TIMESTAMPTZ,
  rejection_reason    TEXT,
  archived_pdf_url    TEXT,                    -- PDF generated on approval

  shed_id             UUID REFERENCES sheds(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Auto-Archive on Rake Release

When Admin releases a rake, the system automatically:

1. Generates PDF for each section's job card → saves to Supabase Storage
2. Increments POH number on the rake (1→2→3→4)
3. Auto-calculates next POH due date (current date + 18 months)
4. Sends notification to Sr.DEE/ELS for rake clearance

---

## Key Differences: Physical vs Portal

| Aspect | Physical Job Card | Portal Job Card |
|--------|-------------------|-----------------|
| Must-Change Items | SSE manually checks POH number | Auto-loaded per POH number, N/A items greyed out |
| Activity Remarks | Handwritten on paper | Digital text entry with history |
| Test Values | Filled in printed table | Data entry with auto-validation (standard vs actual) |
| Staff Register | Manual name + signature | Auto-fill from login, digital signature |
| Submission | Paper handed to Admin | One-click submit with OTP/PIN |
| Review | Admin physically checks | Digital review with approve/send-back workflow |
| Archival | Filed in physical register | Auto-PDF generation, stored in cloud |
| Rake Release | Manual clearance | System enforces all sections approved + S10 done |

---

## Digital Job Card — How SSE Fills It (Coach by Coach)

Example: Job Card → POH-M5-MC | GZB-MEMU-07

### Part A — Must-Change Items (Auto-loaded from POH No.)
- ✅ M.P unit (1st/All every POH) → Compliant
- ✅ Brake controller O/Haul → Compliant
- ✅ Piston packing kit → Compliant
- ❌ Guard emergency valve O/H, POH → N/A this POH

### Part B — Maintenance Activities (Remarks/Work Done field)
- ✅ Check control BP and — all valves inspected → OK
- ⚠️ Found crack in dust excluder — attended
- ✅ Piston stroke within regulation tolerance → Standard

### Part C — Final Testing Values (Brake Test Recording)

| Type | Application | Actual | Release | Actual | MR | BP |
|------|-------------|--------|---------|--------|-----|-----|
| EP/MEL | <8 sec | 6.3 sec ✅ | <20 sec | 18 sec ✅ | 6.0 | 3.7 |
| Auto | <20 sec | 18 sec ✅ | <30 sec | 19 sec ✅ | 6.0 | 3.7 |
| Emergency | <10 sec | 10 sec ✅ | <60 sec | 50 sec ✅ | 6.0 | 4.7 |

Leakage Test (10 kg/cm² → 5 min):
- MR: 0.25 ✅ | BP: 0.00 ✅ | BC: 0.05 kg/cm² ✅

### Part D — Staff Register (Auto-saved from login)
1. Sh. Ravi Kumar | Coach: MC1 | Job: M5 OH R16 | ✓
2. Sh. Suresh Lal | Coach: MC1 | Job: BC OH P01 | ✓
3. Sh. Dinesh M | Coach: MC1 | Job: Air Brake P15 | ✓

---

## Submission Flow — SSE Submits Job Card → Admin Reviews → Rake Released

```
① SSE completes all tasks on portal    ② SSE clicks SUBMIT JOB CARD
  (All ✅ in job card)                     + Digital Signature
         ↓                                        ↓
③ Admin gets Notification:              ④ Admin reviews job card
  "Section X submitted"                    + values + staff register
         ↓                                        ↓
⑤ Admin: APPROVE or SEND BACK for correction
```

---

## Admin Job Card Review Panel — Submitted Job Cards Dashboard

| SECTION | COACH | FILE REF | MUST CHANGE | TEST VALUES | STAFF SIGN | SUBMITTED BY | STATUS |
|---------|-------|----------|-------------|-------------|------------|--------------|--------|
| M5 Pneumatic | MC1 | POH-M5-Conv-MC | 3/3 ✅ | All Pass ✅ | 3/3 ✅ | SSE/M/4228 | ✅ APPROVED |
| E2 Transformer | MC1 | POH-E2-Conv | 5/5 ✅ | All Valid ✅ | 2/2 ✅ | SSE/E/0458 | ✅ SUBMITTED |
| M2 Bogie | MC2 | POH-M2-Conv | 8/10 ✅ | VTT: Pass ✅ | 4/4 ✅ | SSE/M/0023 | 🟡 UNDER REVIEW |
| E3 Control | MC1 | POH-E3-Conv | 6/6 ✅ | Relay: OK ✅ | 3/3 ✅ | SSE/M/1039 | 🔴 SENT BACK |
| M6 Furnishing | All | POH-M6-Conv | N/A ✅ | Visual OK ✅ | - | SSE/M/0023 | 🟡 UNDER REVIEW |

---

## Rake Release Gate — All Section Job Cards Approved → Admin Releases Rake

### Rake Release Checklist — GZB-MEMU-07

- ✅ M5 Pneumatic Job Card → Approved
- ✅ M2 Bogie/Under-gear Job Card → Approved
- ✅ M3 Wheels/Axle Job Card → Approved
- ✅ M6 Furnishing Job Card → Approved
- ✅ M8 Speedometer/AWS Job Card → Approved
- ✅ E2 Transformer Job Card → Approved
- ✅ E3 Control Gear/Relay Job Card → Approved
- ✅ E5 Electronics/Lighting Job Card → Approved
- ✅ S10 Final Testing: Passed → Approved by SSE/S10

### Admin Releases Rake
Click: **[ RELEASE RAKE FOR SERVICE ]**

System records:
- Release date & time
- Releasing officer name
- Next POH due date auto-calculated
- All job cards archived as PDF

---

## After Release — What Gets Archived Automatically

| Icon | What |
|------|------|
| 📄 | Digital Job Card PDF per section per coach |
| 📊 | Brake test values with actual vs standard |
| 👤 | Staff register: name, coach, job, signature |
| 🔧 | Must-change items with POH no. tracking |
| 📅 | Next POH date auto-set (POH No. incremented) |
| 🔔 | Notification to Sr.DEE/ELS for released rake |


---

## GAP ANALYSIS: Our Portal vs Brainstorm Job Card System

### What Our Portal ALREADY HAS ✅

| Feature | Portal Status | Details |
|---------|--------------|---------|
| 10 Workshop Sections (M2-E5) | ✅ Done | `workshop_sections` table with M2,M3,M4,M5,M6,M8,Painting,E2,E3,E5 |
| Section ↔ Coach Type Applicability | ✅ Done | `SECTION_COACH_TYPE_APPLICABILITY` matrix in constants.ts |
| Work Instructions per section | ✅ Done | `work_instructions` + `wi_coach_type_applicability` tables |
| Must-Change Items (POH cycle based) | ✅ Done | `must_change_item_templates` + `must_change_item_instances` tables |
| Section Tests | ✅ Done | `section_test_templates` + `section_test_instances` tables |
| Job Card Generation (auto-populate) | ✅ Done | `generateJobCardForCoach()` via `generate_job_card` RPC |
| Job Card PDF Export | ✅ Done | `exportJobCardPDF()` with jsPDF — per coach, all sections |
| Section Completion Validation | ✅ Done | Checks must-change + tests before marking complete |
| Rake Completion | ✅ Done | All coaches must be at Release stage |
| M4 Coordination | ✅ Done | `m4_coordination_entries` table |
| Section Progress View | ✅ Done | `v_coach_section_progress` DB view |
| Section Analysis (rake-wide) | ✅ Done | Section analysis page with per-coach breakdown |

### What's MISSING / DIFFERENT ❌

| Brainstorm Feature | Portal Status | Gap |
|-------------------|--------------|-----|
| **Part A/B/C/D Structure** | ❌ Missing | Portal uses flat work items + must-change + tests. No explicit 4-part job card structure (Part A/B/C/D) |
| **Part B — Activity Remarks** | ⚠️ Partial | Work items have `notes` field, but no dedicated "Remarks/Work Done" per activity |
| **Part C — Brake Test Values Table** | ❌ Missing | Portal has generic `measured_values` TEXT field. No structured brake test table (EP/Auto/Emergency × Application/Release/MR/BP/BC) |
| **Part C — Standard vs Actual Auto-Compare** | ❌ Missing | No auto-validation of test values against standard thresholds |
| **Part D — Staff Register** | ❌ Missing | No staff register table. Portal tracks `completed_by` per item but no dedicated sign-off register |
| **Digital Signature (OTP/PIN)** | ❌ Missing | No submission signature mechanism |
| **Job Card Submit Button** | ❌ Missing | SSE can complete sections but no formal "SUBMIT JOB CARD" workflow |
| **Admin Review Panel** | ❌ Missing | No admin dashboard for reviewing submitted job cards |
| **Approve / Send Back Workflow** | ❌ Missing | No DRAFT→SUBMITTED→APPROVED/SENT_BACK status flow |
| **Rejection Reason** | ❌ Missing | No rejection_reason field or send-back mechanism |
| **`poh_job_cards` Table** | ❌ Missing | Portal uses separate instance tables, not a unified job card table with JSONB parts |
| **Rake Release Gate** | ⚠️ Partial | Portal has `completeRake()` but only checks coach stages, not section job card approvals |
| **Auto-Archive PDF on Release** | ❌ Missing | PDF export exists but not auto-triggered on rake release, not stored in Supabase Storage |
| **POH Number Auto-Increment** | ❌ Missing | No auto-increment of POH number (1→2→3→4) on release |
| **Next POH Due Date Calculation** | ❌ Missing | No auto-calculation of next POH date (+18 months) |
| **Sr.DEE/ELS Notification on Release** | ❌ Missing | Notification system exists but no rake release notification type |
| **S10 Final Testing Gate** | ❌ Missing | No S10 section or final testing gate check before rake release |

### Section Mapping Differences

**✅ RESOLVED:** Portal section names are already correct and match the physical job card files. The brainstorm comparison above was inaccurate — no section name changes needed.

### Architecture Decision Needed

**Option A — Unified `poh_job_cards` Table (Brainstorm approach)**
- Single table with JSONB columns for 4 parts
- Simpler workflow (one row = one job card)
- Easier approve/reject flow
- Risk: JSONB makes querying individual items harder

**Option B — Keep Current Normalized Tables + Add Workflow Layer**
- Keep `section_work_items`, `must_change_item_instances`, `section_test_instances`
- Add new `job_card_submissions` table for workflow (status, submitted_by, approved_by, etc.)
- Add `staff_register` table
- Add structured `brake_test_values` table
- Better queryability, existing code keeps working
- More tables but cleaner data model

**Recommendation:** Option B — build on what we have, add the missing workflow and structured test data on top.


---

## KNOWN BUGS (To Fix Separately)

### Bug 1: Coach Stage Always Shows "Intake" for Admin
When logged in as Admin and tapping on a rake, all coaches always show/marked as "Intake" stage — the stage does not update when a coach moves to Dismantling or further stages. The UI is not reflecting the actual `current_stage` from the database.

**Investigation Findings (Code Analysis):**

| Area | Status | Notes |
|------|--------|-------|
| `getRakeDetail()` query | ✅ Correct | Reads `current_stage` directly from `coaches` table |
| RLS SELECT policy (coaches) | ✅ Correct | Uses `user_has_shed_access()` → `is_admin()` — Admin should see all coaches |
| RLS UPDATE policy (coaches) | ✅ Correct | Includes 'Admin' role in allowed roles |
| `advanceCoachStage()` logic | ✅ Correct | Updates `current_stage` and `stage_start_date` on `coaches` table |
| Next.js caching | ✅ No issue | Server Actions (POST) are not cached |
| UI rendering | ✅ Correct | `useMemo` reads `c.currentStage` from fetched data |

**Possible Root Causes (need DB verification):**
1. **Stages were never actually advanced** — SSE may not have clicked "Advance Stage" on the coach detail page. The stage only advances when explicitly triggered via the coach detail page button.
2. **SSE's UPDATE was silently rejected by RLS** — If the SSE doesn't have a shed assignment for that rake's shed, the UPDATE would silently do nothing (Supabase doesn't throw errors on RLS-blocked updates, it just returns 0 rows affected).
3. **Admin user's role mismatch** — If the `users` table has the Admin's role as something other than exactly `'Admin'` (e.g., `'admin'`, `'ADMIN'`), the `is_admin()` function would return false, and the SELECT would fall back to shed-based access.

**How to verify:**
```sql
-- Check if coaches actually have updated stages in DB
SELECT c.coach_number, c.current_stage, c.stage_start_date
FROM coaches c WHERE c.rake_id = '<rake_id>' ORDER BY c.coach_number;

-- Check Admin user's role
SELECT id, full_name, role FROM users WHERE role ILIKE '%admin%';

-- Check if SSE has shed assignment
SELECT u.full_name, u.role, usa.shed_id, s.name
FROM users u
LEFT JOIN user_shed_assignments usa ON usa.user_id = u.id
LEFT JOIN sheds s ON s.id = usa.shed_id
WHERE u.role = 'Senior_Section_Engineer';
```

**Verdict:** Code is clean. Most likely a data/operational issue — either stages were never advanced, or there's a role/shed assignment mismatch. Need to run the SQL queries above against the live database to confirm.

### Bug 2: Must-Change Items File Incomplete
The must-change items seed data is missing many equipment items. The current `must_change_item_templates` table does not include all the items from the physical job card files. Needs a comprehensive review and update of the seed data.
