'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createUser, updateUser } from '@/lib/actions/admin-users';
import { createUserSchema, updateUserSchema } from '@/lib/validations/user';
import { MAIN_SECTIONS, SUB_SECTIONS } from '@/lib/constants';
import type { UserRecord, UserRole } from '@/types';

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: UserRecord;
  sheds: { id: string; name: string }[];
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Senior_Section_Engineer', label: 'Senior Section Engineer' },
  { value: 'Junior_Engineer', label: 'Junior Engineer' },
  { value: 'Technician', label: 'Technician' },
  { value: 'Viewer', label: 'Viewer' },
];

interface SectionAssignment {
  shed_id: string;
  section_name: string;
  sub_section?: string;
}

export function UserFormModal({ open, onClose, onSuccess, user, sheds }: UserFormModalProps) {
  const isEdit = !!user;

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('Technician');
  const [selectedSheds, setSelectedSheds] = useState<string[]>([]);
  const [sectionAssignments, setSectionAssignments] = useState<SectionAssignment[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (open) {
      if (user) {
        setEmail(user.email);
        setUsername(user.username);
        setFullName(user.full_name);
        setRole(user.role);
        setSelectedSheds(user.shed_assignments.map((s) => s.shed_id));
        setSectionAssignments(
          user.section_assignments.map((s) => ({
            shed_id: s.shed_id,
            section_name: s.section_name,
            sub_section: s.sub_section,
          })),
        );
      } else {
        setEmail('');
        setUsername('');
        setFullName('');
        setRole('Technician');
        setSelectedSheds([]);
        setSectionAssignments([]);
      }
      setErrors({});
      setServerError('');
    }
  }, [open, user]);

  const toggleShed = (shedId: string) => {
    setSelectedSheds((prev) => {
      if (prev.includes(shedId)) {
        setSectionAssignments((sa) => sa.filter((s) => s.shed_id !== shedId));
        return prev.filter((id) => id !== shedId);
      }
      return [...prev, shedId];
    });
  };

  // Toggle a main section (e.g. Electrical, Mechanical)
  const toggleMainSection = (shedId: string, sectionName: string) => {
    setSectionAssignments((prev) => {
      const hasMain = prev.some(
        (s) => s.shed_id === shedId && s.section_name === sectionName && !s.sub_section,
      );
      if (hasMain) {
        // Remove main section and all its sub-sections
        return prev.filter(
          (s) => !(s.shed_id === shedId && s.section_name === sectionName),
        );
      }
      return [...prev, { shed_id: shedId, section_name: sectionName }];
    });
  };

  // Toggle a sub-section (e.g. E1, M3)
  const toggleSubSection = (shedId: string, sectionName: string, subSection: string) => {
    setSectionAssignments((prev) => {
      const exists = prev.some(
        (s) => s.shed_id === shedId && s.section_name === sectionName && s.sub_section === subSection,
      );
      if (exists) {
        return prev.filter(
          (s) => !(s.shed_id === shedId && s.section_name === sectionName && s.sub_section === subSection),
        );
      }
      return [...prev, { shed_id: shedId, section_name: sectionName, sub_section: subSection }];
    });
  };

  const isMainChecked = (shedId: string, sectionName: string) =>
    sectionAssignments.some(
      (s) => s.shed_id === shedId && s.section_name === sectionName && !s.sub_section,
    );

  const isSubChecked = (shedId: string, sectionName: string, subSection: string) =>
    sectionAssignments.some(
      (s) => s.shed_id === shedId && s.section_name === sectionName && s.sub_section === subSection,
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError('');

    const formData = isEdit
      ? { user_id: user!.id, full_name: fullName, role, shed_ids: selectedSheds, section_assignments: sectionAssignments }
      : { email, username, full_name: fullName, role, shed_ids: selectedSheds, section_assignments: sectionAssignments };

    const schema = isEdit ? updateUserSchema : createUserSchema;
    const validation = schema.safeParse(formData);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const key = issue.path[0]?.toString() ?? 'form';
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const result = isEdit
        ? await updateUser(formData as Parameters<typeof updateUser>[0])
        : await createUser(formData as Parameters<typeof createUser>[0]);

      if (result.success) {
        onSuccess();
      } else {
        setServerError(result.error);
      }
    } catch {
      setServerError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit User' : 'Add User'} className="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{serverError}</div>
        )}

        <Input id="email" label="Email" type="email" value={email}
          onChange={(e) => setEmail(e.target.value)} disabled={isEdit}
          error={errors.email} placeholder="user@example.com" />

        <Input id="username" label="Username" value={username}
          onChange={(e) => setUsername(e.target.value)} disabled={isEdit}
          error={errors.username} placeholder="Enter username" />

        <Input id="full_name" label="Full Name" value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={errors.full_name} placeholder="Enter full name" />

        <div className="w-full">
          <label htmlFor="role" className="mb-1 block text-sm font-medium text-gray-700">Role</label>
          <select id="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200">
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role}</p>}
        </div>

        {/* Shed selection */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Assigned Shed(s)</label>
          <div className="space-y-2 rounded-md border border-gray-200 p-3 max-h-40 overflow-y-auto">
            {sheds.map((shed) => (
              <label key={shed.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={selectedSheds.includes(shed.id)}
                  onChange={() => toggleShed(shed.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                {shed.name}
              </label>
            ))}
            {sheds.length === 0 && <p className="text-sm text-gray-400">No sheds available</p>}
          </div>
          {errors.shed_ids && <p className="mt-1 text-xs text-red-600">{errors.shed_ids}</p>}
        </div>

        {/* Section & Sub-section assignments */}
        {selectedSheds.length > 0 && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Section & Sub-section Assignments</label>
            <div className="space-y-4 rounded-md border border-gray-200 p-3 max-h-72 overflow-y-auto">
              {selectedSheds.map((shedId) => {
                const shed = sheds.find((s) => s.id === shedId);
                return (
                  <div key={shedId}>
                    <p className="text-xs font-bold text-gray-700 mb-2 border-b pb-1">{shed?.name ?? shedId}</p>
                    <div className="space-y-3">
                      {MAIN_SECTIONS.map((section) => (
                        <div key={`${shedId}-${section}`}>
                          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                            <input type="checkbox" checked={isMainChecked(shedId, section)}
                              onChange={() => toggleMainSection(shedId, section)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            {section}
                          </label>
                          {/* Show sub-sections when main section is checked */}
                          {isMainChecked(shedId, section) && (
                            <div className="ml-6 mt-1 grid grid-cols-5 gap-1">
                              {SUB_SECTIONS.map((sub) => (
                                <label key={`${shedId}-${section}-${sub}`}
                                  className="flex items-center gap-1 text-xs cursor-pointer">
                                  <input type="checkbox"
                                    checked={isSubChecked(shedId, section, sub)}
                                    onChange={() => toggleSubSection(shedId, section, sub)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5" />
                                  {sub}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
