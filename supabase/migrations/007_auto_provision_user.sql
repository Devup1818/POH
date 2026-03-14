-- ============================================
-- Auto-Provision Users & Shed Assignments
-- ============================================
-- Directly inserts known users into the public.users table
-- and assigns them to the GZB-EMU shed. This bypasses the
-- auth.users access restriction in the Supabase SQL editor.
--
-- For NEW users going forward, auto-provisioning is handled
-- in app code (src/lib/supabase/auth.ts ensureUserProvisioned).
-- ============================================

-- 1. Insert Admin user
INSERT INTO public.users (id, email, full_name, role, is_active)
VALUES (
  '9a37540b-7ac5-4079-93fe-d83820e5e9d4',
  'deveshupadhyay0891@gmail.com',
  'Devesh Upadhyay',
  'Admin',
  true
)
ON CONFLICT (id) DO UPDATE SET role = 'Admin', is_active = true;

-- 2. Insert SSE user
INSERT INTO public.users (id, email, full_name, role, is_active)
VALUES (
  'c7c8e1f6-3a3e-4a59-9477-27cc67e09961',
  'mcleodtrio25@gmail.com',
  'Vijay Saini',
  'Senior_Section_Engineer',
  true
)
ON CONFLICT (id) DO UPDATE SET role = 'Senior_Section_Engineer', is_active = true;

-- 3. Assign SSE user to GZB-EMU shed (Admin sees all sheds via is_admin())
INSERT INTO public.user_shed_assignments (user_id, shed_id, is_primary)
SELECT
  'c7c8e1f6-3a3e-4a59-9477-27cc67e09961',
  id,
  true
FROM public.sheds
WHERE shed_code = 'GZB-EMU'
ON CONFLICT (user_id, shed_id) DO NOTHING;
