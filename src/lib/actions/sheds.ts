'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Result } from '@/types';

export interface ShedRecord {
  id: string;
  shed_code: string;
  name: string;
  railway_zone: string;
  is_active: boolean;
  config: ShedConfig;
  created_at: string;
  updated_at: string;
  rake_count: number;
}

export interface ShedConfig {
  target_durations: Record<string, number>;
  delay_thresholds: { minor: number; significant: number };
  notification_preferences: {
    stage_completion: boolean;
    significant_delay: boolean;
    missing_parts: boolean;
    testing_complete: boolean;
  };
}

const DEFAULT_CONFIG: ShedConfig = {
  target_durations: {
    Intake: 1,
    Dismantling: 2,
    Inspection: 6,
    Reassembly: 3,
    Finishing: 2,
    Testing: 3,
    Trial: 2,
    Release: 1,
  },
  delay_thresholds: { minor: 1, significant: 2 },
  notification_preferences: {
    stage_completion: true,
    significant_delay: true,
    missing_parts: true,
    testing_complete: true,
  },
};

/**
 * Verify the caller is an authenticated Admin user.
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
 * Fetches all sheds with their active rake counts.
 */
export async function fetchSheds(): Promise<Result<ShedRecord[]>> {
  try {
    const auth = await verifyAdmin();
    if (!auth.ok) return auth.result;

    const adminClient = createAdminClient();

    const { data: sheds, error: shedsError } = await adminClient
      .from('sheds')
      .select('*')
      .neq('shed_code', SYSTEM_SHED_CODE)
      .order('created_at', { ascending: true });

    if (shedsError) {
      console.error('Failed to fetch sheds:', shedsError.message);
      return { success: false, error: 'Failed to fetch sheds.' };
    }

    // Get active rake counts per shed
    const { data: rakeCounts, error: rakeError } = await adminClient
      .from('rakes')
      .select('shed_id')
      .eq('status', 'Active');

    const countMap = new Map<string, number>();
    if (!rakeError && rakeCounts) {
      for (const r of rakeCounts) {
        countMap.set(r.shed_id, (countMap.get(r.shed_id) ?? 0) + 1);
      }
    }

    const records: ShedRecord[] = (sheds ?? []).map((s) => ({
      id: s.id,
      shed_code: s.shed_code,
      name: s.name,
      railway_zone: s.railway_zone,
      is_active: s.is_active,
      config: (s.config as ShedConfig) ?? DEFAULT_CONFIG,
      created_at: s.created_at,
      updated_at: s.updated_at,
      rake_count: countMap.get(s.id) ?? 0,
    }));

    return { success: true, data: records };
  } catch (err) {
    console.error('Unexpected error in fetchSheds:', err);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

/**
 * Creates a new shed.
 */
export async function createShed(input: {
  shed_code: string;
  name: string;
  railway_zone: string;
}): Promise<Result<ShedRecord>> {
  try {
    const auth = await verifyAdmin();
    if (!auth.ok) return auth.result;

    const { shed_code, name, railway_zone } = input;

    if (!shed_code.trim() || !name.trim() || !railway_zone.trim()) {
      return { success: false, error: 'All fields are required.' };
    }

    const adminClient = createAdminClient();

    // Check uniqueness of shed_code
    const { data: existing } = await adminClient
      .from('sheds')
      .select('id')
      .eq('shed_code', shed_code.trim())
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'Shed code already exists.' };
    }

    const { data: shed, error: insertError } = await adminClient
      .from('sheds')
      .insert({
        shed_code: shed_code.trim(),
        name: name.trim(),
        railway_zone: railway_zone.trim(),
        is_active: true,
        config: DEFAULT_CONFIG,
      })
      .select()
      .single();

    if (insertError || !shed) {
      console.error('Failed to create shed:', insertError?.message);
      return { success: false, error: 'Failed to create shed.' };
    }

    // Audit log
    try {
      await adminClient.from('audit_logs').insert({
        user_id: auth.adminId,
        action: 'CREATE',
        entity_type: 'shed',
        entity_id: shed.id,
        old_values: null,
        new_values: { shed_code, name, railway_zone },
      });
    } catch {}

    return {
      success: true,
      data: {
        id: shed.id,
        shed_code: shed.shed_code,
        name: shed.name,
        railway_zone: shed.railway_zone,
        is_active: shed.is_active,
        config: (shed.config as ShedConfig) ?? DEFAULT_CONFIG,
        created_at: shed.created_at,
        updated_at: shed.updated_at,
        rake_count: 0,
      },
    };
  } catch (err) {
    console.error('Unexpected error in createShed:', err);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

/**
 * Updates a shed's name and railway zone.
 */
export async function updateShed(input: {
  id: string;
  name: string;
  railway_zone: string;
}): Promise<Result<void>> {
  try {
    const auth = await verifyAdmin();
    if (!auth.ok) return auth.result;

    const { id, name, railway_zone } = input;

    if (!name.trim() || !railway_zone.trim()) {
      return { success: false, error: 'Name and railway zone are required.' };
    }

    const adminClient = createAdminClient();

    const { data: oldShed } = await adminClient
      .from('sheds')
      .select('name, railway_zone')
      .eq('id', id)
      .single();

    const { error: updateError } = await adminClient
      .from('sheds')
      .update({ name: name.trim(), railway_zone: railway_zone.trim() })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to update shed:', updateError.message);
      return { success: false, error: 'Failed to update shed.' };
    }

    try {
      await adminClient.from('audit_logs').insert({
        user_id: auth.adminId,
        action: 'UPDATE',
        entity_type: 'shed',
        entity_id: id,
        old_values: oldShed,
        new_values: { name, railway_zone },
        shed_id: id,
      });
    } catch {}

    return { success: true, data: undefined };
  } catch (err) {
    console.error('Unexpected error in updateShed:', err);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

/**
 * Toggles a shed's active status.
 */
export async function toggleShedActive(shedId: string): Promise<Result<void>> {
  try {
    const auth = await verifyAdmin();
    if (!auth.ok) return auth.result;

    const adminClient = createAdminClient();

    const { data: shed, error: fetchError } = await adminClient
      .from('sheds')
      .select('is_active')
      .eq('id', shedId)
      .single();

    if (fetchError || !shed) {
      return { success: false, error: 'Shed not found.' };
    }

    const newStatus = !shed.is_active;

    const { error: updateError } = await adminClient
      .from('sheds')
      .update({ is_active: newStatus })
      .eq('id', shedId);

    if (updateError) {
      console.error('Failed to toggle shed status:', updateError.message);
      return { success: false, error: 'Failed to update shed status.' };
    }

    try {
      await adminClient.from('audit_logs').insert({
        user_id: auth.adminId,
        action: newStatus ? 'REACTIVATE' : 'DEACTIVATE',
        entity_type: 'shed',
        entity_id: shedId,
        old_values: { is_active: shed.is_active },
        new_values: { is_active: newStatus },
        shed_id: shedId,
      });
    } catch {}

    return { success: true, data: undefined };
  } catch (err) {
    console.error('Unexpected error in toggleShedActive:', err);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

/**
 * Updates a shed's configuration (target durations, delay thresholds, notification preferences).
 */
export async function updateShedConfig(
  shedId: string,
  config: ShedConfig,
): Promise<Result<void>> {
  try {
    const auth = await verifyAdmin();
    if (!auth.ok) return auth.result;

    const adminClient = createAdminClient();

    const { data: oldShed } = await adminClient
      .from('sheds')
      .select('config')
      .eq('id', shedId)
      .single();

    const { error: updateError } = await adminClient
      .from('sheds')
      .update({ config })
      .eq('id', shedId);

    if (updateError) {
      console.error('Failed to update shed config:', updateError.message);
      return { success: false, error: 'Failed to update configuration.' };
    }

    try {
      await adminClient.from('audit_logs').insert({
        user_id: auth.adminId,
        action: 'UPDATE_CONFIG',
        entity_type: 'shed',
        entity_id: shedId,
        old_values: oldShed?.config,
        new_values: config,
        shed_id: shedId,
      });
    } catch {}

    return { success: true, data: undefined };
  } catch (err) {
    console.error('Unexpected error in updateShedConfig:', err);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

const SYSTEM_SHED_CODE = '__SYSTEM__';

/**
 * Fetches the system-wide default configuration.
 * Reads from a special shed record with shed_code = '__SYSTEM__'.
 * If it doesn't exist, creates it with default values.
 */
export async function getSystemConfig(): Promise<Result<ShedConfig>> {
  try {
    const auth = await verifyAdmin();
    if (!auth.ok) return auth.result;

    const adminClient = createAdminClient();

    const { data: systemShed, error: fetchError } = await adminClient
      .from('sheds')
      .select('id, config')
      .eq('shed_code', SYSTEM_SHED_CODE)
      .maybeSingle();

    if (fetchError) {
      console.error('Failed to fetch system config:', fetchError.message);
      return { success: false, error: 'Failed to fetch system configuration.' };
    }

    if (systemShed) {
      return { success: true, data: (systemShed.config as ShedConfig) ?? DEFAULT_CONFIG };
    }

    // Create the system config record if it doesn't exist
    const { data: newShed, error: insertError } = await adminClient
      .from('sheds')
      .insert({
        shed_code: SYSTEM_SHED_CODE,
        name: 'System Defaults',
        railway_zone: 'System',
        is_active: false,
        config: DEFAULT_CONFIG,
      })
      .select('id, config')
      .single();

    if (insertError || !newShed) {
      console.error('Failed to create system config:', insertError?.message);
      return { success: false, error: 'Failed to initialize system configuration.' };
    }

    return { success: true, data: (newShed.config as ShedConfig) ?? DEFAULT_CONFIG };
  } catch (err) {
    console.error('Unexpected error in getSystemConfig:', err);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

/**
 * Updates the system-wide default configuration.
 */
export async function updateSystemConfig(config: ShedConfig): Promise<Result<void>> {
  try {
    const auth = await verifyAdmin();
    if (!auth.ok) return auth.result;

    const adminClient = createAdminClient();

    // Ensure the system record exists
    const { data: systemShed } = await adminClient
      .from('sheds')
      .select('id, config')
      .eq('shed_code', SYSTEM_SHED_CODE)
      .maybeSingle();

    if (!systemShed) {
      // Create it first
      const { error: insertError } = await adminClient
        .from('sheds')
        .insert({
          shed_code: SYSTEM_SHED_CODE,
          name: 'System Defaults',
          railway_zone: 'System',
          is_active: false,
          config,
        });

      if (insertError) {
        console.error('Failed to create system config:', insertError.message);
        return { success: false, error: 'Failed to save system configuration.' };
      }
    } else {
      const { error: updateError } = await adminClient
        .from('sheds')
        .update({ config })
        .eq('shed_code', SYSTEM_SHED_CODE);

      if (updateError) {
        console.error('Failed to update system config:', updateError.message);
        return { success: false, error: 'Failed to save system configuration.' };
      }

      // Audit log
      try {
        await adminClient.from('audit_logs').insert({
          user_id: auth.adminId,
          action: 'UPDATE_SYSTEM_CONFIG',
          entity_type: 'system_config',
          entity_id: systemShed.id,
          old_values: systemShed.config,
          new_values: config,
        });
      } catch {}
    }

    return { success: true, data: undefined };
  } catch (err) {
    console.error('Unexpected error in updateSystemConfig:', err);
    return { success: false, error: 'An unexpected error occurred.' };
  }
}

