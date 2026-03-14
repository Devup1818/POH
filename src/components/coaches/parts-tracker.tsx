'use client';

import { useState, useTransition } from 'react';
import { AlertTriangle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatDateIST } from '@/lib/utils/date';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { updatePartStatus } from '@/lib/actions/parts';
import type { MockPart } from '@/lib/mock-data';
import type { PartStatus } from '@/types';

export interface PartsTrackerProps {
  parts: MockPart[];
}

const PART_STATUS_OPTIONS: { value: PartStatus; label: string }[] = [
  { value: 'Not Started', label: 'Not Started' },
  { value: 'Dismantled', label: 'Dismantled' },
  { value: 'Under Inspection', label: 'Under Inspection' },
  { value: 'Overhauled/Repaired', label: 'Overhauled/Repaired' },
  { value: 'Reassembled', label: 'Reassembled' },
  { value: 'Tested', label: 'Tested' },
  { value: 'Missing/Pending', label: 'Missing/Pending' },
];

const statusVariant: Record<PartStatus, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'blue' | 'purple' | 'gray'> = {
  'Not Started': 'gray',
  'Dismantled': 'info',
  'Under Inspection': 'blue',
  'Overhauled/Repaired': 'purple',
  'Reassembled': 'success',
  'Tested': 'success',
  'Missing/Pending': 'danger',
};



export function PartsTracker({ parts }: PartsTrackerProps) {
  const [localParts, setLocalParts] = useState(parts);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Missing/Pending modal state
  const [missingModal, setMissingModal] = useState<{ partId: string; partName: string } | null>(null);
  const [missingNotes, setMissingNotes] = useState('');
  const [missingDate, setMissingDate] = useState('');

  const total = localParts.length;
  const completed = localParts.filter(
    (p) => p.status === 'Tested' || p.status === 'Reassembled',
  ).length;
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleStatusChange = (partId: string, newStatus: string) => {
    if (newStatus === 'Missing/Pending') {
      const part = localParts.find((p) => p.id === partId);
      setMissingModal({ partId, partName: part?.partName ?? '' });
      setMissingNotes('');
      setMissingDate('');
      return;
    }

    // Optimistic update
    setLocalParts((prev) =>
      prev.map((p) =>
        p.id === partId
          ? { ...p, status: newStatus as PartStatus, statusUpdatedAt: new Date().toISOString() }
          : p,
      ),
    );
    setError(null);

    startTransition(async () => {
      const result = await updatePartStatus(partId, newStatus as PartStatus);
      if (!result.success) {
        setError(result.error);
        setLocalParts(parts); // revert
      }
    });
  };

  const handleMissingSubmit = () => {
    if (!missingModal) return;
    const { partId } = missingModal;

    setLocalParts((prev) =>
      prev.map((p) =>
        p.id === partId
          ? {
              ...p,
              status: 'Missing/Pending' as PartStatus,
              notes: missingNotes,
              expectedArrivalDate: missingDate,
              statusUpdatedAt: new Date().toISOString(),
            }
          : p,
      ),
    );
    setMissingModal(null);
    setError(null);

    startTransition(async () => {
      const result = await updatePartStatus(partId, 'Missing/Pending', missingNotes, missingDate);
      if (!result.success) {
        setError(result.error);
        setLocalParts(parts);
      }
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardBody className="py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Parts Completion</span>
            <span className="text-sm font-bold text-gray-900">{completionPct}%</span>
          </div>
          <ProgressBar value={completionPct} size="md" color="green" />
        </CardBody>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {localParts.map((part) => {
          const isMissing = part.status === 'Missing/Pending';
          return (
            <Card key={part.id} className={cn(isMissing && 'border-red-300 bg-red-50/30')}>
              <CardBody className="py-3 px-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-gray-900">{part.partName}</h4>
                  {isMissing && <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                </div>
                <Badge variant={statusVariant[part.status]} size="sm">{part.status}</Badge>
                <Select
                  options={PART_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                  value={part.status}
                  onChange={(e) => handleStatusChange(part.id, e.target.value)}
                  className="text-xs"
                  disabled={isPending}
                />
                <p className="text-xs text-gray-400">Updated: {formatDateIST(part.statusUpdatedAt)}</p>
                {isMissing && (
                  <div className="space-y-2 rounded-md border border-red-200 bg-red-50 p-2">
                    <p className="text-xs text-red-700">{part.notes || 'No notes'}</p>
                    <div className="flex items-center gap-1.5 text-xs text-red-600">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Expected: {part.expectedArrivalDate ? formatDateIST(part.expectedArrivalDate) : 'Not set'}</span>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Missing/Pending modal */}
      {missingModal && (
        <Modal
          title={`Mark ${missingModal.partName} as Missing/Pending`}
          open={true}
          onClose={() => setMissingModal(null)}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (required)</label>
              <Textarea
                placeholder="Explain why this part is missing..."
                value={missingNotes}
                onChange={(e) => setMissingNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Arrival Date (required)</label>
              <Input type="date" value={missingDate} onChange={(e) => setMissingDate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setMissingModal(null)}>Cancel</Button>
              <Button
                size="sm"
                onClick={handleMissingSubmit}
                disabled={!missingNotes.trim() || !missingDate}
              >
                Confirm
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
