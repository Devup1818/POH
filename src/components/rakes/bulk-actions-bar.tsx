'use client';

import {
  CheckCircle,
  Wrench,
  StickyNote,
  ListChecks,
  Clock,
  X,
} from 'lucide-react';
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
        'flex flex-col gap-2 border-t border-gray-100 bg-white/95 backdrop-blur-md px-5 py-3.5 sm:flex-row sm:items-center sm:gap-3 sm:rounded-2xl sm:border sm:border-gray-200/60 sm:px-5',
        'shadow-xl shadow-black/5 transition-all duration-200 animate-fade-in-up',
      )}
    >
      {/* Selected count + clear */}
      <div className="flex items-center justify-between gap-2 sm:border-r sm:border-gray-100 sm:pr-4">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-[11px] font-semibold text-blue-600 tabular-nums">
            {selectedCount}
          </span>
          <span className="text-xs text-gray-500">
            of {totalCoaches} selected
          </span>
        </div>
        <button
          onClick={onClearSelection}
          className="rounded-lg p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-300 hover:bg-gray-50 hover:text-gray-500 transition-colors sm:hidden"
          aria-label="Clear selection"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
        {[
          { action: 'mark-stage-complete' as BulkAction, icon: CheckCircle, label: 'Advance Stage', primary: true },
          { action: 'update-part-status' as BulkAction, icon: Wrench, label: 'Update Part', primary: false },
          { action: 'add-note' as BulkAction, icon: StickyNote, label: 'Add Note', primary: false },
          { action: 'update-checklist-item' as BulkAction, icon: ListChecks, label: 'Checklist', primary: false },
        ].map(({ action, icon: Icon, label, primary }) => (
          <button
            key={action}
            onClick={() => onAction(action)}
            className={cn(
              'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150',
              primary
                ? 'bg-gray-900 text-white hover:bg-gray-800 active:scale-[0.97]'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-800',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Separator */}
      <div className="hidden h-5 w-px bg-gray-100 sm:block" />

      {/* Quick select */}
      <div className="flex items-center gap-1 border-t border-gray-50 pt-2 sm:border-t-0 sm:pt-0">
        <button
          onClick={onSelectAllInStage}
          className="rounded-lg px-2.5 py-2 min-h-[44px] sm:min-h-0 sm:py-1.5 text-[11px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          All in Stage
        </button>
        <button
          onClick={onSelectAllDelayed}
          className="rounded-lg px-2.5 py-2 min-h-[44px] sm:min-h-0 sm:py-1.5 text-[11px] font-medium text-amber-500 hover:bg-amber-50 transition-colors"
        >
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Delayed
          </span>
        </button>
      </div>

      {/* Clear - desktop */}
      <button
        onClick={onClearSelection}
        className="ml-0.5 hidden rounded-lg p-1.5 text-gray-300 hover:bg-gray-50 hover:text-gray-500 transition-colors sm:block"
        aria-label="Clear selection"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
