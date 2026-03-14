'use client';

import { useState, useTransition } from 'react';
import { Zap, Wrench, Wind, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { updateTestStatus } from '@/lib/actions/testing';
import { POH_STAGE_ORDER } from '@/lib/constants';
import type { POHStage, TestStatus, TestType } from '@/types';
import { formatDateTimeIST } from '@/lib/utils/date';

export interface TestData {
  id: string;
  coachId: string;
  testType: TestType;
  status: TestStatus;
  startDate: string | null;
  completionDate: string | null;
  completedBy: string | null;
  notes: string | null;
}

export interface TestingPanelProps {
  tests: TestData[];
  currentStage: POHStage;
}

const TEST_ICONS: Record<TestType, typeof Zap> = {
  Electrical: Zap,
  Mechanical: Wrench,
  Pneumatic: Wind,
};

const TEST_COLORS: Record<TestType, string> = {
  Electrical: 'text-yellow-600',
  Mechanical: 'text-blue-600',
  Pneumatic: 'text-cyan-600',
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'Not Started', label: 'Not Started' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
];

const statusVariant: Record<TestStatus, 'gray' | 'info' | 'success'> = {
  'Not Started': 'gray',
  'In Progress': 'info',
  Completed: 'success',
};



export function TestingPanel({ tests, currentStage }: TestingPanelProps) {
  const [localTests, setLocalTests] = useState(tests);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  const stageIdx = POH_STAGE_ORDER.indexOf(currentStage);
  const isTestingStage = currentStage === 'Testing';
  const isPastTesting = stageIdx > 5;

  const completedCount = localTests.filter((t) => t.status === 'Completed').length;
  const totalTests = localTests.length || 3;
  const completionPct = Math.round((completedCount / totalTests) * 100);
  const allComplete = completedCount === totalTests && totalTests > 0;

  const handleStatusChange = (testId: string, testType: TestType, newStatus: string) => {
    const coachId = localTests[0]?.coachId ?? '';

    // Optimistic update
    setLocalTests((prev) =>
      prev.map((t) =>
        t.id === testId
          ? {
              ...t,
              status: newStatus as TestStatus,
              startDate: newStatus === 'In Progress' ? new Date().toISOString() : (newStatus === 'Not Started' ? null : t.startDate),
              completionDate: newStatus === 'Completed' ? new Date().toISOString() : (newStatus === 'Not Started' ? null : null),
              completedBy: newStatus === 'Completed' ? 'You' : (newStatus === 'Not Started' ? null : t.completedBy),
            }
          : t,
      ),
    );
    setError(null);

    const notes = editingNotes[testId];

    startTransition(async () => {
      const result = await updateTestStatus(coachId, testType, newStatus as TestStatus, notes);
      if (!result.success) {
        setError(result.error);
        // Revert optimistic update
        setLocalTests(tests);
      }
    });
  };

  const handleNotesChange = (testId: string, value: string) => {
    setEditingNotes((prev) => ({ ...prev, [testId]: value }));
  };

  const handleNotesSave = (testId: string, testType: TestType) => {
    const coachId = localTests[0]?.coachId ?? '';
    const notes = editingNotes[testId];
    if (notes === undefined) return;

    startTransition(async () => {
      const test = localTests.find((t) => t.id === testId);
      if (!test) return;
      const result = await updateTestStatus(coachId, testType, test.status, notes);
      if (!result.success) {
        setError(result.error);
      } else {
        setLocalTests((prev) =>
          prev.map((t) => (t.id === testId ? { ...t, notes } : t)),
        );
      }
    });
  };

  if (stageIdx < 5) {
    return (
      <Card>
        <CardBody className="py-12 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-gray-300 mb-3" />
          <p className="text-sm text-gray-400">
            Testing is available when the coach reaches the Testing stage.
          </p>
          <p className="text-xs text-gray-300 mt-1">Current stage: {currentStage}</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card>
        <CardBody className="py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Testing Completion</span>
              {allComplete && <CheckCircle2 className="h-5 w-5 text-green-500" />}
            </div>
            <span className="text-sm font-bold text-gray-900">
              {completedCount}/{totalTests} ({completionPct}%)
            </span>
          </div>
          <ProgressBar value={completionPct} size="md" color={allComplete ? 'green' : 'blue'} />
        </CardBody>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {localTests.map((test) => {
          const Icon = TEST_ICONS[test.testType];
          const iconColor = TEST_COLORS[test.testType];
          const currentNotes = editingNotes[test.id] ?? test.notes ?? '';

          return (
            <Card key={test.id} className={cn(test.status === 'Completed' && 'border-green-200')}>
              <CardHeader className="py-2.5">
                <div className="flex items-center gap-2">
                  <Icon className={cn('h-5 w-5', iconColor)} />
                  <h4 className="text-sm font-semibold text-gray-900">{test.testType} Testing</h4>
                </div>
              </CardHeader>
              <CardBody className="py-3 space-y-3">
                <Badge variant={statusVariant[test.status]} size="sm">{test.status}</Badge>

                {isTestingStage && !isPastTesting && (
                  <Select
                    options={STATUS_OPTIONS}
                    value={test.status}
                    onChange={(e) => handleStatusChange(test.id, test.testType, e.target.value)}
                    className="text-xs"
                    disabled={isPending}
                  />
                )}

                <div className="space-y-1 text-xs text-gray-500">
                  {test.startDate && <p>Started: {formatDateTimeIST(test.startDate)}</p>}
                  {test.completionDate && <p>Completed: {formatDateTimeIST(test.completionDate)}</p>}
                  {test.completedBy && <p>By: {test.completedBy}</p>}
                </div>

                {isTestingStage && !isPastTesting ? (
                  <div className="space-y-1">
                    <Textarea
                      value={currentNotes}
                      onChange={(e) => handleNotesChange(test.id, e.target.value)}
                      rows={2}
                      className="text-xs"
                      placeholder="Add notes..."
                      disabled={isPending}
                    />
                    {editingNotes[test.id] !== undefined && editingNotes[test.id] !== (test.notes ?? '') && (
                      <button
                        onClick={() => handleNotesSave(test.id, test.testType)}
                        disabled={isPending}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Save notes
                      </button>
                    )}
                  </div>
                ) : (
                  test.notes && (
                    <Textarea value={test.notes} rows={2} className="text-xs" readOnly />
                  )
                )}
              </CardBody>
            </Card>
          );
        })}

        {localTests.length === 0 && (
          <div className="col-span-3 py-8 text-center text-sm text-gray-400">
            No test records available.
          </div>
        )}
      </div>
    </div>
  );
}
