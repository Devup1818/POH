'use client';

import { useMemo, useState, useEffect, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';
import { CoachHeader } from '@/components/coaches/coach-header';
import { CoachTabs, type CoachTab } from '@/components/coaches/coach-tabs';
import { StageTimeline } from '@/components/coaches/stage-timeline';
import { ProgressSummary } from '@/components/coaches/progress-summary';
import { PartsTracker } from '@/components/coaches/parts-tracker';
import { ChecklistManager } from '@/components/coaches/checklist-manager';
import { TestingPanel } from '@/components/coaches/testing-panel';
import { NotesPanel } from '@/components/coaches/notes-panel';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/ui/modal';
import { POH_STAGE_ORDER, TARGET_DURATIONS } from '@/lib/constants';
import { advanceCoachStage } from '@/lib/actions/coach';
import { calculateTimelineStatus, calculateElapsedTime } from '@/lib/utils/timeline';
import {
  getCoachDetail,
  getCoachChecklistItems,
  getCoachNotes,
  getCoachSiblings,
  type CoachDetail,
  type ChecklistItemDetail,
  type NoteDetail,
} from '@/lib/queries/coach';
import type { TimelineStatus } from '@/types';

export default function CoachDetailPage() {
  const params = useParams<{ rakeId: string; coachId: string }>();
  const { rakeId, coachId } = params;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<CoachTab>('overview');
  const [loading, setLoading] = useState(true);
  const [autoAdvancing, setAutoAdvancing] = useState(false);
  const [coach, setCoach] = useState<CoachDetail | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItemDetail[]>([]);
  const [notes, setNotes] = useState<NoteDetail[]>([]);
  const [siblings, setSiblings] = useState<{
    prevCoachId: string | null;
    nextCoachId: string | null;
    rakeAvgProgress: number;
  }>({ prevCoachId: null, nextCoachId: null, rakeAvgProgress: 0 });

  // Advance stage state
  const [showAdvanceConfirm, setShowAdvanceConfirm] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);
  const [isAdvancing, startAdvanceTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      getCoachDetail(coachId),
      getCoachChecklistItems(coachId),
      getCoachNotes(coachId),
      getCoachSiblings(rakeId, coachId),
    ]).then(([coachData, clItems, noteData, siblingData]) => {
      if (!cancelled) {
        setCoach(coachData);
        setChecklistItems(clItems);
        setNotes(noteData);
        setSiblings(siblingData);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [coachId, rakeId]);

  const handleAdvanceStage = () => {
    setAdvanceError(null);
    const wasAtIntake = coach?.currentStage === 'Intake';
    startAdvanceTransition(async () => {
      const result = await advanceCoachStage(coachId);
      if (!result.success) {
        setAdvanceError(result.error);
      } else {
        // Refresh data
        const [coachData, clItems, noteData, siblingData] = await Promise.all([
          getCoachDetail(coachId),
          getCoachChecklistItems(coachId),
          getCoachNotes(coachId),
          getCoachSiblings(rakeId, coachId),
        ]);
        setCoach(coachData);
        setChecklistItems(clItems);
        setNotes(noteData);
        setSiblings(siblingData);

        // Auto-advance: if coach was at Intake and has been in the shed (not newly registered),
        // auto-navigate to the next sibling coach after 1 second
        if (wasAtIntake && siblingData.nextCoachId) {
          setAutoAdvancing(true);
          setTimeout(() => {
            try {
              router.push(`/rakes/${rakeId}/coaches/${siblingData.nextCoachId}`);
            } catch {
              // Navigation failed — stay on current view
              setAutoAdvancing(false);
            }
          }, 1000);
        }
      }
      setShowAdvanceConfirm(false);
    });
  };

  const derived = useMemo(() => {
    if (!coach) return null;

    const elapsedDaysInStage = calculateElapsedTime(coach.stageStartDate).days || 1;

    const partsTotal = coach.parts.length;
    const partsDone = coach.parts.filter(
      (p) => p.status === 'Tested' || p.status === 'Reassembled',
    ).length;
    const partsCompletion = partsTotal > 0 ? Math.round((partsDone / partsTotal) * 100) : 0;

    const isInTestingOrLater = POH_STAGE_ORDER.indexOf(coach.currentStage) >= 5;

    // Determine timeline status using real calculation
    let timelineStatus: TimelineStatus = 'On Schedule';
    const currentHistory = coach.stageHistory.find(
      (h) => h.stage === coach.currentStage && !h.completionDate,
    );
    if (currentHistory) {
      const target = TARGET_DURATIONS[coach.currentStage];
      timelineStatus = calculateTimelineStatus(elapsedDaysInStage, target);
    }
    // Check completed stages for latest status
    const completedWithStatus = coach.stageHistory
      .filter((h) => h.completionDate && h.timelineStatus)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    if (completedWithStatus.length > 0 && !currentHistory) {
      timelineStatus = completedWithStatus[0].timelineStatus as TimelineStatus;
    }

    // Completion percentage based on stage position
    const stageIdx = POH_STAGE_ORDER.indexOf(coach.currentStage);
    const completionPercentage = Math.round((stageIdx / POH_STAGE_ORDER.length) * 100);

    return {
      elapsedDaysInStage,
      partsCompletion,
      isInTestingOrLater,
      timelineStatus,
      completionPercentage,
    };
  }, [coach]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!coach || !derived) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-gray-400">Coach not found.</p>
      </div>
    );
  }

  // Map stage history to the format StageTimeline expects
  // Fill in all 8 stages even if some don't have history entries yet
  const stageTimelineData = POH_STAGE_ORDER.map((stage) => {
    const entry = coach.stageHistory.find((h) => h.stage === stage);
    if (entry) {
      return {
        stage: entry.stage,
        startDate: entry.startDate,
        completionDate: entry.completionDate,
        targetDurationDays: entry.targetDurationDays,
        actualDurationDays: entry.actualDurationDays,
        timelineStatus: entry.timelineStatus as TimelineStatus | null,
      };
    }
    return {
      stage,
      startDate: '',
      completionDate: null as string | null,
      targetDurationDays: TARGET_DURATIONS[stage],
      actualDurationDays: null as number | null,
      timelineStatus: null as TimelineStatus | null,
    };
  });

  // Map parts to MockPart shape for PartsTracker
  const partsForTracker = coach.parts.map((p) => ({
    id: p.id,
    coachId: coach.id,
    partName: p.partName as any,
    status: p.status as any,
    statusUpdatedAt: p.statusUpdatedAt,
    notes: p.notes,
    expectedArrivalDate: p.expectedArrivalDate,
  }));

  // Map checklist items for ChecklistManager
  const checklistForManager = checklistItems.map((item) => ({
    id: item.id,
    coachId: coach.id,
    itemCode: item.itemCode,
    description: item.description,
    category: item.category,
    rdsoSmiReference: item.rdsoSmiReference,
    isMandatory: item.isMandatory,
    executionOrder: item.executionOrder,
    status: item.status as any,
    completionDate: item.completionDate,
    notes: item.notes ?? null,
  }));

  // Map tests to TestData shape for TestingPanel
  const testsForPanel = coach.tests.map((t) => ({
    id: t.id,
    coachId: coach.id,
    testType: t.testType as any,
    status: t.status as any,
    startDate: t.startDate,
    completionDate: t.completionDate,
    completedBy: t.completedByName ?? null,
    notes: t.notes,
  }));

  // Map notes to MockNote shape
  const notesForPanel = notes.map((n) => ({
    id: n.id,
    coachId: n.coachId,
    noteType: n.noteType as any,
    content: n.content,
    isImportant: n.isImportant,
    relatedStage: n.relatedStage as any,
    relatedPart: n.relatedPart,
    createdBy: n.createdBy,
    createdAt: n.createdAt,
  }));

  const isAtFinalStage = coach.currentStage === 'Release';
  const nextStage = isAtFinalStage
    ? null
    : POH_STAGE_ORDER[POH_STAGE_ORDER.indexOf(coach.currentStage) + 1];

  return (
    <div className="space-y-5">
      <CoachHeader
        coachNumber={coach.coachNumber}
        coachType={coach.coachType}
        rakeId={rakeId}
        rakeNumber={coach.rakeNumber}
        pohType={coach.pohType as any}
        currentStage={coach.currentStage}
        elapsedDaysInStage={derived.elapsedDaysInStage}
        timelineStatus={derived.timelineStatus}
        completionPercentage={derived.completionPercentage}
        rakeAverageProgress={siblings.rakeAvgProgress}
        prevCoachId={siblings.prevCoachId}
        nextCoachId={siblings.nextCoachId}
      />

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        {!isAtFinalStage && (
          <>
            <Button
              onClick={() => { setAdvanceError(null); setShowAdvanceConfirm(true); }}
              disabled={isAdvancing || autoAdvancing}
            >
              {isAdvancing ? 'Advancing...' : `Advance to ${nextStage}`}
            </Button>
            {advanceError && (
              <span className="text-sm text-red-600">{advanceError}</span>
            )}
          </>
        )}
        <Link
          href={`/rakes/${rakeId}/coaches/${coachId}/sections`}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <LayoutGrid className="h-4 w-4" />
          Sections
        </Link>
      </div>

      {/* Auto-advance indicator */}
      {autoAdvancing && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="text-sm text-blue-700">Moving to next coach...</span>
        </div>
      )}

      <ConfirmModal
        open={showAdvanceConfirm}
        onClose={() => setShowAdvanceConfirm(false)}
        onConfirm={handleAdvanceStage}
        title="Advance Stage"
        message={`Are you sure you want to advance Coach ${coach.coachNumber} from ${coach.currentStage} to ${nextStage}? This will validate mandatory checklist items and testing requirements.`}
        confirmLabel="Advance"
      />

      <CoachTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        noteCount={notes.length}
        testingDisabled={!derived.isInTestingOrLater}
      />

      <div className="mt-1">
        {activeTab === 'overview' && (
          <div className="space-y-5">
            <ProgressSummary
              overallProgress={derived.completionPercentage}
              partsCompletion={derived.partsCompletion}
              checklistCompletion={coach.checklistCompletionPct}
              currentStage={coach.currentStage}
              elapsedDays={derived.elapsedDaysInStage}
            />
            <StageTimeline stageHistory={stageTimelineData} currentStage={coach.currentStage} />
          </div>
        )}

        {activeTab === 'parts' && <PartsTracker parts={partsForTracker} />}

        {activeTab === 'checklist' && (
          <ChecklistManager items={checklistForManager} coachId={coachId} />
        )}

        {activeTab === 'testing' && (
          <TestingPanel tests={testsForPanel} currentStage={coach.currentStage} />
        )}

        {activeTab === 'notes' && <NotesPanel notes={notesForPanel} coachId={coachId} />}
      </div>
    </div>
  );
}
