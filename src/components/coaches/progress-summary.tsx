'use client';

import { BarChart3, CheckCircle2, Package, Clock } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { TARGET_DURATIONS } from '@/lib/constants';
import { getPercentageConsumed } from '@/lib/utils/timeline';
import type { POHStage } from '@/types';

export interface ProgressSummaryProps {
  overallProgress: number;
  partsCompletion: number;
  checklistCompletion: number;
  currentStage: POHStage;
  elapsedDays: number;
}

export function ProgressSummary({
  overallProgress,
  partsCompletion,
  checklistCompletion,
  currentStage,
  elapsedDays,
}: ProgressSummaryProps) {
  const targetDays = TARGET_DURATIONS[currentStage];
  const stagePercent = getPercentageConsumed(elapsedDays, targetDays);

  const cards = [
    {
      label: 'Overall Progress',
      value: `${overallProgress}%`,
      progress: overallProgress,
      color: 'blue' as const,
      icon: BarChart3,
    },
    {
      label: 'Parts Completion',
      value: `${partsCompletion}%`,
      progress: partsCompletion,
      color: 'green' as const,
      icon: Package,
    },
    {
      label: 'Checklist Completion',
      value: `${checklistCompletion}%`,
      progress: checklistCompletion,
      color: 'green' as const,
      icon: CheckCircle2,
    },
    {
      label: `${currentStage} Elapsed`,
      value: `${elapsedDays}d / ${targetDays}d`,
      progress: stagePercent,
      color: stagePercent > 100 ? ('red' as const) : stagePercent > 80 ? ('yellow' as const) : ('blue' as const),
      icon: Clock,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardBody className="py-3 px-3">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <c.icon className="h-4 w-4" />
              <span className="text-xs font-medium">{c.label}</span>
            </div>
            <p className="text-lg font-bold text-gray-900 mb-2">{c.value}</p>
            <ProgressBar value={c.progress} size="sm" color={c.color} />
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
