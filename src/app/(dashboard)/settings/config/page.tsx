'use client';

import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Info, Save } from 'lucide-react';
import Link from 'next/link';
import { RoleGuard } from '@/components/auth/role-guard';
import { Button } from '@/components/ui/button';
import {
  getSystemConfig,
  updateSystemConfig,
} from '@/lib/actions/sheds';
import type { ShedConfig } from '@/lib/actions/sheds';
import { POH_STAGE_ORDER } from '@/lib/constants';

export default function SystemConfigPage() {
  return (
    <RoleGuard allowedRoles={['Admin']} showAccessDenied>
      <SystemConfigContent />
    </RoleGuard>
  );
}

function SystemConfigContent() {
  const [config, setConfig] = useState<ShedConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadConfig = useCallback(async () => {
    setLoading(true);
    const result = await getSystemConfig();
    if (result.success) {
      setConfig(result.data);
      setError('');
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleDurationChange = (stage: string, value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    setConfig((prev) =>
      prev
        ? { ...prev, target_durations: { ...prev.target_durations, [stage]: num } }
        : prev,
    );
    setSuccess('');
  };

  const handleThresholdChange = (key: 'minor' | 'significant', value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    setConfig((prev) =>
      prev
        ? { ...prev, delay_thresholds: { ...prev.delay_thresholds, [key]: num } }
        : prev,
    );
    setSuccess('');
  };

  const handleNotifToggle = (key: keyof ShedConfig['notification_preferences']) => {
    setConfig((prev) =>
      prev
        ? {
            ...prev,
            notification_preferences: {
              ...prev.notification_preferences,
              [key]: !prev.notification_preferences[key],
            },
          }
        : prev,
    );
    setSuccess('');
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setError('');
    setSuccess('');
    const result = await updateSystemConfig(config);
    setSaving(false);
    if (result.success) {
      setSuccess('Configuration saved successfully.');
    } else {
      setError(result.error);
    }
  };

  const notifLabels: Record<keyof ShedConfig['notification_preferences'], string> = {
    stage_completion: 'Stage Completion',
    significant_delay: 'Significant Delay',
    missing_parts: 'Missing Parts',
    testing_complete: 'Testing Complete',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-800">System Configuration</h1>
        </div>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">System Configuration</h1>
            <p className="mt-0.5 text-xs text-gray-400">
              Default target durations, delay thresholds, and notification preferences
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <p className="text-sm text-blue-700">
          Changes apply to new rakes only, not existing active rakes. Shed-specific
          overrides can be configured in Shed Management.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Target Durations */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-800">
          Target Durations
        </h2>
        <p className="mt-1 text-xs text-gray-400">
          Standard number of days for each POH stage (total: 20 days)
        </p>
        <div className="mt-4 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
          {POH_STAGE_ORDER.map((stage) => (
            <div key={stage} className="flex items-center gap-2">
              <label className="text-xs text-gray-600 w-24 shrink-0">{stage}</label>
              <input
                type="number"
                min={0}
                value={config.target_durations[stage] ?? 0}
                onChange={(e) => handleDurationChange(stage, e.target.value)}
                className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
              />
              <span className="text-xs text-gray-400">days</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Total:{' '}
          <span className="font-medium text-gray-600">
            {Object.values(config.target_durations).reduce((a, b) => a + b, 0)} days
          </span>
        </p>
      </div>

      {/* Delay Thresholds */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-800">
          Delay Thresholds
        </h2>
        <p className="mt-1 text-xs text-gray-400">
          Number of days over target duration that triggers delay classification
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-lg border border-yellow-100 bg-yellow-50/50 px-4 py-3">
            <div className="h-3 w-3 shrink-0 rounded-full bg-yellow-400" />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-700">Minor Delay</p>
              <p className="text-[11px] text-gray-400">Days over target to flag as minor</p>
            </div>
            <input
              type="number"
              min={0}
              value={config.delay_thresholds.minor}
              onChange={(e) => handleThresholdChange('minor', e.target.value)}
              className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-red-100 bg-red-50/50 px-4 py-3">
            <div className="h-3 w-3 shrink-0 rounded-full bg-red-400" />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-700">Significant Delay</p>
              <p className="text-[11px] text-gray-400">Days over target to flag as significant</p>
            </div>
            <input
              type="number"
              min={0}
              value={config.delay_thresholds.significant}
              onChange={(e) => handleThresholdChange('significant', e.target.value)}
              className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-800">
          Notification Preferences
        </h2>
        <p className="mt-1 text-xs text-gray-400">
          Default notification types enabled for new sheds
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(
            Object.keys(notifLabels) as Array<keyof ShedConfig['notification_preferences']>
          ).map((key) => (
            <label
              key={key}
              className="flex items-center gap-3 rounded-lg border border-gray-100 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={config.notification_preferences[key]}
                onChange={() => handleNotifToggle(key)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{notifLabels[key]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}
