'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { BarChart3 } from 'lucide-react';
import { RakeHeader } from '@/components/rakes/rake-header';
import { StageProgressChart } from '@/components/rakes/stage-progress-chart';
import { CoachGrid, type CoachCardData } from '@/components/rakes/coach-grid';
import { AggregateStats } from '@/components/rakes/aggregate-stats';
import { BulkActionsBar, type BulkAction } from '@/components/rakes/bulk-actions-bar';
import { BulkConfirmationModal, type BulkActionParams } from '@/components/rakes/bulk-confirmation-modal';
import type { POHStage } from '@/types';
import { POH_STAGE_ORDER, TARGET_DURATIONS } from '@/lib/constants';
import { getRakeDetail, type RakeDetail } from '@/lib/queries/coach';
import { updateCoachType } from '@/lib/actions/coach';
import { createClient } from '@/lib/supabase/client';
import { bulkAdvanceStage, bulkUpdatePartStatus, bulkAddNote, bulkUpdateChecklistItem, undoBulkOperation, type BulkResult, type BulkPreviousState } from '@/lib/actions/bulk';

export default function RakeDetailPage() {
  const params = useParams<{ rakeId: string }>();
  const rakeId = params.rakeId;
  const [rake, setRake] = useState<RakeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedCoachIds, setSelectedCoachIds] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<BulkAction | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getRakeDetail(rakeId).then((d) => { if (!cancelled) { setRake(d); setLoading(false); } });
    return () => { cancelled = true; };
  }, [rakeId]);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
        setIsAdmin(profile?.role === 'Admin');
      } catch { /* ignore */ }
    })();
  }, []);

  const handleCoachTypeChange = useCallback(async (coachId: string, newType: 'MC' | 'TC') => {
    const result = await updateCoachType(coachId, newType);
    if (result.success) {
      setRake((prev) => prev ? { ...prev, coaches: prev.coaches.map((c) => c.id === coachId ? { ...c, coachType: newType } : c) } : prev);
    }
  }, []);

  const data = useMemo(() => {
    if (!rake) return null;
    const now = Date.now();
    const elapsedDays = Math.ceil((now - new Date(rake.intakeDate).getTime()) / 86400000);
    const coachStages = {} as Record<POHStage, number>;
    POH_STAGE_ORDER.forEach((s) => (coachStages[s] = 0));
    rake.coaches.forEach((c) => { coachStages[c.currentStage] = (coachStages[c.currentStage] || 0) + 1; });
    const coachCards: CoachCardData[] = rake.coaches.map((c) => ({
      id: c.id, coachNumber: c.coachNumber, coachType: c.coachType, currentStage: c.currentStage,
      timelineStatus: (c.timelineStatus as CoachCardData['timelineStatus']) ?? undefined,
      missingPartsCount: c.missingPartsCount, checklistCompletion: c.checklistCompletionPct,
      elapsedDaysInStage: c.elapsedDays, completionPercentage: c.completionPct, noteCount: c.noteCount,
    }));
    const avgCompletion = rake.coaches.length > 0 ? Math.round(rake.coaches.reduce((s, c) => s + c.completionPct, 0) / rake.coaches.length) : 0;
    const totalMissingParts = rake.coaches.reduce((s, c) => s + c.missingPartsCount, 0);
    const delayedCoaches = rake.coaches.filter((c) => c.timelineStatus === 'Minor Delay' || c.timelineStatus === 'Significant Delay');
    let avgDelay = 0;
    if (delayedCoaches.length > 0) {
      const totalDelay = delayedCoaches.reduce((sum, c) => sum + Math.max(0, c.elapsedDays - TARGET_DURATIONS[c.currentStage]), 0);
      avgDelay = Math.round(totalDelay / delayedCoaches.length);
    }
    let rakeStage: POHStage = 'Release';
    for (const c of rake.coaches) { if (POH_STAGE_ORDER.indexOf(c.currentStage) < POH_STAGE_ORDER.indexOf(rakeStage)) rakeStage = c.currentStage; }
    const blockingCount = rake.coaches.filter((c) => c.currentStage === rakeStage).length;
    const coachesInTesting = rake.coaches.filter((c) => c.currentStage === 'Testing');
    const testingCompleteCount = coachesInTesting.filter((c) => c.allTestsComplete).length;
    return { elapsedDays, coachStages, coachCards, avgCompletion, totalMissingParts, avgDelay, blockingCount, rakeStage, testingCompleteCount, testingTotalCount: coachesInTesting.length };
  }, [rake]);

  const handleToggleSelect = useCallback((coachId: string) => {
    setSelectedCoachIds((prev) => { const next = new Set(prev); if (next.has(coachId)) next.delete(coachId); else next.add(coachId); return next; });
  }, []);
  const handleSelectAllInStage = useCallback(() => {
    if (!data) return;
    let targetStage: POHStage | undefined;
    if (selectedCoachIds.size > 0) { const first = data.coachCards.find((c) => c.id === Array.from(selectedCoachIds)[0]); targetStage = first?.currentStage; }
    if (!targetStage) targetStage = data.rakeStage;
    setSelectedCoachIds(new Set(data.coachCards.filter((c) => c.currentStage === targetStage).map((c) => c.id)));
  }, [data, selectedCoachIds]);
  const handleSelectAllDelayed = useCallback(() => {
    if (!data) return;
    setSelectedCoachIds(new Set(data.coachCards.filter((c) => c.timelineStatus === 'Minor Delay' || c.timelineStatus === 'Significant Delay').map((c) => c.id)));
  }, [data]);
  const handleClearSelection = useCallback(() => setSelectedCoachIds(new Set()), []);
  const handleBulkAction = useCallback((action: BulkAction) => { setConfirmAction(action); setShowConfirmModal(true); }, []);

  const handleBulkConfirm = useCallback(async (p: BulkActionParams) => {
    const ids = Array.from(selectedCoachIds);
    let result: BulkResult | null = null;
    let previousState: BulkPreviousState | null = null;
    try {
      switch (p.action) {
        case 'mark-stage-complete': { const r = await bulkAdvanceStage(ids); if (r.success) { result = { successful: r.data.successful, failed: r.data.failed }; previousState = r.data.previousState; } break; }
        case 'update-part-status': { if (!p.partName || !p.partStatus) break; const r = await bulkUpdatePartStatus(ids, p.partName, p.partStatus, p.partNotes, p.partExpectedDate); if (r.success) { result = { successful: r.data.successful, failed: r.data.failed }; previousState = r.data.previousState; } else { result = { successful: [], failed: ids.map((id) => ({ coachId: id, coachNumber: 'Unknown', reason: r.error })) }; } break; }
        case 'add-note': { if (!p.noteContent || !p.noteType) break; const r = await bulkAddNote(ids, p.noteContent, p.noteType); if (r.success) { result = { successful: r.data.successful, failed: r.data.failed }; previousState = r.data.previousState; } else { result = { successful: [], failed: ids.map((id) => ({ coachId: id, coachNumber: 'Unknown', reason: r.error })) }; } break; }
        case 'update-checklist-item': { if (!p.templateId || !p.checklistStatus) break; const r = await bulkUpdateChecklistItem(ids, p.templateId, p.checklistStatus); if (r.success) { result = { successful: r.data.successful, failed: r.data.failed }; previousState = r.data.previousState; } break; }
      }
    } catch (err) { result = { successful: [], failed: ids.map((id) => ({ coachId: id, coachNumber: 'Unknown', reason: err instanceof Error ? err.message : 'Unknown error' })) }; }
    if (result && result.successful.length > 0) { getRakeDetail(rakeId).then((d) => { if (d) setRake(d); }); }
    if (result && previousState) return { result, previousState };
    return null;
  }, [selectedCoachIds, rakeId]);
  const handleBulkUndo = useCallback(async (prev: BulkPreviousState) => { await undoBulkOperation(prev); const d = await getRakeDetail(rakeId); if (d) setRake(d); }, [rakeId]);
  const handleCloseModal = useCallback(() => { setShowConfirmModal(false); setConfirmAction(null); setSelectedCoachIds(new Set()); }, []);
  const selectedCoachData = useMemo(() => { if (!data) return []; return data.coachCards.filter((c) => selectedCoachIds.has(c.id)); }, [data, selectedCoachIds]);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>;
  if (!rake || !data) return <div className="flex h-64 items-center justify-center"><p className="text-sm text-gray-400">Rake not found.</p></div>;

  return (
    <div className="space-y-5 pb-20">
      <RakeHeader rakeId={rakeId} rakeNumber={rake.rakeNumber} rakeCategory={(rake.rakeCategory ?? rake.rakeType ?? 'EMU') as any} rakeType={rake.rakeType as any} pohType={rake.pohType as any} shedId={rake.shedId} shedName={rake.shedName} intakeDate={rake.intakeDate} elapsedDays={data.elapsedDays} currentStage={data.rakeStage} totalCoaches={rake.totalCoaches} avgCompletionPercentage={data.avgCompletion} />
      <div className="flex items-center gap-3">
        <Link
          href={`/rakes/${rakeId}/section-analysis`}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <BarChart3 className="h-4 w-4" />
          Section Analysis
        </Link>
      </div>
      <AggregateStats avgCompletionPercentage={data.avgCompletion} totalMissingParts={data.totalMissingParts} avgDelayDays={data.avgDelay} coachesBlockingProgression={data.blockingCount} testingCompleteCount={data.testingCompleteCount} testingTotalCount={data.testingTotalCount} />
      <StageProgressChart coachStages={data.coachStages} totalCoaches={rake.totalCoaches} />
      <CoachGrid rakeId={rakeId} coaches={data.coachCards} selectedCoachIds={selectedCoachIds} onToggleSelect={handleToggleSelect} selectionEnabled={true} allowCoachTypeEdit={isAdmin} onCoachTypeChange={handleCoachTypeChange} />
      <BulkActionsBar selectedCount={selectedCoachIds.size} totalCoaches={rake.coaches.length} onAction={handleBulkAction} onSelectAllInStage={handleSelectAllInStage} onSelectAllDelayed={handleSelectAllDelayed} onClearSelection={handleClearSelection} />
      <BulkConfirmationModal open={showConfirmModal} onClose={handleCloseModal} onConfirm={handleBulkConfirm} onUndo={handleBulkUndo} action={confirmAction} selectedCoaches={selectedCoachData} />
    </div>
  );
}
