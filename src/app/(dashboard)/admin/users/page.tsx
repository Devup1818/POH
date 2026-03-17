'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getClientUser } from '@/lib/supabase/get-user-or-dev';
import { fetchUsers } from '@/lib/actions/admin-users';
import { UserListTable } from '@/components/admin/user-list-table';
import type { UserRecord } from '@/types';
import { DotsLoader } from '@/components/ui/dots-loader';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [sheds, setSheds] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const loadData = async () => {
    try {
      const { supabase, userId } = await getClientUser();
      if (!userId) { router.push('/login'); return; }

      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile?.role !== 'Admin') { router.push('/'); return; }
      setAuthorized(true);

      // Fetch users via server action
      const result = await fetchUsers();
      if (result.success) setUsers(result.data);

      // Fetch sheds
      const { data: shedData } = await supabase
        .from('sheds')
        .select('id, name')
        .order('name');
      setSheds(shedData ?? []);
    } catch {
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <DotsLoader size="lg" color="blue" />
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create, edit, and manage user accounts and their assignments.
        </p>
      </div>
      <UserListTable users={users} sheds={sheds} onRefresh={loadData} />
    </div>
  );
}
