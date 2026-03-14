'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  PackageX,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { POHStage, POHType, RakeType } from '@/types';
import { POH_STAGE_ORDER, TOTAL_TARGET_DURATION } from '@/lib/constants';

export interface RakeCardData {
  id: string;
  rakeNumber: string;
  rakeType: RakeType;
  pohType: POHType;
  shedId: string;
  shedName: string;
  currentStage: POHStage;
  elapsedDays: number;
  totalCoaches: number;
  coachStages: Record<POHStage, number>;
  delayedCoachCount: number;
  missingPartsCoachCount: number;
  avgCompletionPercentage: number;
}

interface RakeCardProps {
  rake: RakeCardData;
}

/* Muted pastel palette for stage segments */
const STAGE_BAR: Record<POHStage, string> = {
  Intake: 'bg-slate-300',
  Dismantling: 'bg-orange-200',
  Inspection: 'bg-amber-200',
  Reassembly: 'bg-sky-200',
  Finishing: 'bg-indigo-200',
  Testing: 'bg-violet-200',
  Trial: 'bg-teal-200',
  Release: 'bg-emerald-300',
};

const STAGE_DOT: Record<POHStage, string> = {
  Intake: 'bg-slate-400',
  Dismantling: 'bg-orange-400',
  Inspection: 'bg-amber-400',
  Reassembly: 'bg-sky-400',
  Finishing: 'bg-indigo-400',
  Testing: 'bg-violet-400',
  Trial: 'bg-teal-400',
  Release: 'bg-emerald-500',
};

/** Returns a stroke color and matching text class based on completion % */
function completionColor(pct: number): { stroke: string; text: string } {
  if (pct >= 100) return { stroke: '#22c55e', text: 'text-green-600' };   // green-500
  if (pct >= 75)  return { stroke: '#34d399', text: 'text-emerald-500' }; // emerald-400
  if (pct >= 50)  return { stroke: '#2dd4bf', text: 'text-teal-500' };    // teal-400
  if (pct >= 25)  return { stroke: '#38bdf8', text: 'text-sky-500' };     // sky-400
  return { stroke: '#94a3b8', text: 'text-slate-400' };                   // slate-400
}

export function RakeCard({ rake }: RakeCardProps) {
  const hasDelays = rake.delayedCoachCount > 0;
  const hasMissing = rake.missingPartsCoachCount > 0;
  const estDays = Math.max(0, TOTAL_TARGET_DURATION - rake.elapsedDays);
  const ringColor = completionColor(rake.avgCompletionPercentage);
  const isOverdue = rake.elapsedDays > TOTAL_TARGET_DURATION;

  /* Build the stages that actually have coaches for the legend */
  const activeStages = POH_STAGE_ORDER.filter(
    (s) => (rake.coachStages[s] || 0) > 0,
  );

  return (
    <Link
      href={`/rakes/${rake.id}`}
      className={cn(
        'group relative flex flex-col rounded-xl border border-gray-100 bg-white p-5',
        'shadow-sm transition-all duration-200 hover:shadow-md hover:border-gray-200',
      )}
    >
      {/* ── Row 1: Identity ─────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-gray-900">
            {rake.rakeNumber}
          </h3>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="rounded bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 ring-1 ring-gray-200/60">
              {rake.rakeType}
            </span>
            <span className="rounded bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 ring-1 ring-gray-200/60">
              {rake.pohType}
            </span>
          </div>
        </div>

        {/* Completion ring */}
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
          <svg className="h-11 w-11 -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18" cy="18" r="15"
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="3"
            />
            <circle
              cx="18" cy="18" r="15"
              fill="none"
              stroke={ringColor.stroke}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${rake.avgCompletionPercentage * 0.9425} 94.25`}
              className="transition-all duration-500"
            />
          </svg>
          <span className={cn('absolute text-[10px] font-semibold', ringColor.text)}>
            {rake.avgCompletionPercentage}%
          </span>
        </div>
      </div>

      {/* ── Row 2: Key numbers ──────────────────────────── */}
      <div className="mt-4 flex items-center gap-5 text-xs">
        <div>
          <span className="text-gray-400">Elapsed</span>
          <p className="font-medium text-gray-700">{rake.elapsedDays} days</p>
        </div>
        <div>
          <span className="text-gray-400">Remaining</span>
          <p className={cn(
            'font-medium',
            isOverdue ? 'text-red-600' : 'text-gray-700',
          )}>
            {isOverdue ? `${rake.elapsedDays - TOTAL_TARGET_DURATION}d overdue` : `~${estDays} days`}
          </p>
        </div>
        <div>
          <span className="text-gray-400">Coaches</span>
          <p className="font-medium text-gray-700">{rake.totalCoaches}</p>
        </div>
      </div>

      {/* ── Row 3: Stage progress bar ───────────────────── */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Stage Distribution
          </span>
          <span className="text-[10px] text-gray-400">
            Current: {rake.currentStage}
          </span>
        </div>
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-gray-100">
          {POH_STAGE_ORDER.map((stage) => {
            const count = rake.coachStages[stage] || 0;
            if (count === 0) return null;
            const pct = (count / rake.totalCoaches) * 100;
            return (
              <div
                key={stage}
                className={cn('h-full', STAGE_BAR[stage])}
                style={{ width: `${pct}%` }}
              />
            );
          })}
        </div>
        {/* Mini legend */}
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
          {activeStages.map((stage) => (
            <span key={stage} className="flex items-center gap-1 text-[10px] text-gray-500">
              <span className={cn('inline-block h-1.5 w-1.5 rounded-full', STAGE_DOT[stage])} />
              {stage} ({rake.coachStages[stage]})
            </span>
          ))}
        </div>
      </div>

      {/* ── Row 4: Warnings ─────────────────────────────── */}
      {(hasDelays || hasMissing) && (
        <div className="mt-3 flex items-center gap-3 border-t border-gray-50 pt-3">
          {hasDelays && (
            <span className="flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-600">
              <AlertTriangle className="h-3 w-3" />
              {rake.delayedCoachCount} delayed
            </span>
          )}
          {hasMissing && (
            <span className="flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-600">
              <PackageX className="h-3 w-3" />
              {rake.missingPartsCoachCount} missing parts
            </span>
          )}
        </div>
      )}

      {/* Hover indicator */}
      <ChevronRight className="absolute bottom-5 right-4 h-4 w-4 text-gray-200 opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}
