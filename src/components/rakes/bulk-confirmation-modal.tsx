'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Undo2, Loader2 } from 'lucide-react';
import type { BulkAction } from './bulk-actions-bar';
import type { CoachCardData } from './coach-grid';
import type { PartStatus, NoteType, ChecklistStatus } from '@/types';
import type { BulkResult, BulkPreviousState } from '@/lib/actions/bulk';
import { PART_NAMES } from '@/lib/constants';

export interface BulkConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (params: BulkActionParams) => Promise<{
    result: BulkResult;
    previousState: BulkPreviousState;
  } | null>;
  onUndo: (previousState: BulkPreviousState) => Promise<void>;
  action: BulkAction | null;
  selectedCoaches: CoachCardData[];
}

export interface BulkActionParams {
  action: BulkAction;
  partName?: string;
  partStatus?: PartStatus;
  partNotes?: string;
  partExpectedDate?: string;
  noteContent?: string;
  noteType?: NoteType;
  templateId?: string;
  checklistStatus?: ChecklistStatus;
}

const ACTION_LABELS: Record<BulkAction, { title: string; description: string }> = {
  'mark-stage-complete': {
    title: 'Mark Stage Complete',
    description:
      'This will mark the current stage as complete for all selected coaches and advance them to the next stage.',
  },
  'update-part-status': {
    title: 'Update Part Status',
    description: 'This will update the specified part status for all selected coaches.',
  },
  'add-note': {
    title: 'Add Note',
    description: 'This will add a note to all selected coaches.',
  },
  'update-checklist-item': {
    title: 'Update Checklist Item',
    description: 'This will update the specified checklist item for all selected coaches.',
  },
};

const PART_STATUS_OPTIONS: PartStatus[] = [
  'Not Started',
  'Dismantled',
  'Under Inspection',
  'Overhauled/Repaired',
  'Reassembled',
  'Tested',
  'Missing/Pending',
];

const NOTE_TYPE_OPTIONS: NoteType[] = ['General', 'Stage-Specific', 'Part-Specific'];
const CHECKLIST_STATUS_OPTIONS: ChecklistStatus[] = ['Not Started', 'In Progress', 'Completed'];

export function BulkConfirmationModal({
  open,
  onClose,
  onConfirm,
  onUndo,
  action,
  selectedCoaches,
}: BulkConfirmationModalProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [previousState, setPreviousState] = useState<BulkPreviousState | null>(null);
  const [undoing, setUndoing] = useState(false);
  const [undone, setUndone] = useState(false);

  // Form state for action-specific inputs
  const [partName, setPartName] = useState<string>(PART_NAMES[0]);
  const [partStatus, setPartStatus] = useState<PartStatus>('Not Started');
  const [partNotes, setPartNotes] = useState('');
  const [partExpectedDate, setPartExpectedDate] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('General');
  const [checklistStatus, setChecklistStatus] = useState<ChecklistStatus>('Completed');

  if (!action) return null;

  const { title, description } = ACTION_LABELS[action];

  const resetState = () => {
    setResult(null);
    setPreviousState(null);
    setUndone(false);
    setPartNotes('');
    setPartExpectedDate('');
    setNoteContent('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await onConfirm({
        action,
        partName,
        partStatus,
        partNotes: partNotes || undefined,
        partExpectedDate: partExpectedDate || undefined,
        noteContent,
        noteType,
        checklistStatus,
      });
      if (res) {
        setResult(res.result);
        setPreviousState(res.previousState);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUndo = async () => {
    if (!previousState) return;
    setUndoing(true);
    try {
      await onUndo(previousState);
      setUndone(true);
    } finally {
      setUndoing(false);
    }
  };

  // Results view
  if (result) {
    return (
      <Modal
        open={open}
        onClose={handleClose}
        title="Bulk Operation Results"
        className="max-w-lg"
        footer={
          <div className="flex items-center gap-2">
            {previousState && !undone && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleUndo}
                disabled={undoing}
              >
                {undoing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Undo2 className="h-3.5 w-3.5" />
                )}
                {undoing ? 'Undoing...' : 'Undo'}
              </Button>
            )}
            <Button variant="primary" onClick={handleClose}>
              Done
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {undone && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-sm text-blue-700 font-medium">
                Operation undone successfully. Changes have been reverted.
              </p>
            </div>
          )}

          {result.successful.length > 0 && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-green-800">
                  {result.successful.length} coach{result.successful.length !== 1 ? 'es' : ''} updated successfully
                </span>
              </div>
            </div>
          )}

          {result.failed.length > 0 && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-semibold text-red-800">
                  {result.failed.length} coach{result.failed.length !== 1 ? 'es' : ''} failed
                </span>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {result.failed.map((f) => (
                  <div key={f.coachId} className="flex items-start gap-2 text-xs text-red-700">
                    <span className="font-semibold shrink-0">{f.coachNumber}:</span>
                    <span>{f.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    );
  }

  // Confirmation view with action-specific form
  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Confirm: ${title}`}
      className="max-w-lg"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Processing...
              </>
            ) : (
              `Confirm (${selectedCoaches.length} coaches)`
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{description}</p>

        {/* Action-specific form fields */}
        {action === 'update-part-status' && (
          <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Part</label>
              <select
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              >
                {PART_NAMES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={partStatus}
                onChange={(e) => setPartStatus(e.target.value as PartStatus)}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              >
                {PART_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {partStatus === 'Missing/Pending' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes (required)</label>
                  <textarea
                    value={partNotes}
                    onChange={(e) => setPartNotes(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                    rows={2}
                    placeholder="Explain why the part is missing..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Expected Arrival Date (required)</label>
                  <input
                    type="date"
                    value={partExpectedDate}
                    onChange={(e) => setPartExpectedDate(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {action === 'add-note' && (
          <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Note Type</label>
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value as NoteType)}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              >
                {NOTE_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Content</label>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                rows={3}
                placeholder="Enter note content..."
              />
            </div>
          </div>
        )}

        {action === 'update-checklist-item' && (
          <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={checklistStatus}
                onChange={(e) => setChecklistStatus(e.target.value as ChecklistStatus)}
                className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
              >
                {CHECKLIST_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-500">
              Note: You will need to select the specific checklist item template from the coach detail view.
              This bulk action applies the selected status to the same checklist item across all selected coaches.
            </p>
          </div>
        )}

        {/* Affected coaches list */}
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
            Affected Coaches ({selectedCoaches.length})
          </p>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="flex flex-wrap gap-2">
              {selectedCoaches.map((coach) => (
                <div
                  key={coach.id}
                  className="flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-xs border border-gray-200"
                >
                  <span className="font-semibold text-gray-800">
                    {coach.coachNumber}
                  </span>
                  <Badge variant="gray" size="sm">
                    {coach.currentStage}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Warning for stage complete */}
        {action === 'mark-stage-complete' && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-xs text-amber-700">
              Individual timestamps will be recorded for each coach. Mandatory
              checklist validation only applies from Finishing stage onwards.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
