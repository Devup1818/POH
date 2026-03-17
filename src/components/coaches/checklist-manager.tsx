'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';
import { MessageSquare, CheckCheck, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/modal';
import { updateChecklistItem, updateChecklistItemNotes, bulkMarkChecklistComplete } from '@/lib/actions/checklist';
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
  onItemsChange?: (items: ChecklistItemData[]) => void;
}

export function ChecklistManager({ items: initialItems, coachId, readOnly = false, onItemsChange }: ChecklistManagerProps) {
  const [items, setItems] = useState(initialItems);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mandatoryOnly, setMandatoryOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMarkAllConfirm, setShowMarkAllConfirm] = useState(false);
  const [isMarkingAll, startMarkAllTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(false);

  // Sync with parent when initialItems change (e.g. after tab switch back)
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // Propagate changes to parent
  const updateItems = (newItems: ChecklistItemData[]) => {
    setItems(newItems);
    onItemsChange?.(newItems);
  };

  const categories = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.category)));
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
  const incompleteCount = total - completed;

  const handleStatusChange = (itemId: string, newStatus: ChecklistStatus) => {
    if (readOnly) return;
    const itemCoachId = coachId || items.find((i) => i.id === itemId)?.coachId;
    if (!itemCoachId) return;

    const newItems = items.map((i) =>
      i.id === itemId
        ? { ...i, status: newStatus, completionDate: newStatus === 'Completed' ? new Date().toISOString() : null }
        : i,
    );
    updateItems(newItems);
    setError(null);
    updateChecklistItem(itemId, itemCoachId, newStatus).then((result) => {
      if (!result.success) { setError(result.error); updateItems(initialItems); }
    });
  };

  const handleMarkAllComplete = () => {
    if (readOnly || !coachId) return;
    const now = new Date().toISOString();
    const newItems = items.map((i) =>
      i.status !== 'Completed' ? { ...i, status: 'Completed' as ChecklistStatus, completionDate: now } : i,
    );
    updateItems(newItems);
    setShowMarkAllConfirm(false);
    setError(null);

    startMarkAllTransition(async () => {
      const result = await bulkMarkChecklistComplete(coachId);
      if (!result.success) {
        setError(result.error);
        updateItems(initialItems);
      }
    });
  };

  const handleNotesUpdate = (itemId: string, notes: string) => {
    if (readOnly) return;
    const itemCoachId = coachId || items.find((i) => i.id === itemId)?.coachId;
    if (!itemCoachId) return;
    const newItems = items.map((i) => (i.id === itemId ? { ...i, notes } : i));
    updateItems(newItems);
    updateChecklistItemNotes(itemId, itemCoachId, notes).then((result) => {
      if (!result.success) setError(result.error);
    });
  };

  const hasActiveFilters = categoryFilter !== 'all' || statusFilter !== 'all' || mandatoryOnly;

  return (
    <div className="space-y-4">
      {readOnly && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-700">
          Reference mode — this checklist is read-only.
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {/* Header bar: progress + actions */}
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-gray-800">Checklist</span>
                <span className="text-xs tabular-nums text-gray-500">{completed}/{total} completed</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500 ease-out',
                    completionPct === 100 ? 'bg-emerald-500' : completionPct >= 50 ? 'bg-blue-500' : 'bg-amber-400',
                  )}
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-400"><span className="text-red-500 font-bold">*</span> mandatory</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-150',
                hasActiveFilters
                  ? 'border-blue-200 bg-blue-50 text-blue-600'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100',
              )}
            >
              <Filter className="h-3 w-3" />
              Filters
              {hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
            </button>
            {!readOnly && incompleteCount > 0 && (
              <Button
                size="sm"
                variant="primary"
                className="gap-1.5 text-xs"
                onClick={() => setShowMarkAllConfirm(true)}
                disabled={isMarkingAll}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {isMarkingAll ? 'Marking...' : 'Mark All Complete'}
              </Button>
            )}
          </div>
        </div>

        {/* Collapsible filters */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 w-full sm:w-auto"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 w-full sm:w-auto"
            >
              <option value="all">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={mandatoryOnly}
                onChange={(e) => setMandatoryOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
              />
              Mandatory only
            </label>
            {hasActiveFilters && (
              <button
                onClick={() => { setCategoryFilter('all'); setStatusFilter('all'); setMandatoryOnly(false); }}
                className="text-xs text-blue-600 hover:text-blue-700 underline underline-offset-2"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grouped checklist items */}
      {Array.from(grouped.entries()).map(([category, catItems]) => {
        const catCompleted = catItems.filter((i) => i.status === 'Completed').length;
        return (
          <div key={category} className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50 border-b border-gray-100">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{category}</h4>
              <span className="text-[10px] tabular-nums text-gray-400">{catCompleted}/{catItems.length}</span>
            </div>
            <div className="divide-y divide-gray-50">
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
          </div>
        );
      })}

      {grouped.size === 0 && (
        <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-sm text-center">
          <p className="text-sm text-gray-400">No checklist items match your filters.</p>
        </div>
      )}

      {/* Mark All Confirmation */}
      <ConfirmModal
        open={showMarkAllConfirm}
        onClose={() => setShowMarkAllConfirm(false)}
        onConfirm={handleMarkAllComplete}
        title="Mark All Complete"
        message={`This will mark ${incompleteCount} remaining checklist item(s) as Completed. Are you sure?`}
        confirmLabel="Mark All Complete"
      />
    </div>
  );
}

const STATUS_OPTIONS: { value: ChecklistStatus; label: string; activeClass: string; inactiveClass: string }[] = [
  {
    value: 'Not Started',
    label: 'Not Started',
    activeClass: 'bg-gray-600 text-white border-gray-600',
    inactiveClass: 'border-gray-200 text-gray-500 hover:bg-gray-50',
  },
  {
    value: 'In Progress',
    label: 'In Progress',
    activeClass: 'bg-blue-600 text-white border-blue-600',
    inactiveClass: 'border-blue-200 text-blue-600 hover:bg-blue-50',
  },
  {
    value: 'Completed',
    label: 'Completed',
    activeClass: 'bg-emerald-600 text-white border-emerald-600',
    inactiveClass: 'border-emerald-200 text-emerald-600 hover:bg-emerald-50',
  },
];

function ChecklistRow({
  item, onStatusChange, onNotesUpdate, readOnly,
}: {
  item: ChecklistItemData;
  onStatusChange: (id: string, status: ChecklistStatus) => void;
  onNotesUpdate: (id: string, notes: string) => void;
  readOnly: boolean;
}) {
  const [showNotes, setShowNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(item.notes ?? '');
  const [savingNotes, setSavingNotes] = useState(false);

  const isCompleted = item.status === 'Completed';

  const handleCheckboxToggle = () => {
    if (readOnly) return;
    onStatusChange(item.id, isCompleted ? 'Not Started' : 'Completed');
  };

  const handleSaveNotes = () => {
    setSavingNotes(true);
    onNotesUpdate(item.id, notesValue);
    setTimeout(() => setSavingNotes(false), 500);
  };

  return (
    <div className={cn('px-4 py-3', item.isMandatory && 'border-l-2 border-l-red-400')}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={handleCheckboxToggle}
          disabled={readOnly}
          className={cn(
            'mt-1 h-4 w-4 shrink-0 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 transition-colors duration-150',
            readOnly && 'cursor-not-allowed opacity-60',
          )}
          aria-label={isCompleted ? 'Mark as not started' : 'Mark as completed'}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={cn(
                'text-sm leading-snug',
                isCompleted ? 'text-gray-900' : 'text-gray-800',
              )}>
                {item.description}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-mono text-gray-400">
                  {item.itemCode}{item.isMandatory && <span className="text-red-500 font-bold">*</span>}
                </span>
                <span className="text-[10px] text-gray-300">·</span>
                <span className="text-[10px] text-gray-400">{item.rdsoSmiReference}</span>
                {isCompleted && item.completionDate && (
                  <>
                    <span className="text-[10px] text-gray-300">·</span>
                    <span className="text-[10px] tabular-nums text-emerald-500">{formatDateIST(item.completionDate)}</span>
                  </>
                )}
              </div>
            </div>

            {/* Right-side: status buttons + notes */}
            <div className="flex items-center gap-2 shrink-0">
              {!readOnly && (
                <div className="flex items-center gap-1">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => onStatusChange(item.id, opt.value)}
                      className={cn(
                        'rounded-md border px-2 py-0.5 text-[10px] font-medium transition-all duration-150',
                        item.status === opt.value ? opt.activeClass : opt.inactiveClass,
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
              {readOnly && (
                <span className={cn(
                  'rounded-md border px-2 py-0.5 text-[10px] font-medium',
                  isCompleted ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                    : item.status === 'In Progress' ? 'border-blue-200 bg-blue-50 text-blue-600'
                    : 'border-gray-200 bg-gray-50 text-gray-500',
                )}>
                  {item.status}
                </span>
              )}
              <button
                onClick={() => setShowNotes(!showNotes)}
                className={cn(
                  'rounded-lg p-1.5 transition-colors duration-150',
                  showNotes || item.notes
                    ? 'bg-amber-50 text-amber-600'
                    : 'text-gray-300 hover:text-gray-500 hover:bg-gray-50',
                )}
                aria-label="Toggle notes"
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notes expansion */}
      {showNotes && (
        <div className="mt-2 ml-7 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
          {readOnly ? (
            <p className="text-xs text-gray-500 whitespace-pre-wrap">{item.notes || 'No notes.'}</p>
          ) : (
            <div className="space-y-2">
              <textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="Add a note..."
                rows={2}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="rounded-lg bg-gray-100 px-3 py-1 text-[10px] font-medium text-gray-600 hover:bg-gray-200 transition-colors duration-150 disabled:opacity-50"
                >
                  {savingNotes ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
