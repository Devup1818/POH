-- ============================================
-- SSE Role Permissions Fix
-- ============================================
-- Updates the users table RLS SELECT policy to allow
-- authenticated users to read profiles of other users
-- who share a shed via user_shed_assignments.
-- This enables SSE (and other roles) to resolve note
-- author names for users in shared sheds.
--
-- Only the SELECT policy is changed. INSERT, UPDATE,
-- and DELETE policies remain unchanged.
-- ============================================

-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Create the updated SELECT policy:
-- 1. Users can always read their own profile
-- 2. Admins can read all profiles
-- 3. Any authenticated user can read profiles of users
--    who share at least one shed via user_shed_assignments
CREATE POLICY "Users can view own profile and shared shed users"
  ON users FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR is_admin()
    OR EXISTS (
      SELECT 1
      FROM user_shed_assignments usa1
      JOIN user_shed_assignments usa2 ON usa1.shed_id = usa2.shed_id
      WHERE usa1.user_id = auth.uid()
        AND usa2.user_id = users.id
    )
  );
