'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Plus,
  Pencil,
  Power,
  Settings2,
  ArrowLeft,
  Train,
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { RoleGuard } from '@/components/auth/role-guard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal, ConfirmModal } from '@/components/ui/modal';
import {
  fetchSheds,
  createShed,
  updateShed,
  toggleShedActive,
  updateShedConfig,
} from '@/lib/actions/sheds';
import type { ShedRecord, ShedConfig } from '@/lib/actions/sheds';
import { POH_STAGE_ORDER } from '@/lib/constants';
import { DotsLoader } from '@/components/ui/dots-loader';

export default function ShedManagementPage() {
  return (
    <RoleGuard allowedRoles={['Admin']} showAccessDenied>
      <ShedManagementContent />
    </RoleGuard>
  );
}

function ShedManagementContent() {
  const router = useRouter();
  const [sheds, setSheds] = useState<ShedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingShed, setEditingShed] = useState<ShedRecord | null>(null);
  const [configuringShed, setConfiguringShed] = useState<ShedRecord | null>(null);
  const [toggleShed, setToggleShed] = useState<ShedRecord | null>(null);

  const loadSheds = useCallback(async () => {
    setLoading(true);
    const result = await fetchSheds();
    if (result.success) {
      setSheds(result.data);
      setError('');
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSheds();
  }, [loadSheds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <DotsLoader size="lg" color="blue" />
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
            <h1 className="text-xl font-semibold text-gray-800">Shed Management</h1>
            <p className="mt-0.5 text-xs text-gray-400">
              Add, edit, and configure maintenance shed locations
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4" />
          Add Shed
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Shed List */}
      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-3 font-medium text-gray-500">Shed Code</th>
              <th className="px-4 py-3 font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 font-medium text-gray-500">Railway Zone</th>
              <th className="px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 font-medium text-gray-500">Active Rakes</th>
              <th className="px-4 py-3 font-medium text-gray-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sheds.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  No sheds configured yet.
                </td>
              </tr>
            ) : (
              sheds.map((shed) => (
                <tr
                  key={shed.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50"
                >
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-semibold text-gray-700">
                      {shed.shed_code}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-900">{shed.name}</td>
                  <td className="px-4 py-3 text-gray-600">{shed.railway_zone}</td>
                  <td className="px-4 py-3">
                    <Badge variant={shed.is_active ? 'success' : 'gray'} size="sm">
                      {shed.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-gray-600">
                      <Train className="h-3.5 w-3.5" />
                      {shed.rake_count}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingShed(shed)}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="Edit shed"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setConfiguringShed(shed)}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                        title="Configure settings"
                      >
                        <Settings2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setToggleShed(shed)}
                        className={`rounded-md p-1.5 ${
                          shed.is_active
                            ? 'text-gray-400 hover:bg-red-50 hover:text-red-600'
                            : 'text-gray-400 hover:bg-green-50 hover:text-green-600'
                        }`}
                        title={shed.is_active ? 'Deactivate shed' : 'Activate shed'}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Shed Modal */}
      {showAddModal && (
        <AddShedModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadSheds();
          }}
        />
      )}

      {/* Edit Shed Modal */}
      {editingShed && (
        <EditShedModal
          shed={editingShed}
          onClose={() => setEditingShed(null)}
          onSuccess={() => {
            setEditingShed(null);
            loadSheds();
          }}
        />
      )}

      {/* Configure Shed Modal */}
      {configuringShed && (
        <ConfigureShedModal
          shed={configuringShed}
          onClose={() => setConfiguringShed(null)}
          onSuccess={() => {
            setConfiguringShed(null);
            loadSheds();
          }}
        />
      )}

      {/* Toggle Active Confirm */}
      {toggleShed && (
        <ToggleActiveConfirm
          shed={toggleShed}
          onClose={() => setToggleShed(null)}
          onSuccess={() => {
            setToggleShed(null);
            loadSheds();
          }}
        />
      )}
    </div>
  );
}

/* ─── Add Shed Modal ─── */
function AddShedModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [shedCode, setShedCode] = useState('');
  const [name, setName] = useState('');
  const [railwayZone, setRailwayZone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    const result = await createShed({
      shed_code: shedCode,
      name,
      railway_zone: railwayZone,
    });
    setSaving(false);
    if (result.success) {
      onSuccess();
    } else {
      setError(result.error);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Add New Shed"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !shedCode.trim() || !name.trim() || !railwayZone.trim()}
          >
            {saving ? 'Creating…' : 'Create Shed'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}
        <Input
          id="shed-code"
          label="Shed Code"
          placeholder="e.g. GZB-EMU"
          value={shedCode}
          onChange={(e) => setShedCode(e.target.value.toUpperCase())}
        />
        <Input
          id="shed-name"
          label="Shed Name"
          placeholder="e.g. EMU Car Shed, Ghaziabad"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          id="railway-zone"
          label="Railway Zone"
          placeholder="e.g. Northern Railway"
          value={railwayZone}
          onChange={(e) => setRailwayZone(e.target.value)}
        />
      </div>
    </Modal>
  );
}

/* ─── Edit Shed Modal ─── */
function EditShedModal({
  shed,
  onClose,
  onSuccess,
}: {
  shed: ShedRecord;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(shed.name);
  const [railwayZone, setRailwayZone] = useState(shed.railway_zone);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    const result = await updateShed({
      id: shed.id,
      name,
      railway_zone: railwayZone,
    });
    setSaving(false);
    if (result.success) {
      onSuccess();
    } else {
      setError(result.error);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit Shed — ${shed.shed_code}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !name.trim() || !railwayZone.trim()}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {error && <p className="text-xs text-red-600">{error}</p>}
        <Input
          id="edit-name"
          label="Shed Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          id="edit-zone"
          label="Railway Zone"
          value={railwayZone}
          onChange={(e) => setRailwayZone(e.target.value)}
        />
      </div>
    </Modal>
  );
}

/* ─── Toggle Active Confirm ─── */
function ToggleActiveConfirm({
  shed,
  onClose,
  onSuccess,
}: {
  shed: ShedRecord;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    setSaving(true);
    const result = await toggleShedActive(shed.id);
    setSaving(false);
    if (result.success) {
      onSuccess();
    }
  };

  const action = shed.is_active ? 'Deactivate' : 'Activate';

  return (
    <ConfirmModal
      open
      onClose={onClose}
      onConfirm={handleConfirm}
      title={`${action} Shed`}
      message={
        shed.is_active
          ? `Deactivating "${shed.name}" will prevent new rake registrations at this shed. Historical data will be preserved. ${
              shed.rake_count > 0
                ? `There are currently ${shed.rake_count} active rake(s) at this shed.`
                : ''
            }`
          : `Reactivating "${shed.name}" will allow new rake registrations at this shed.`
      }
      confirmLabel={saving ? `${action.slice(0, -1)}ing…` : action}
      variant={shed.is_active ? 'danger' : 'primary'}
    />
  );
}

/* ─── Configure Shed Modal ─── */
function ConfigureShedModal({
  shed,
  onClose,
  onSuccess,
}: {
  shed: ShedRecord;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [config, setConfig] = useState<ShedConfig>(() => ({
    target_durations: { ...shed.config.target_durations },
    delay_thresholds: { ...shed.config.delay_thresholds },
    notification_preferences: { ...shed.config.notification_preferences },
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleDurationChange = (stage: string, value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    setConfig((prev) => ({
      ...prev,
      target_durations: { ...prev.target_durations, [stage]: num },
    }));
  };

  const handleThresholdChange = (key: 'minor' | 'significant', value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) return;
    setConfig((prev) => ({
      ...prev,
      delay_thresholds: { ...prev.delay_thresholds, [key]: num },
    }));
  };

  const handleNotifToggle = (key: keyof ShedConfig['notification_preferences']) => {
    setConfig((prev) => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [key]: !prev.notification_preferences[key],
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const result = await updateShedConfig(shed.id, config);
    setSaving(false);
    if (result.success) {
      onSuccess();
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

  return (
    <Modal
      open
      onClose={onClose}
      title={`Configure — ${shed.shed_code}`}
      className="max-w-lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Configuration'}
          </Button>
        </>
      }
    >
      <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
        {error && <p className="text-xs text-red-600">{error}</p>}

        {/* Target Durations */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">
            Target Durations (days per stage)
          </h3>
          <p className="text-xs text-gray-400 mb-3">
            Changes apply to new rakes only, not existing active rakes.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {POH_STAGE_ORDER.map((stage) => (
              <div key={stage} className="flex items-center gap-2">
                <label className="text-xs text-gray-600 w-24 shrink-0">{stage}</label>
                <input
                  type="number"
                  min={0}
                  value={config.target_durations[stage] ?? 0}
                  onChange={(e) => handleDurationChange(stage, e.target.value)}
                  className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Delay Thresholds */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">
            Delay Thresholds (days over target)
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 w-24 shrink-0">Minor</label>
              <input
                type="number"
                min={0}
                value={config.delay_thresholds.minor}
                onChange={(e) => handleThresholdChange('minor', e.target.value)}
                className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-600 w-24 shrink-0">Significant</label>
              <input
                type="number"
                min={0}
                value={config.delay_thresholds.significant}
                onChange={(e) => handleThresholdChange('significant', e.target.value)}
                className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">
            Notification Preferences
          </h3>
          <div className="space-y-2">
            {(
              Object.keys(notifLabels) as Array<keyof ShedConfig['notification_preferences']>
            ).map((key) => (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer"
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
      </div>
    </Modal>
  );
}
