'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { markSectionStageComplete } from '@/lib/actions/section-stage-completion';
import type { POHStage } from '@/types';

interface StageCompletionButtonProps {
  rakeId: string;
  coachId: string;
  sectionCode: string;
  currentStage: POHStage;
  alreadyCompleted: boolean;
}

export function StageCompletionButton({
  rakeId,
  coachId,
  sectionCode,
  currentStage,
  alreadyCompleted,
}: StageCompletionButtonProps) {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(alreadyCompleted);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (completed) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-md bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 border border-green-200">
        <CheckCircle2 className="h-4 w-4" />
        {currentStage} Complete
      </div>
    );
  }

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const result = await markSectionStageComplete(coachId, sectionCode);
      if (result.success) {
        setCompleted(true);
        if (result.data.advanced) {
          router.push(`/rakes/${rakeId}/coaches/${coachId}/sections`);
        } else {
          router.refresh();
        }
      } else {
        setError(result.error);
      }
    } catch {
      setError('Failed to mark stage complete');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
        {loading ? 'Submitting...' : `Mark ${currentStage} Complete`}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
