'use client';

import { useState, useMemo } from 'react';
import { Search, Plus, Pencil, Ban, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserFormModal } from './user-form-modal';
import { DeactivateDialog } from './deactivate-dialog';
import { deactivateUser, reactivateUser } from '@/lib/actions/admin-users';
import type { UserRecord } from '@/types';

interface UserListTableProps {
  users: UserRecord[];
  sheds: { id: string; name: string }[];
  onRefresh: () => void;
}

export function UserListTable({ users, sheds, onRefresh }: UserListTableProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [shedFilter, setShedFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | undefined>();
  const [deactivateTarget, setDeactivateTarget] = useState<UserRecord | null>(null);
  const [deactivateAction, setDeactivateAction] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [actionLoading, setActionLoading] = useState(false);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
      const matchesRole = !roleFilter || u.role === roleFilter;
      const matchesShed = !shedFilter || u.shed_assignments.some((s) => s.shed_id === shedFilter);
      return matchesSearch && matchesRole && matchesShed;
    });
  }, [users, search, roleFilter, shedFilter]);

  const handleEdit = (user: UserRecord) => {
    setEditUser(user);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditUser(undefined);
    setFormOpen(true);
  };

  const handleDeactivate = (user: UserRecord) => {
    setDeactivateTarget(user);
    setDeactivateAction(user.is_active ? 'deactivate' : 'reactivate');
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivateTarget) return;
    setActionLoading(true);
    try {
      const result = deactivateAction === 'deactivate'
        ? await deactivateUser(deactivateTarget.id)
        : await reactivateUser(deactivateTarget.id);
      if (result.success) {
        onRefresh();
      } else {
        alert(result.error);
      }
    } finally {
      setActionLoading(false);
      setDeactivateTarget(null);
    }
  };

  const roleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'info';
      case 'Senior_Section_Engineer': return 'success';
      case 'Junior_Engineer': return 'purple';
      case 'Technician': return 'warning';
      case 'Viewer': return 'gray';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Senior_Section_Engineer">Senior Section Engineer</option>
            <option value="Junior_Engineer">Junior Engineer</option>
            <option value="Technician">Technician</option>
            <option value="Viewer">Viewer</option>
          </select>
          <select
            value={shedFilter}
            onChange={(e) => setShedFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">All Sheds</option>
            {sheds.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <Button onClick={handleCreate} size="md">
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Username</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Role</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Shed(s)</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Section(s)</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                  No users found matching your filters.
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id} className={!user.is_active ? 'bg-gray-50 opacity-60' : ''}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    {user.full_name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{user.username}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{user.email}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Badge variant={roleBadgeColor(user.role) as 'info' | 'success' | 'warning' | 'gray'}>
                      {user.role.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {user.shed_assignments.map((s) => s.shed_name).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {user.section_assignments.length > 0
                      ? user.section_assignments.map((s) =>
                          s.sub_section ? `${s.section_name}/${s.sub_section}` : s.section_name
                        ).join(', ')
                      : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Badge variant={user.is_active ? 'success' : 'danger'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(user)}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="Edit user"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeactivate(user)}
                        className={`rounded p-1.5 ${
                          user.is_active
                            ? 'text-gray-400 hover:bg-red-50 hover:text-red-600'
                            : 'text-gray-400 hover:bg-green-50 hover:text-green-600'
                        }`}
                        title={user.is_active ? 'Deactivate user' : 'Reactivate user'}
                      >
                        {user.is_active ? <Ban className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <UserFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditUser(undefined); }}
        onSuccess={() => { setFormOpen(false); setEditUser(undefined); onRefresh(); }}
        user={editUser}
        sheds={sheds}
      />

      {deactivateTarget && (
        <DeactivateDialog
          open={!!deactivateTarget}
          onClose={() => setDeactivateTarget(null)}
          onConfirm={handleConfirmDeactivate}
          user={deactivateTarget}
          action={deactivateAction}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
