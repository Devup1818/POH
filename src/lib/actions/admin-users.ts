'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createUserSchema } from '@/lib/validations/user';
import { updateUserSchema } from '@/lib/validations/user';
import type { Result, UserRecord, CreateUserInput, UpdateUserInput } from '@/types';

/**
 * Fetches all user records with their shed and section assignments.
 * Caller must be an Admin user.
 */
export async function fetchUsers(): Promise<Result<UserRecord[]>> {
  try {
    const supabase = await createClient();

    // Verify the caller is authenticated and is an Admin
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { success: false, error: 'Unauthorized' };
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile || profile.role !== 'Admin') {
      return { success: false, error: 'Unauthorized' };
    }

    // Fetch all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, full_name, role, is_active, created_at')
      .order('created_at', { ascending: true });

    if (usersError) {
      console.error('Failed to fetch users:', usersError.message);
      return { success: false, error: 'Failed to fetch users. Please try again.' };
    }

    // Fetch all shed assignments with shed names
    const { data: shedAssignments, error: shedError } = await supabase
      .from('user_shed_assignments')
      .select('user_id, shed_id, sheds(name)');

    if (shedError) {
      console.error('Failed to fetch shed assignments:', shedError.message);
      return { success: false, error: 'Failed to fetch users. Please try again.' };
    }

    // Fetch all section assignments
    const { data: sectionAssignments, error: sectionError } = await supabase
      .from('user_section_assignments')
      .select('user_id, shed_id, section_name, sub_section');

    if (sectionError) {
      console.error('Failed to fetch section assignments:', sectionError.message);
      return { success: false, error: 'Failed to fetch users. Please try again.' };
    }

    // Build lookup maps for assignments
    const shedMap = new Map<string, { shed_id: string; shed_name: string }[]>();
    for (const sa of shedAssignments ?? []) {
      const list = shedMap.get(sa.user_id) ?? [];
      list.push({
        shed_id: sa.shed_id,
        shed_name: (sa.sheds as unknown as { name: string })?.name ?? '',
      });
      shedMap.set(sa.user_id, list);
    }

    const sectionMap = new Map<string, { shed_id: string; section_name: string; sub_section?: string }[]>();
    for (const sec of sectionAssignments ?? []) {
      const list = sectionMap.get(sec.user_id) ?? [];
      list.push({
        shed_id: sec.shed_id,
        section_name: sec.section_name,
        sub_section: sec.sub_section ?? undefined,
      });
      sectionMap.set(sec.user_id, list);
    }

    // Assemble UserRecord array
    const records: UserRecord[] = (users ?? []).map((u) => ({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      role: u.role as UserRecord['role'],
      is_active: u.is_active,
      created_at: u.created_at,
      shed_assignments: shedMap.get(u.id) ?? [],
      section_assignments: (sectionMap.get(u.id) ?? []) as UserRecord['section_assignments'],
    }));

    return { success: true, data: records };
  } catch (err) {
    console.error('Unexpected error in fetchUsers:', err);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Helper: verify the caller is an authenticated Admin user.
 * Returns the admin's user ID on success, or a Result error.
 */
async function verifyAdmin(): Promise<
  { ok: true; adminId: string } | { ok: false; result: Result<never> }
> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return { ok: false, result: { success: false, error: 'Unauthorized' } };
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', authUser.id)
    .single();

  if (profileError || !profile || profile.role !== 'Admin') {
    return { ok: false, result: { success: false, error: 'Unauthorized' } };
  }

  return { ok: true, adminId: authUser.id };
}

/**
 * Creates a new user account with Supabase Auth, inserts into users table,
 * assigns sheds and sections, and logs the action.
 */
export async function createUser(input: CreateUserInput): Promise<Result<UserRecord>> {
  try {
    const auth = await verifyAdmin();
    if (!auth.ok) return auth.result;

    // Validate input
    const parsed = createUserSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Invalid input';
      return { success: false, error: firstError };
    }

    const { email, full_name, role, shed_ids, section_assignments } = parsed.data;
    const adminClient = createAdminClient();

    // Create Supabase Auth account with default password
    const defaultPassword = 'Admin@123';
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      const msg = authError?.message ?? 'Failed to create user account';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('duplicate')) {
        return { success: false, error: 'This email is already registered.' };
      }
      console.error('Auth createUser error:', msg);
      return { success: false, error: 'Failed to create user account. Please try again.' };
    }

    const newUserId = authData.user.id;

    try {
      // Insert into users table
      const { error: userInsertError } = await adminClient
        .from('users')
        .insert({
          id: newUserId,
          email,
          full_name,
          role,
          is_active: true,
        });

      if (userInsertError) {
        throw new Error(`users insert: ${userInsertError.message}`);
      }

      // Insert shed assignments (first shed is marked as primary)
      if (shed_ids.length > 0) {
        const shedRows = shed_ids.map((shed_id, index) => ({
          user_id: newUserId,
          shed_id,
          is_primary: index === 0,
        }));
        const { error: shedError } = await adminClient
          .from('user_shed_assignments')
          .insert(shedRows);

        if (shedError) {
          throw new Error(`shed assignments insert: ${shedError.message}`);
        }
      }

      // Insert section assignments
      if (section_assignments.length > 0) {
        const sectionRows = section_assignments.map((sa) => ({
          user_id: newUserId,
          shed_id: sa.shed_id,
          section_name: sa.section_name,
          sub_section: sa.sub_section ?? null,
        }));
        const { error: sectionError } = await adminClient
          .from('user_section_assignments')
          .insert(sectionRows);

        if (sectionError) {
          throw new Error(`section assignments insert: ${sectionError.message}`);
        }
      }

      // Audit log (non-blocking)
      try {
        await adminClient.from('audit_logs').insert({
          user_id: auth.adminId,
          action: 'CREATE',
          entity_type: 'user',
          entity_id: newUserId,
          old_values: null,
          new_values: { email, full_name, role, shed_ids, section_assignments },
        });
      } catch (auditErr) {
        console.error('Audit log insert failed:', auditErr);
      }

      // Fetch the created user record to return
      const fetchResult = await fetchUserById(newUserId);
      if (!fetchResult.success) {
        return { success: true, data: {
          id: newUserId,
          email,
          full_name,
          role: role as UserRecord['role'],
          is_active: true,
          created_at: new Date().toISOString(),
          shed_assignments: [],
          section_assignments: [],
        }};
      }
      return fetchResult;
    } catch (dbError) {
      // Rollback: delete the auth account
      console.error('DB error, rolling back auth account:', dbError);
      await adminClient.auth.admin.deleteUser(newUserId);
      return { success: false, error: 'Failed to save user data. Please try again.' };
    }
  } catch (err) {
    console.error('Unexpected error in createUser:', err);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Fetches a single user by ID with shed and section assignments.
 */
async function fetchUserById(userId: string): Promise<Result<UserRecord>> {
  const adminClient = createAdminClient();

  const { data: user, error: userError } = await adminClient
    .from('users')
    .select('id, email, full_name, role, is_active, created_at')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    return { success: false, error: 'User not found' };
  }

  const { data: shedAssignments } = await adminClient
    .from('user_shed_assignments')
    .select('shed_id, sheds(name)')
    .eq('user_id', userId);

  const { data: sectionAssignments } = await adminClient
    .from('user_section_assignments')
    .select('shed_id, section_name, sub_section')
    .eq('user_id', userId);

  return {
    success: true,
    data: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role as UserRecord['role'],
      is_active: user.is_active,
      created_at: user.created_at,
      shed_assignments: (shedAssignments ?? []).map((sa) => ({
        shed_id: sa.shed_id,
        shed_name: (sa.sheds as unknown as { name: string })?.name ?? '',
      })),
      section_assignments: (sectionAssignments ?? []).map((sa) => ({
        shed_id: sa.shed_id,
        section_name: sa.section_name,
        sub_section: sa.sub_section ?? undefined,
      })) as UserRecord['section_assignments'],
    },
  };
}

/**
 * Updates an existing user's name, role, shed assignments, and section assignments.
 * Protects against removing the last Admin.
 */
export async function updateUser(input: UpdateUserInput): Promise<Result<UserRecord>> {
  try {
    const auth = await verifyAdmin();
    if (!auth.ok) return auth.result;

    const parsed = updateUserSchema.safeParse(input);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Invalid input';
      return { success: false, error: firstError };
    }

    const { user_id, full_name, role, shed_ids, section_assignments } = parsed.data;
    const adminClient = createAdminClient();

    // Fetch current user data for audit log old_values
    const { data: currentUser, error: fetchError } = await adminClient
      .from('users')
      .select('full_name, role')
      .eq('id', user_id)
      .single();

    if (fetchError || !currentUser) {
      return { success: false, error: 'User not found.' };
    }

    // Last-Admin protection
    if (currentUser.role === 'Admin' && role !== 'Admin') {
      const { count } = await adminClient
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'Admin')
        .eq('is_active', true);

      if ((count ?? 0) <= 1) {
        return { success: false, error: 'At least one Admin user must exist.' };
      }
    }

    // Fetch old shed/section assignments for audit
    const { data: oldSheds } = await adminClient
      .from('user_shed_assignments')
      .select('shed_id')
      .eq('user_id', user_id);

    const { data: oldSections } = await adminClient
      .from('user_section_assignments')
      .select('shed_id, section_name')
      .eq('user_id', user_id);

    // Update user row
    const { error: updateError } = await adminClient
      .from('users')
      .update({ full_name, role })
      .eq('id', user_id);

    if (updateError) {
      console.error('User update error:', updateError.message);
      return { success: false, error: 'Failed to update user. Please try again.' };
    }

    // Replace shed assignments
    await adminClient
      .from('user_shed_assignments')
      .delete()
      .eq('user_id', user_id);

    if (shed_ids.length > 0) {
      await adminClient
        .from('user_shed_assignments')
        .insert(shed_ids.map((shed_id, index) => ({ user_id, shed_id, is_primary: index === 0 })));
    }

    // Replace section assignments
    await adminClient
      .from('user_section_assignments')
      .delete()
      .eq('user_id', user_id);

    if (section_assignments.length > 0) {
      await adminClient
        .from('user_section_assignments')
        .insert(
          section_assignments.map((sa) => ({
            user_id,
            shed_id: sa.shed_id,
            section_name: sa.section_name,
            sub_section: sa.sub_section ?? null,
          })),
        );
    }

    // Audit log (non-blocking)
    try {
      await adminClient.from('audit_logs').insert({
        user_id: auth.adminId,
        action: 'UPDATE',
        entity_type: 'user',
        entity_id: user_id,
        old_values: {
          full_name: currentUser.full_name,
          role: currentUser.role,
          shed_ids: (oldSheds ?? []).map((s) => s.shed_id),
          sections: oldSections ?? [],
        },
        new_values: {
          full_name,
          role,
          shed_ids,
          section_assignments,
        },
      });
    } catch (auditErr) {
      console.error('Audit log insert failed:', auditErr);
    }

    return fetchUserById(user_id);
  } catch (err) {
    console.error('Unexpected error in updateUser:', err);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Deactivates a user: sets is_active=false and bans the auth account.
 */
export async function deactivateUser(userId: string): Promise<Result<void>> {
  try {
    const auth = await verifyAdmin();
    if (!auth.ok) return auth.result;

    const adminClient = createAdminClient();

    // Prevent deactivating yourself
    if (userId === auth.adminId) {
      return { success: false, error: 'You cannot deactivate your own account.' };
    }

    // Set is_active = false
    const { error: updateError } = await adminClient
      .from('users')
      .update({ is_active: false })
      .eq('id', userId);

    if (updateError) {
      console.error('Deactivate update error:', updateError.message);
      return { success: false, error: 'Failed to deactivate user. Please try again.' };
    }

    // Ban the auth account (876000h ≈ 100 years)
    const { error: banError } = await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: '876000h',
    });

    if (banError) {
      console.error('Auth ban error:', banError.message);
      // Revert is_active
      await adminClient.from('users').update({ is_active: true }).eq('id', userId);
      return { success: false, error: 'Failed to deactivate user. Please try again.' };
    }

    // Audit log (non-blocking)
    try {
      await adminClient.from('audit_logs').insert({
        user_id: auth.adminId,
        action: 'DEACTIVATE',
        entity_type: 'user',
        entity_id: userId,
        old_values: { is_active: true },
        new_values: { is_active: false },
      });
    } catch (auditErr) {
      console.error('Audit log insert failed:', auditErr);
    }

    return { success: true, data: undefined };
  } catch (err) {
    console.error('Unexpected error in deactivateUser:', err);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}

/**
 * Reactivates a user: sets is_active=true and unbans the auth account.
 */
export async function reactivateUser(userId: string): Promise<Result<void>> {
  try {
    const auth = await verifyAdmin();
    if (!auth.ok) return auth.result;

    const adminClient = createAdminClient();

    // Set is_active = true
    const { error: updateError } = await adminClient
      .from('users')
      .update({ is_active: true })
      .eq('id', userId);

    if (updateError) {
      console.error('Reactivate update error:', updateError.message);
      return { success: false, error: 'Failed to reactivate user. Please try again.' };
    }

    // Unban the auth account
    const { error: unbanError } = await adminClient.auth.admin.updateUserById(userId, {
      ban_duration: 'none',
    });

    if (unbanError) {
      console.error('Auth unban error:', unbanError.message);
      await adminClient.from('users').update({ is_active: false }).eq('id', userId);
      return { success: false, error: 'Failed to reactivate user. Please try again.' };
    }

    // Audit log (non-blocking)
    try {
      await adminClient.from('audit_logs').insert({
        user_id: auth.adminId,
        action: 'REACTIVATE',
        entity_type: 'user',
        entity_id: userId,
        old_values: { is_active: false },
        new_values: { is_active: true },
      });
    } catch (auditErr) {
      console.error('Audit log insert failed:', auditErr);
    }

    return { success: true, data: undefined };
  } catch (err) {
    console.error('Unexpected error in reactivateUser:', err);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}
