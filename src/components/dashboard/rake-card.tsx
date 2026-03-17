'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  PackageX,
  ArrowRight,
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

const STAGE_BAR: Record<POHStage, string> = {
  Intake: 'bg-slate-300',
  Dismantling: 'bg-orange-200',
  Inspection: 'bg-amber-200',
  Overhaul: 'bg-yellow-200',
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
  Overhaul: 'bg-yellow-400',
  Reassembly: 'bg-sky-400',
  Finishing: 'bg-indigo-400',
  Testing: 'bg-violet-400',
  Trial: 'bg-teal-400',
  Release: 'bg-emerald-500',
};

function completionColor(pct: number): { stroke: string; text: string; bg: string } {
  if (pct >= 100) return { stroke: '#22c55e', text: 'text-green-600', bg: 'bg-green-50' };
  if (pct >= 75)  return { stroke: '#34d399', text: 'text-emerald-500', bg: 'bg-emerald-50' };
  if (pct >= 50)  return { stroke: '#2dd4bf', text: 'text-teal-500', bg: 'bg-teal-50' };
  if (pct >= 25)  return { stroke: '#38bdf8', text: 'text-sky-500', bg: 'bg-sky-50' };
  return { stroke: '#94a3b8', text: 'text-slate-400', bg: 'bg-slate-50' };
}

export function RakeCard({ rake }: RakeCardProps) {
  const hasDelays = rake.delayedCoachCount > 0;
  const hasMissing = rake.missingPartsCoachCount > 0;
  const estDays = Math.max(0, TOTAL_TARGET_DURATION - rake.elapsedDays);
  const ringColor = completionColor(rake.avgCompletionPercentage);
  const isOverdue = rake.elapsedDays > TOTAL_TARGET_DURATION;

  const activeStages = POH_STAGE_ORDER.filter(
    (s) => (rake.coachStages[s] || 0) > 0,
  );

  return (
    <Link
      href={`/rakes/${rake.id}`}
      className={cn(
        'group relative flex flex-col rounded-xl bg-white',
        'border border-gray-100/60 p-5',
        'transition-all duration-200 hover:shadow-md hover:border-gray-200/60',
      )}
    >
      {/* Row 1: Identity + completion ring */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <h3 className="truncate text-[15px] font-semibold text-gray-900 tracking-tight">
              {rake.rakeNumber}
            </h3>
            <ArrowRight className="h-3.5 w-3.5 text-gray-300 opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="rounded-md bg-gray-50/80 px-2 py-0.5 text-[10px] font-medium text-gray-500">
              {rake.rakeType}
            </span>
            <span className="rounded-md bg-gray-50/80 px-2 py-0.5 text-[10px] font-medium text-gray-500">
              {rake.pohType}
            </span>
            <span className="text-[10px] text-gray-300">·</span>
            <span className="text-[10px] text-gray-400">{rake.totalCoaches} coaches</span>
          </div>
        </div>

        {/* Completion ring */}
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
          <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" fill="none" stroke="#f3f4f6" strokeWidth="2.5" />
            <circle
              cx="18" cy="18" r="15" fill="none"
              stroke={ringColor.stroke} strokeWidth="2.5" strokeLinecap="round"
              strokeDasharray={`${rake.avgCompletionPercentage * 0.9425} 94.25`}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <span className={cn('absolute text-[10px] font-semibold tabular-nums', ringColor.text)}>
            {rake.avgCompletionPercentage}%
          </span>
        </div>
      </div>

      {/* Row 2: Key numbers */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <span className="text-[10px] text-gray-400">Elapsed</span>
          <p className="text-sm font-medium text-gray-800 tabular-nums">{rake.elapsedDays}d</p>
        </div>
        <div>
          <span className="text-[10px] text-gray-400">Remaining</span>
          <p className={cn('text-sm font-medium tabular-nums', isOverdue ? 'text-red-500' : 'text-gray-800')}>
            {isOverdue ? `${rake.elapsedDays - TOTAL_TARGET_DURATION}d over` : `~${estDays}d`}
          </p>
        </div>
        <div>
          <span className="text-[10px] text-gray-400">Stage</span>
          <p className="text-sm font-medium text-gray-800">{rake.currentStage}</p>
        </div>
      </div>

      {/* Row 3: Stage distribution */}
      <div className="mt-4">
        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-100/80">
          {POH_STAGE_ORDER.map((stage) => {
            const count = rake.coachStages[stage] || 0;
            if (count === 0) return null;
            const pct = (count / rake.totalCoaches) * 100;
            return (
              <div key={stage} className={cn('h-full transition-all duration-500', STAGE_BAR[stage])} style={{ width: `${pct}%` }} />
            );
          })}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
          {activeStages.map((stage) => (
            <span key={stage} className="flex items-center gap-1 text-[10px] text-gray-400">
              <span className={cn('inline-block h-1.5 w-1.5 rounded-full', STAGE_DOT[stage])} />
              {stage} ({rake.coachStages[stage]})
            </span>
          ))}
        </div>
      </div>

      {/* Row 4: Warnings */}
      {(hasDelays || hasMissing) && (
        <div className="mt-3 flex items-center gap-2 pt-3 border-t border-gray-100/60">
          {hasDelays && (
            <span className="flex items-center gap-1 rounded-md bg-orange-50/80 px-2 py-0.5 text-[10px] font-medium text-orange-500">
              <AlertTriangle className="h-3 w-3" />
              {rake.delayedCoachCount} delayed
            </span>
          )}
          {hasMissing && (
            <span className="flex items-center gap-1 rounded-md bg-amber-50/80 px-2 py-0.5 text-[10px] font-medium text-amber-500">
              <PackageX className="h-3 w-3" />
              {rake.missingPartsCoachCount} missing
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
