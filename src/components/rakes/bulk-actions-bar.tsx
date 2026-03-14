'use client';

import {
  CheckCircle,
  Wrench,
  StickyNote,
  ListChecks,
  Clock,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type BulkAction =
  | 'mark-stage-complete'
  | 'update-part-status'
  | 'add-note'
  | 'update-checklist-item';

export interface BulkActionsBarProps {
  selectedCount: number;
  totalCoaches: number;
  onAction: (action: BulkAction) => void;
  onSelectAllInStage: () => void;
  onSelectAllDelayed: () => void;
  onClearSelection: () => void;
}

export function BulkActionsBar({
  selectedCount,
  totalCoaches,
  onAction,
  onSelectAllInStage,
  onSelectAllDelayed,
  onClearSelection,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 sm:bottom-6 sm:left-1/2 sm:right-auto sm:-translate-x-1/2',
        'flex flex-col gap-2 rounded-t-xl border border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:gap-3 sm:rounded-xl sm:px-5',
        'shadow-lg transition-all duration-200',
      )}
    >
      {/* Selected count + clear */}
      <div className="flex items-center justify-between gap-2 sm:border-r sm:border-gray-200 sm:pr-4">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-800">
            {selectedCount} of {totalCoaches} selected
          </span>
        </div>
        <button
          onClick={onClearSelection}
          className="rounded-md p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors sm:hidden"
          aria-label="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Action buttons - horizontal scroll on mobile */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
        <Button
          variant="primary"
          size="sm"
          onClick={() => onAction('mark-stage-complete')}
          className="whitespace-nowrap"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          Mark Stage Complete
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onAction('update-part-status')}
          className="whitespace-nowrap"
        >
          <Wrench className="h-3.5 w-3.5" />
          Update Part
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onAction('add-note')}
          className="whitespace-nowrap"
        >
          <StickyNote className="h-3.5 w-3.5" />
          Add Note
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => onAction('update-checklist-item')}
          className="whitespace-nowrap"
        >
          <ListChecks className="h-3.5 w-3.5" />
          Checklist
        </Button>
      </div>

      {/* Separator - desktop only */}
      <div className="hidden h-6 w-px bg-gray-200 sm:block" />

      {/* Quick select buttons */}
      <div className="flex items-center gap-2 border-t border-gray-100 pt-2 sm:border-t-0 sm:pt-0">
        <button
          onClick={onSelectAllInStage}
          className="rounded-md px-2.5 py-2 min-h-[44px] sm:min-h-0 sm:py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
        >
          Select All in Stage
        </button>
        <button
          onClick={onSelectAllDelayed}
          className="rounded-md px-2.5 py-2 min-h-[44px] sm:min-h-0 sm:py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 transition-colors"
        >
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Select Delayed
          </span>
        </button>
      </div>

      {/* Clear selection - desktop only */}
      <button
        onClick={onClearSelection}
        className="ml-1 hidden rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors sm:block"
        aria-label="Clear selection"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
