'use client';

import { cn } from '@/lib/utils';
import { StageIcon } from '@/components/coaches/stage-icons';
import type { POHStage } from '@/types';
import { POH_STAGE_ORDER } from '@/lib/constants';

const STAGE_COLORS: Record<POHStage, { bar: string; text: string }> = {
  Intake:      { bar: 'bg-slate-300',   text: 'text-slate-500' },
  Dismantling: { bar: 'bg-orange-300',  text: 'text-orange-500' },
  Inspection:  { bar: 'bg-amber-300',   text: 'text-amber-500' },
  Overhaul:    { bar: 'bg-cyan-300',    text: 'text-cyan-500' },
  Reassembly:  { bar: 'bg-sky-300',     text: 'text-sky-500' },
  Finishing:   { bar: 'bg-indigo-300',  text: 'text-indigo-500' },
  Testing:     { bar: 'bg-violet-300',  text: 'text-violet-500' },
  Trial:       { bar: 'bg-teal-300',    text: 'text-teal-500' },
  Release:     { bar: 'bg-emerald-400', text: 'text-emerald-500' },
};

export interface StageProgressChartProps {
  coachStages: Record<POHStage, number>;
  totalCoaches: number;
}

export function StageProgressChart({ coachStages, totalCoaches }: StageProgressChartProps) {
  const maxCount = Math.max(...POH_STAGE_ORDER.map((s) => coachStages[s] || 0), 1);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-gray-800">Stage Distribution</h2>
        <span className="text-[10px] text-gray-400 tabular-nums">{totalCoaches} coaches</span>
      </div>
      <div className="space-y-2">
        {POH_STAGE_ORDER.map((stage) => {
          const count = coachStages[stage] || 0;
          const pct = totalCoaches > 0 ? (count / maxCount) * 100 : 0;
          const hasCoaches = count > 0;

          return (
            <div key={stage} className="group flex items-center gap-3">
              <div className="flex w-24 shrink-0 items-center gap-2 justify-end">
                <StageIcon
                  stage={stage}
                  className={cn('h-3.5 w-3.5 shrink-0', hasCoaches ? STAGE_COLORS[stage].text : 'text-gray-300')}
                />
                <span className={cn(
                  'text-[11px] leading-none',
                  hasCoaches ? 'text-gray-600 font-medium' : 'text-gray-350',
                )}>
                  {stage}
                </span>
              </div>
              <div className="flex-1 h-3 overflow-hidden rounded-full bg-gray-50">
                {hasCoaches && (
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700 ease-out',
                      STAGE_COLORS[stage].bar,
                    )}
                    style={{ width: `${pct}%`, minWidth: '14px' }}
                  />
                )}
              </div>
              <span className={cn(
                'w-5 text-right text-[11px] font-medium tabular-nums',
                hasCoaches ? STAGE_COLORS[stage].text : 'text-gray-300',
              )}>
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
