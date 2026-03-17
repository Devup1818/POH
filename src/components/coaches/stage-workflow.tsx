'use client';

import { useState, useTransition, useMemo } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { updatePartStatus } from '@/lib/actions/parts';
import { StageIcon } from '@/components/coaches/stage-icons';
import { PartIcon } from '@/components/coaches/part-icons';
import { POH_STAGE_ORDER, TARGET_DURATIONS, PART_STATUS_TO_COMPLETED_STAGE, PART_STATUS_ORDER } from '@/lib/constants';
import type { POHStage, TimelineStatus, PartStatus } from '@/types';
import type { MockPart } from '@/lib/mock-data';

const STAGE_TO_PART_STATUS: Partial<Record<POHStage, PartStatus>> = {};
for (const [status, stage] of Object.entries(PART_STATUS_TO_COMPLETED_STAGE) as [PartStatus, POHStage][]) {
  STAGE_TO_PART_STATUS[stage] = status;
}

export interface StageHistoryEntry {
  stage: POHStage;
  startDate: string;
  completionDate: string | null;
  targetDurationDays: number;
  actualDurationDays: number | null;
  timelineStatus: TimelineStatus | null;
}

export interface StageWorkflowProps {
  stageHistory: StageHistoryEntry[];
  currentStage: POHStage;
  parts: MockPart[];
  onPartsChange?: (parts: MockPart[]) => void;
  allPartsReadyForAdvance: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  'On Schedule': 'text-emerald-600',
  'Ahead of Schedule': 'text-emerald-600',
  'Minor Delay': 'text-amber-600',
  'Significant Delay': 'text-red-600',
};

export function StageWorkflow({ stageHistory, currentStage, parts, onPartsChange, allPartsReadyForAdvance }: StageWorkflowProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [viewedStage, setViewedStage] = useState<POHStage>(currentStage);
  const [missingModal, setMissingModal] = useState<{ partId: string; partName: string } | null>(null);
  const [missingNotes, setMissingNotes] = useState('');
  const [missingDate, setMissingDate] = useState('');

  const currentStageIdx = POH_STAGE_ORDER.indexOf(currentStage);
  const viewedStageIdx = POH_STAGE_ORDER.indexOf(viewedStage);
  const isViewingCurrent = viewedStage === currentStage;
  const isViewingCompleted = viewedStageIdx < currentStageIdx;

  // Part status for the viewed stage
  const viewedPartStatus = STAGE_TO_PART_STATUS[viewedStage] ?? null;

  // Sort parts: incomplete first for current stage
  const sortedParts = useMemo(() => {
    if (!viewedPartStatus) return parts;
    const targetIdx = PART_STATUS_ORDER.indexOf(viewedPartStatus);
    return [...parts].sort((a, b) => {
      const aReady = PART_STATUS_ORDER.indexOf(a.status as PartStatus) >= targetIdx;
      const bReady = PART_STATUS_ORDER.indexOf(b.status as PartStatus) >= targetIdx;
      if (aReady === bReady) return 0;
      return aReady ? 1 : -1;
    });
  }, [parts, viewedPartStatus]);

  const partsCompleted = useMemo(() => {
    if (!viewedPartStatus) return 0;
    const targetIdx = PART_STATUS_ORDER.indexOf(viewedPartStatus);
    return parts.filter((p) => PART_STATUS_ORDER.indexOf(p.status as PartStatus) >= targetIdx).length;
  }, [parts, viewedPartStatus]);

  // Sync viewedStage when currentStage changes (e.g. after advance)
  const [prevCurrentStage, setPrevCurrentStage] = useState(currentStage);
  if (currentStage !== prevCurrentStage) {
    setPrevCurrentStage(currentStage);
    setViewedStage(currentStage);
  }

  const handleStatusChange = (partId: string, newStatus: PartStatus) => {
    const updatedParts = parts.map((p) =>
      p.id === partId ? { ...p, status: newStatus, statusUpdatedAt: new Date().toISOString() } : p,
    );
    onPartsChange?.(updatedParts);
    setError(null);
    startTransition(async () => {
      const result = await updatePartStatus(partId, newStatus);
      if (!result.success) {
        setError(result.error);
        onPartsChange?.(parts);
      }
    });
  };

  const handleMissingSubmit = () => {
    if (!missingModal) return;
    const updatedParts = parts.map((p) =>
      p.id === missingModal.partId
        ? { ...p, status: 'Missing/Pending' as PartStatus, notes: missingNotes, expectedArrivalDate: missingDate, statusUpdatedAt: new Date().toISOString() }
        : p,
    );
    onPartsChange?.(updatedParts);
    setMissingModal(null);
    setError(null);
    startTransition(async () => {
      const result = await updatePartStatus(missingModal.partId, 'Missing/Pending', missingNotes, missingDate);
      if (!result.success) {
        setError(result.error);
        onPartsChange?.(parts);
      }
    });
  };

  const handleStageClick = (stage: POHStage, idx: number) => {
    // Allow clicking completed stages and current stage
    if (idx <= currentStageIdx) {
      setViewedStage(stage);
    }
  };

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {/* Horizontal Stage Timeline */}
      <div className="rounded-xl border border-gray-100 bg-white px-6 py-5 shadow-sm overflow-x-auto">
        <div className="flex items-start justify-between min-w-max gap-0">
          {POH_STAGE_ORDER.map((stage, idx) => {
            const entry = stageHistory.find((h) => h.stage === stage);
            const hasStarted = entry?.startDate !== '' && entry?.startDate != null;
            // A stage before the current stage is always completed, even if history data is missing
            const isCompleted = idx < currentStageIdx || (hasStarted && entry?.completionDate != null);
            const isCurrent = stage === currentStage;
            const isClickable = idx <= currentStageIdx;
            const isViewed = stage === viewedStage;

            return (
              <div key={stage} className="flex items-start flex-1 min-w-0">
                <div
                  className={cn('flex flex-col items-center gap-2 w-full', isClickable && 'cursor-pointer group')}
                  onClick={() => handleStageClick(stage, idx)}
                  role={isClickable ? 'button' : undefined}
                  tabIndex={isClickable ? 0 : undefined}
                  aria-label={isClickable ? `View ${stage} stage` : undefined}
                >
                  {/* Step circle */}
                  <div className={cn(
                    'flex items-center justify-center rounded-full border-2 transition-all duration-200 h-10 w-10',
                    isCompleted
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : isCurrent
                        ? 'border-blue-500 bg-blue-50 text-blue-600 ring-4 ring-blue-100'
                        : 'border-gray-200 bg-gray-50 text-gray-400',
                    isViewed && !isCurrent && isCompleted && 'ring-4 ring-emerald-100',
                    isClickable && !isViewed && 'group-hover:scale-110',
                  )}>
                    {isCurrent ? (
                      <div className="relative">
                        <span className="absolute -inset-1 animate-ping rounded-full bg-blue-400 opacity-20" />
                        <StageIcon stage={stage} className="h-5 w-5 relative" />
                      </div>
                    ) : (
                      <StageIcon stage={stage} className="h-5 w-5" />
                    )}
                  </div>
                  {/* Label */}
                  <span className={cn(
                    'text-xs font-medium whitespace-nowrap text-center transition-colors duration-150',
                    isCompleted ? 'text-emerald-600' : isCurrent ? 'text-blue-600 font-semibold' : 'text-gray-400',
                    isViewed && 'underline underline-offset-4',
                  )}>
                    {stage}
                  </span>
                  {/* Duration info */}
                  {isCompleted && entry?.actualDurationDays != null && (
                    <span className={cn('text-[10px] font-medium tabular-nums', STATUS_COLORS[entry.timelineStatus ?? ''] ?? 'text-gray-400')}>
                      {entry.actualDurationDays}d / {entry.targetDurationDays}d
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[10px] text-blue-500 font-medium tabular-nums">
                      Target: {TARGET_DURATIONS[stage]}d
                    </span>
                  )}
                </div>
                {idx < POH_STAGE_ORDER.length - 1 && (
                  <div className={cn('h-0.5 flex-1 mt-5 min-w-4', isCompleted ? 'bg-emerald-400' : 'bg-gray-200')} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Parts for viewed stage */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-gray-800">{viewedStage}</h3>
            {isViewingCompleted && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">Done</span>
            )}
            {!isViewingCurrent && (
              <button onClick={() => setViewedStage(currentStage)} className="text-[11px] text-blue-600 hover:text-blue-500">
                ← Back to {currentStage}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isViewingCurrent && viewedPartStatus && (
              <span className="text-[11px] text-gray-400">Mark as <span className="font-medium text-gray-600">{viewedPartStatus === 'Under Inspection' ? 'Inspected' : viewedPartStatus}</span></span>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-xs tabular-nums font-medium text-gray-600">{partsCompleted}/{parts.length}</span>
              <div className="h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-emerald-400 transition-all duration-500" style={{ width: `${parts.length > 0 ? (partsCompleted / parts.length) * 100 : 0}%` }} />
              </div>
            </div>
          </div>
        </div>

        {isViewingCurrent && allPartsReadyForAdvance && (
          <div className="mx-4 mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
            <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="text-xs font-medium text-emerald-700">All parts ready — advance to the next stage</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 p-4">
          {sortedParts.map((part, idx) => {
            const isMissing = part.status === 'Missing/Pending';
            const partStatusIdx = PART_STATUS_ORDER.indexOf(part.status as PartStatus);
            const targetIdx = viewedPartStatus ? PART_STATUS_ORDER.indexOf(viewedPartStatus) : -1;
            const isDoneForStage = targetIdx >= 0 && partStatusIdx >= targetIdx;
            const nextStatus = isMissing ? null : (PART_STATUS_ORDER[partStatusIdx + 1] ?? null);
            const isFinal = part.status === 'Tested';
            const readOnly = isViewingCompleted;

            return (
              <div
                key={part.id}
                className={cn(
                  'group rounded-xl border px-3.5 py-3 transition-all duration-300 ease-out',
                  isDoneForStage
                    ? 'border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white'
                    : isMissing
                      ? 'border-red-100 bg-gradient-to-br from-red-50/50 to-white'
                      : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm',
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-300',
                      isDoneForStage ? 'bg-emerald-500 text-white'
                        : isMissing ? 'bg-red-100 text-red-500'
                        : 'border-2 border-gray-200 bg-white text-gray-400 group-hover:border-blue-300 group-hover:text-blue-500',
                    )}>
                      <PartIcon partName={part.partName} className="h-3.5 w-3.5" />
                    </div>
                    <span className={cn(
                      'text-sm font-medium truncate',
                      isDoneForStage ? 'text-emerald-700' : isMissing ? 'text-red-700' : 'text-gray-800',
                    )}>
                      {part.partName}
                    </span>
                  </div>
                  {isDoneForStage && (
                    <span className="text-[10px] font-medium text-emerald-600 shrink-0">{viewedPartStatus === 'Under Inspection' ? 'Inspected' : viewedPartStatus}</span>
                  )}
                </div>

                {isMissing && part.notes && (
                  <p className="mt-1.5 ml-[38px] text-[10px] text-red-400 truncate">{part.notes}</p>
                )}

                {!isDoneForStage && !readOnly && (
                  <div className="mt-2.5 ml-[38px] flex items-center gap-2">
                    {nextStatus && !isMissing && (
                      <button
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-500 active:scale-95 transition-all duration-150 disabled:opacity-50"
                        disabled={isPending}
                        onClick={() => handleStatusChange(part.id, nextStatus as PartStatus)}
                      >
                        <Check className="h-3 w-3" />
                        {nextStatus === 'Under Inspection' ? 'Inspected' : nextStatus}
                      </button>
                    )}
                    {!isMissing && !isFinal && (
                      <button
                        className="rounded-lg px-2 py-1.5 text-[11px] font-medium text-red-500 hover:bg-red-50 transition-colors duration-150 disabled:opacity-50"
                        disabled={isPending}
                        onClick={() => {
                          setMissingModal({ partId: part.id, partName: part.partName });
                          setMissingNotes('');
                          setMissingDate('');
                        }}
                      >
                        Mark Missing
                      </button>
                    )}
                    {isMissing && (
                      <button
                        className="rounded-lg px-2 py-1.5 text-[11px] font-medium text-gray-600 hover:bg-gray-100 transition-colors duration-150 disabled:opacity-50"
                        disabled={isPending}
                        onClick={() => handleStatusChange(part.id, 'Not Started')}
                      >
                        Re-enter
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Missing part modal */}
      {missingModal && (
        <Modal title={`Mark ${missingModal.partName} as Missing`} open={true} onClose={() => setMissingModal(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (required)</label>
              <Textarea placeholder="Why is this part missing?" value={missingNotes} onChange={(e) => setMissingNotes(e.target.value)} rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Arrival Date (required)</label>
              <Input type="date" value={missingDate} onChange={(e) => setMissingDate(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setMissingModal(null)}>Cancel</Button>
              <Button size="sm" onClick={handleMissingSubmit} disabled={!missingNotes.trim() || !missingDate}>Confirm</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
