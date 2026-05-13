'use client';

import { cn } from '@/lib/utils';
import type { POHStage } from '@/types';
import { POH_STAGE_ORDER } from '@/lib/constants';

const STAGE_COLORS: Record<POHStage, { bar: string; text: string }> = {
  Intake: { bar: 'bg-slate-400', text: 'text-slate-600' },
  Dismantling: { bar: 'bg-orange-400', text: 'text-orange-600' },
  Inspection: { bar: 'bg-amber-400', text: 'text-amber-600' },
  Overhaul: { bar: 'bg-rose-400', text: 'text-rose-600' },
  Reassembly: { bar: 'bg-sky-400', text: 'text-sky-600' },
  Finishing: { bar: 'bg-indigo-400', text: 'text-indigo-600' },
  Testing: { bar: 'bg-violet-400', text: 'text-violet-600' },
  Trial: { bar: 'bg-teal-400', text: 'text-teal-600' },
  Release: { bar: 'bg-emerald-500', text: 'text-emerald-600' },
};

export interface StageProgressChartProps {
  coachStages: Record<POHStage, number>;
  totalCoaches: number;
}

export function StageProgressChart({ coachStages, totalCoaches }: StageProgressChartProps) {
  const maxCount = Math.max(...POH_STAGE_ORDER.map((s) => coachStages[s] || 0), 1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-gray-800">
        Stage Distribution
      </h2>
      <div className="space-y-2.5">
        {POH_STAGE_ORDER.map((stage) => {
          const count = coachStages[stage] || 0;
          const pct = totalCoaches > 0 ? (count / maxCount) * 100 : 0;

          return (
            <div key={stage} className="flex items-center gap-3">
              <span className="w-20 sm:w-24 shrink-0 text-right text-[10px] sm:text-xs text-gray-500">
                {stage}
              </span>
              <div className="flex-1">
                <div className="h-5 w-full overflow-hidden rounded bg-gray-100">
                  {count > 0 && (
                    <div
                      className={cn(
                        'flex h-full items-center rounded transition-all duration-300',
                        STAGE_COLORS[stage].bar,
                      )}
                      style={{ width: `${pct}%`, minWidth: count > 0 ? '24px' : '0' }}
                    >
                      <span className="px-1.5 text-[10px] font-semibold text-white">
                        {count}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <span
                className={cn(
                  'w-6 text-right text-xs font-medium',
                  count > 0 ? STAGE_COLORS[stage].text : 'text-gray-300',
                )}
              >
                {count}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-right text-[10px] text-gray-400">
        Total: {totalCoaches} coaches
      </p>
    </div>
  );
}
