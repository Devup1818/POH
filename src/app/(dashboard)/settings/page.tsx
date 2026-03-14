'use client';

import { Settings, Building2, Users, Wrench } from 'lucide-react';
import Link from 'next/link';
import { RoleGuard } from '@/components/auth/role-guard';

const SETTINGS_SECTIONS = [
  {
    href: '/settings/sheds',
    label: 'Shed Management',
    description: 'Add, edit, or deactivate maintenance shed locations',
    icon: Building2,
  },
  {
    href: '/settings/users',
    label: 'User Management',
    description: 'Manage users, roles, and shed assignments',
    icon: Users,
  },
  {
    href: '/settings/config',
    label: 'System Configuration',
    description: 'Target durations, delay thresholds, and notification preferences',
    icon: Wrench,
  },
];

export default function SettingsPage() {
  return (
    <RoleGuard allowedRoles={['Admin']} showAccessDenied>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">Settings</h1>
          <p className="mt-0.5 text-xs text-gray-400">
            System configuration and administration
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SETTINGS_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.href}
                className="group rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/30"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 group-hover:bg-blue-100">
                  <Icon className="h-5 w-5 text-gray-500 group-hover:text-blue-600" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-gray-900">{section.label}</h3>
                <p className="mt-1 text-xs text-gray-500">{section.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </RoleGuard>
  );
}
