'use client';

import { useState, useMemo } from 'react';
import { Shield, CheckCircle2, Circle, Loader2, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Select } from '@/components/ui/select';
import { updateChecklistItem, updateChecklistItemNotes } from '@/lib/actions/checklist';
import { formatDateIST } from '@/lib/utils/date';
import type { ChecklistStatus } from '@/types';

export interface ChecklistItemData {
  id: string;
  coachId: string;
  itemCode: string;
  description: string;
  category: string;
  rdsoSmiReference: string;
  isMandatory: boolean;
  executionOrder: number;
  status: ChecklistStatus;
  completionDate: string | null;
  notes?: string | null;
}

export interface ChecklistManagerProps {
  items: ChecklistItemData[];
  coachId?: string;
  readOnly?: boolean;
}



const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Not Started', label: 'Not Started' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
];

const ITEM_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'Not Started', label: 'Not Started' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
];

export function ChecklistManager({ items: initialItems, coachId, readOnly = false }: ChecklistManagerProps) {
  const [items, setItems] = useState(initialItems);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mandatoryOnly, setMandatoryOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(items.map((i) => i.category)));
    return ['all', ...cats];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (mandatoryOnly && !item.isMandatory) return false;
      return true;
    });
  }, [items, categoryFilter, statusFilter, mandatoryOnly]);

  const grouped = useMemo(() => {
    const map = new Map<string, ChecklistItemData[]>();
    for (const item of filtered) {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [filtered]);

  const total = items.length;
  const completed = items.filter((i) => i.status === 'Completed').length;
  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleStatusChange = (itemId: string, newStatus: ChecklistStatus) => {
    if (readOnly) return;

    const itemCoachId = coachId || items.find((i) => i.id === itemId)?.coachId;
    if (!itemCoachId) return;

    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? {
              ...i,
              status: newStatus,
              completionDate: newStatus === 'Completed' ? new Date().toISOString() : null,
            }
          : i,
      ),
    );
    setError(null);

    updateChecklistItem(itemId, itemCoachId, newStatus).then((result) => {
      if (!result.success) {
        setError(result.error);
        setItems(initialItems);
      }
    });
  };

  const handleNotesUpdate = (itemId: string, notes: string) => {
    if (readOnly) return;

    const itemCoachId = coachId || items.find((i) => i.id === itemId)?.coachId;
    if (!itemCoachId) return;

    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, notes } : i)),
    );

    updateChecklistItemNotes(itemId, itemCoachId, notes).then((result) => {
      if (!result.success) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="space-y-4">
      {readOnly && (
        <div className="rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-700">
          Reference mode — this checklist is read-only.
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardBody className="py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Checklist Completion</span>
            <span className="text-sm font-bold text-gray-900">
              {completed}/{total} ({completionPct}%)
            </span>
          </div>
          <ProgressBar value={completionPct} size="md" color="green" />
        </CardBody>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
        <Select
          options={categories.map((c) => ({
            value: c,
            label: c === 'all' ? 'All Categories' : c,
          }))}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full sm:w-48"
        />
        <Select
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-40"
        />
        <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={mandatoryOnly}
            onChange={(e) => setMandatoryOnly(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Mandatory only
        </label>
      </div>

      {Array.from(grouped.entries()).map(([category, catItems]) => (
        <Card key={category}>
          <CardHeader className="py-2.5">
            <h4 className="text-sm font-semibold text-gray-800">{category}</h4>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-100">
              {catItems.map((item) => (
                <ChecklistRow
                  key={item.id}
                  item={item}
                  onStatusChange={handleStatusChange}
                  onNotesUpdate={handleNotesUpdate}
                  readOnly={readOnly}
                />
              ))}
            </div>
          </CardBody>
        </Card>
      ))}

      {grouped.size === 0 && (
        <p className="py-8 text-center text-sm text-gray-400">No checklist items match filters.</p>
      )}
    </div>
  );
}

function ChecklistRow({
  item,
  onStatusChange,
  onNotesUpdate,
  readOnly,
}: {
  item: ChecklistItemData;
  onStatusChange: (id: string, status: ChecklistStatus) => void;
  onNotesUpdate: (id: string, notes: string) => void;
  readOnly: boolean;
}) {
  const [showNotes, setShowNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(item.notes ?? '');
  const [savingNotes, setSavingNotes] = useState(false);

  const statusIcon =
    item.status === 'Completed' ? (
      <CheckCircle2 className="h-4 w-4 text-green-500" />
    ) : item.status === 'In Progress' ? (
      <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
    ) : (
      <Circle className="h-4 w-4 text-gray-300" />
    );

  const statusVariant: Record<ChecklistStatus, 'success' | 'info' | 'gray'> = {
    Completed: 'success',
    'In Progress': 'info',
    'Not Started': 'gray',
  };

  const handleSaveNotes = () => {
    setSavingNotes(true);
    onNotesUpdate(item.id, notesValue);
    setTimeout(() => setSavingNotes(false), 500);
  };

  return (
    <div
      className={cn(
        'flex flex-col px-4 py-3',
        item.isMandatory && 'border-l-2 border-l-red-400 bg-red-50/30',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="pt-0.5">{statusIcon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-400">{item.itemCode}</span>
                {item.isMandatory && (
                  <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-600">
                    <Shield className="h-3 w-3" />
                    Mandatory
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-800 mt-0.5">{item.description}</p>
              <p className="text-xs text-gray-400 mt-0.5">RDSO: {item.rdsoSmiReference}</p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <Badge variant={statusVariant[item.status]} size="sm">{item.status}</Badge>
              {!readOnly && (
                <Select
                  options={ITEM_STATUS_OPTIONS}
                  value={item.status}
                  onChange={(e) => onStatusChange(item.id, e.target.value as ChecklistStatus)}
                  className="text-xs w-32"
                />
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {item.completionDate && (
              <p className="text-xs text-gray-400">Completed: {formatDateIST(item.completionDate)}</p>
            )}
            {!readOnly && (
              <button
                type="button"
                onClick={() => setShowNotes(!showNotes)}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              >
                <MessageSquare className="h-3 w-3" />
                {item.notes ? 'Edit Notes' : 'Add Notes'}
                {showNotes ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
            {readOnly && item.notes && (
              <button
                type="button"
                onClick={() => setShowNotes(!showNotes)}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              >
                <MessageSquare className="h-3 w-3" />
                View Notes
                {showNotes ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {showNotes && (
        <div className="ml-7 mt-2">
          {readOnly ? (
            <p className="text-xs text-gray-600 bg-gray-50 rounded p-2">{item.notes}</p>
          ) : (
            <div className="flex gap-2">
              <textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="Add notes for this checklist item..."
                className="flex-1 text-xs border border-gray-200 rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={2}
              />
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="self-end px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {savingNotes ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
