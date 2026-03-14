'use server';

import { createClient } from '@/lib/supabase/server';

export async function getGeolocation(ip: string): Promise<{
  latitude: number | null;
  longitude: number | null;
} | null> {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=lat,lon`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      latitude: data.lat ?? null,
      longitude: data.lon ?? null,
    };
  } catch {
    return null;
  }
}

export async function createLoginAuditLog(
  userId: string,
  ipAddress: string
): Promise<void> {
  try {
    const geo = await getGeolocation(ipAddress);
    const supabase = await createClient();
    await supabase.from('login_audit_logs').insert({
      user_id: userId,
      ip_address: ipAddress,
      latitude: geo?.latitude ?? null,
      longitude: geo?.longitude ?? null,
    });
  } catch {
    // Database insert failure must not block login
    console.error('Failed to create login audit log');
  }
}
