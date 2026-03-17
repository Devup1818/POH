'use client';

import { useMemo, useState, useEffect, useTransition, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { LayoutGrid, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CoachHeader } from '@/components/coaches/coach-header';
import { CoachTabs, type CoachTab } from '@/components/coaches/coach-tabs';
import { StageWorkflow } from '@/components/coaches/stage-workflow';
import { ChecklistManager } from '@/components/coaches/checklist-manager';
import { TestingPanel } from '@/components/coaches/testing-panel';
import { NotesPanel } from '@/components/coaches/notes-panel';
import { ConfirmModal } from '@/components/ui/modal';
import { POH_STAGE_ORDER, TARGET_DURATIONS, PART_STATUS_TO_COMPLETED_STAGE, PART_STATUS_ORDER } from '@/lib/constants';
import { advanceCoachStage } from '@/lib/actions/coach';
import { calculateTimelineStatus, calculateElapsedTime } from '@/lib/utils/timeline';
import {
  getCoachDetail, getCoachChecklistItems, getCoachNotes, getCoachSiblings,
  type CoachDetail, type ChecklistItemDetail, type NoteDetail,
} from '@/lib/queries/coach';
import { useCoachPartsRealtime } from '@/lib/supabase/realtime';
import type { TimelineStatus, POHStage, PartStatus } from '@/types';
import type { MockPart } from '@/lib/mock-data';
import { DotsLoader } from '@/components/ui/dots-loader';

const STAGE_TO_PART_STATUS: Partial<Record<POHStage, PartStatus>> = {};
for (const [status, stage] of Object.entries(PART_STATUS_TO_COMPLETED_STAGE) as [PartStatus, POHStage][]) {
  STAGE_TO_PART_STATUS[stage] = status;
}

export default function CoachDetailPage() {
  const params = useParams<{ rakeId: string; coachId: string }>();
  const { rakeId, coachId } = params;

  const [activeTab, setActiveTab] = useState<CoachTab>('overview');
  const [loading, setLoading] = useState(true);
  const [coach, setCoach] = useState<CoachDetail | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItemDetail[]>([]);
  const [notes, setNotes] = useState<NoteDetail[]>([]);
  const [siblings, setSiblings] = useState<{
    prevCoachId: string | null; nextCoachId: string | null; rakeAvgProgress: number;
  }>({ prevCoachId: null, nextCoachId: null, rakeAvgProgress: 0 });

  const [showAdvanceConfirm, setShowAdvanceConfirm] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);
  const [isAdvancing, startAdvanceTransition] = useTransition();
  const [currentParts, setCurrentParts] = useState<MockPart[]>([]);

  const handlePartsChange = useCallback((updatedParts: MockPart[]) => {
    setCurrentParts(updatedParts);
  }, []);

  useCoachPartsRealtime(coachId, useCallback((row) => {
    setCurrentParts((prev) =>
      prev.map((p) =>
        p.id === row.id
          ? { ...p, status: row.status as PartStatus, notes: row.notes, expectedArrivalDate: row.expected_arrival_date, statusUpdatedAt: row.status_updated_at }
          : p,
      ),
    );
  }, []));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getCoachDetail(coachId), getCoachChecklistItems(coachId),
      getCoachNotes(coachId), getCoachSiblings(rakeId, coachId),
    ]).then(([coachData, clItems, noteData, siblingData]) => {
      if (!cancelled) {
        setCoach(coachData);
        if (coachData?.parts) {
          setCurrentParts(coachData.parts.map((p) => ({
            id: p.id, coachId: coachData.id, partName: p.partName as any,
            status: p.status as any, statusUpdatedAt: p.statusUpdatedAt,
            notes: p.notes, expectedArrivalDate: p.expectedArrivalDate,
          })));
        }
        setChecklistItems(clItems);
        setNotes(noteData);
        setSiblings(siblingData);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [coachId, rakeId]);

  const refreshData = useCallback(async () => {
    const [coachData, clItems, noteData, siblingData] = await Promise.all([
      getCoachDetail(coachId), getCoachChecklistItems(coachId),
      getCoachNotes(coachId), getCoachSiblings(rakeId, coachId),
    ]);
    setCoach(coachData);
    if (coachData?.parts) {
      setCurrentParts(coachData.parts.map((p) => ({
        id: p.id, coachId: coachData.id, partName: p.partName as any,
        status: p.status as any, statusUpdatedAt: p.statusUpdatedAt,
        notes: p.notes, expectedArrivalDate: p.expectedArrivalDate,
      })));
    }
    setChecklistItems(clItems);
    setNotes(noteData);
    setSiblings(siblingData);
  }, [coachId, rakeId]);

  const handleAdvanceStage = () => {
    setAdvanceError(null);
    startAdvanceTransition(async () => {
      const result = await advanceCoachStage(coachId);
      if (!result.success) {
        setAdvanceError(result.error);
      } else {
        await refreshData();
      }
      setShowAdvanceConfirm(false);
    });
  };

  const allPartsReadyForAdvance = useMemo(() => {
    if (!coach || currentParts.length === 0) return false;
    const targetStatus = STAGE_TO_PART_STATUS[coach.currentStage];
    if (!targetStatus) return false;
    const targetIdx = PART_STATUS_ORDER.indexOf(targetStatus);
    return currentParts.every((p) => {
      if (p.status === 'Missing/Pending') return false;
      return PART_STATUS_ORDER.indexOf(p.status as PartStatus) >= targetIdx;
    });
  }, [coach, currentParts]);

  const derived = useMemo(() => {
    if (!coach) return null;
    const elapsedDaysInStage = calculateElapsedTime(coach.stageStartDate).days || 1;
    const isInTestingOrLater = POH_STAGE_ORDER.indexOf(coach.currentStage) >= 5;

    let timelineStatus: TimelineStatus = 'On Schedule';
    const currentHistory = coach.stageHistory.find((h) => h.stage === coach.currentStage && !h.completionDate);
    if (currentHistory) {
      const target = TARGET_DURATIONS[coach.currentStage];
      timelineStatus = calculateTimelineStatus(elapsedDaysInStage, target);
    }
    const completedWithStatus = coach.stageHistory
      .filter((h) => h.completionDate && h.timelineStatus)
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    if (completedWithStatus.length > 0 && !currentHistory) {
      timelineStatus = completedWithStatus[0].timelineStatus as TimelineStatus;
    }

    const stageIdx = POH_STAGE_ORDER.indexOf(coach.currentStage);
    const completionPercentage = Math.round((stageIdx / POH_STAGE_ORDER.length) * 100);
    return { elapsedDaysInStage, isInTestingOrLater, timelineStatus, completionPercentage };
  }, [coach]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <DotsLoader size="lg" color="blue" />
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

  const stageTimelineData = POH_STAGE_ORDER.map((stage) => {
    const entry = coach.stageHistory.find((h) => h.stage === stage);
    if (entry) {
      return {
        stage: entry.stage, startDate: entry.startDate, completionDate: entry.completionDate,
        targetDurationDays: entry.targetDurationDays, actualDurationDays: entry.actualDurationDays,
        timelineStatus: entry.timelineStatus as TimelineStatus | null,
      };
    }
    return {
      stage, startDate: '', completionDate: null as string | null,
      targetDurationDays: TARGET_DURATIONS[stage], actualDurationDays: null as number | null,
      timelineStatus: null as TimelineStatus | null,
    };
  });

  const checklistForManager = checklistItems.map((item) => ({
    id: item.id, coachId: coach.id, itemCode: item.itemCode, description: item.description,
    category: item.category, rdsoSmiReference: item.rdsoSmiReference, isMandatory: item.isMandatory,
    executionOrder: item.executionOrder, status: item.status as any,
    completionDate: item.completionDate, notes: item.notes ?? null,
  }));

  const testsForPanel = coach.tests.map((t) => ({
    id: t.id, coachId: coach.id, testType: t.testType as any, status: t.status as any,
    startDate: t.startDate, completionDate: t.completionDate,
    completedBy: t.completedByName ?? null, notes: t.notes,
  }));

  const notesForPanel = notes.map((n) => ({
    id: n.id, coachId: n.coachId, noteType: n.noteType as any, content: n.content,
    isImportant: n.isImportant, relatedStage: n.relatedStage as any,
    relatedPart: n.relatedPart, createdBy: n.createdBy, createdAt: n.createdAt,
  }));

  const isAtFinalStage = coach.currentStage === 'Release';
  const nextStage = isAtFinalStage ? null : POH_STAGE_ORDER[POH_STAGE_ORDER.indexOf(coach.currentStage) + 1];

  return (
    <div className="space-y-4 animate-fade-in-up">
      <CoachHeader
        coachNumber={coach.coachNumber} coachType={coach.coachType}
        rakeId={rakeId} rakeNumber={coach.rakeNumber} pohType={coach.pohType as any}
        currentStage={coach.currentStage} elapsedDaysInStage={derived.elapsedDaysInStage}
        timelineStatus={derived.timelineStatus} completionPercentage={derived.completionPercentage}
        rakeAverageProgress={siblings.rakeAvgProgress}
        prevCoachId={siblings.prevCoachId} nextCoachId={siblings.nextCoachId}
      />

      {/* Action bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isAtFinalStage && (
            <button
              onClick={() => { setAdvanceError(null); setShowAdvanceConfirm(true); }}
              disabled={isAdvancing || !allPartsReadyForAdvance}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150',
                allPartsReadyForAdvance
                  ? 'bg-blue-600 text-white hover:bg-blue-500 active:scale-[0.98] shadow-sm shadow-blue-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed',
              )}
            >
              {isAdvancing ? 'Advancing...' : `Advance to ${nextStage}`}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
          <Link
            href={`/rakes/${rakeId}/coaches/${coachId}/sections`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all duration-150"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Sections
          </Link>
        </div>
      </div>
      {!isAtFinalStage && !allPartsReadyForAdvance && !isAdvancing && (
        <p className="text-xs text-gray-400 -mt-2">Complete all parts for this stage to advance</p>
      )}
      {advanceError && <p className="text-xs text-red-600 -mt-2">{advanceError}</p>}

      <ConfirmModal
        open={showAdvanceConfirm} onClose={() => setShowAdvanceConfirm(false)}
        onConfirm={handleAdvanceStage} title="Advance Stage"
        message={`Advance Coach ${coach.coachNumber} from ${coach.currentStage} to ${nextStage}? This will validate mandatory checklist items and testing requirements.`}
        confirmLabel="Advance"
      />

      <CoachTabs
        activeTab={activeTab} onTabChange={setActiveTab}
        noteCount={notes.length} testingDisabled={!derived.isInTestingOrLater}
      />

      <div>
        {activeTab === 'overview' && (
          <StageWorkflow
            stageHistory={stageTimelineData} currentStage={coach.currentStage}
            parts={currentParts} onPartsChange={handlePartsChange}
            allPartsReadyForAdvance={allPartsReadyForAdvance}
          />
        )}
        {activeTab === 'checklist' && (
          <ChecklistManager
            items={checklistForManager}
            coachId={coachId}
            onItemsChange={(updated) => setChecklistItems(updated.map((u) => ({
              id: u.id, coachId: u.coachId, templateId: '', itemCode: u.itemCode,
              description: u.description, category: u.category, rdsoSmiReference: u.rdsoSmiReference,
              isMandatory: u.isMandatory, executionOrder: u.executionOrder,
              status: u.status, completionDate: u.completionDate, completedBy: null, notes: u.notes ?? null,
            })))}
          />
        )}
        {activeTab === 'testing' && <TestingPanel tests={testsForPanel} currentStage={coach.currentStage} />}
        {activeTab === 'notes' && <NotesPanel notes={notesForPanel} coachId={coachId} />}
      </div>
    </div>
  );
}
