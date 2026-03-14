'use client';

import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { RoleGuard } from '@/components/auth/role-guard';
import { fetchUsers } from '@/lib/actions/admin-users';
import { UserListTable } from '@/components/admin/user-list-table';
import type { UserRecord } from '@/types';

export default function SettingsUsersPage() {
  return (
    <RoleGuard allowedRoles={['Admin']} showAccessDenied>
      <UserManagementContent />
    </RoleGuard>
  );
}

function UserManagementContent() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [sheds, setSheds] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchUsers();
      if (result.success) {
        setUsers(result.data);
      } else {
        setError(result.error);
      }

      const supabase = createClient();
      const { data: shedData } = await supabase
        .from('sheds')
        .select('id, name')
        .order('name');
      setSheds(shedData ?? []);
    } catch {
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-gray-800">User Management</h1>
          <p className="mt-0.5 text-xs text-gray-400">
            Create, edit, and manage user accounts and their assignments
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <UserListTable users={users} sheds={sheds} onRefresh={loadData} />
    </div>
  );
}
