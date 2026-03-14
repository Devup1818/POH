'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, Clock, Layers, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ProgressBar } from '@/components/ui/progress-bar';
import { DeleteRakeDialog } from '@/components/rakes/delete-rake-dialog';
import { EditRakeModal } from '@/components/rakes/edit-rake-modal';
import { canDeleteRake, canEditRake } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/client';
import type { POHStage, POHType, RakeType, RakeCategory, UserRole } from '@/types';
import { TOTAL_TARGET_DURATION } from '@/lib/constants';
import { calculateRakeEstimatedCompletion, type StageHistoryEntry } from '@/lib/utils/timeline';
import { formatDateIST } from '@/lib/utils/date';

export interface RakeHeaderCoach {
  currentStage: POHStage;
  stageStartDate: string;
  stageHistory: StageHistoryEntry[];
}

export interface RakeHeaderProps {
  rakeId: string;
  rakeNumber: string;
  rakeCategory: RakeCategory;
  rakeType: RakeType;
  pohType: POHType;
  shedId: string;
  shedName: string;
  intakeDate: string;
  elapsedDays: number;
  currentStage: POHStage;
  totalCoaches: number;
  avgCompletionPercentage: number;
  /** Optional: coaches data for real estimated completion calculation */
  coaches?: RakeHeaderCoach[];
}

export function RakeHeader({
  rakeId,
  rakeNumber,
  rakeCategory,
  rakeType,
  pohType,
  shedId,
  shedName,
  intakeDate,
  elapsedDays,
  currentStage,
  totalCoaches,
  avgCompletionPercentage,
  coaches,
}: RakeHeaderProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    async function fetchRole() {
      try {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', authUser.id)
          .single();
        setUserRole((profile?.role as UserRole) ?? (authUser.user_metadata?.role as UserRole) ?? null);
      } catch {
        // ignore
      }
    }
    fetchRole();
  }, []);

  const showEdit = userRole ? canEditRake(userRole) : false;
  const showDelete = userRole ? canDeleteRake(userRole) : false;

  // Use real calculation if coaches data is available, otherwise fallback
  let estCompletionStr: string;
  if (coaches && coaches.length > 0) {
    const estDate = calculateRakeEstimatedCompletion(coaches);
    estCompletionStr = formatDateIST(estDate.toISOString());
  } else {
    const estRemainingDays = Math.max(0, TOTAL_TARGET_DURATION - elapsedDays);
    const estCompletionDate = new Date(
      Date.now() + estRemainingDays * 86_400_000,
    );
    estCompletionStr = formatDateIST(estCompletionDate.toISOString());
  }

  const progressColor =
    avgCompletionPercentage >= 75
      ? 'green'
      : avgCompletionPercentage >= 40
        ? 'blue'
        : 'yellow';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Back link */}
      <Link
        href="/"
        className="mb-3 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Dashboard
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: Identity */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-gray-900">{rakeNumber}</h1>
            {(showEdit || showDelete) && (
              <div className="flex items-center gap-1">
                {showEdit && (
                  <button
                    type="button"
                    aria-label="Edit rake"
                    onClick={() => setEditOpen(true)}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                {showDelete && (
                  <button
                    type="button"
                    aria-label="Delete rake"
                    onClick={() => setDeleteOpen(true)}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="default" size="sm">{rakeCategory}</Badge>
            {rakeType !== rakeCategory && (
              <Badge variant="info" size="sm">{rakeType}</Badge>
            )}
            <Badge variant="purple" size="sm">{pohType}</Badge>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3" />
              {shedName}
            </span>
          </div>
        </div>

        {/* Right: Key stats */}
        <div className="flex flex-wrap items-center gap-4 text-xs sm:gap-6">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            <div>
              <span className="text-gray-400">Intake</span>
              <p className="font-medium text-gray-700">{formatDateIST(intakeDate)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            <div>
              <span className="text-gray-400">Elapsed</span>
              <p className="font-medium text-gray-700">{elapsedDays} days</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-gray-400" />
            <div>
              <span className="text-gray-400">Stage</span>
              <p className="font-medium text-gray-700">{currentStage}</p>
            </div>
          </div>
          <div>
            <span className="text-gray-400">Est. Completion</span>
            <p className="font-medium text-gray-700">{estCompletionStr}</p>
          </div>
          <div>
            <span className="text-gray-400">Coaches</span>
            <p className="font-medium text-gray-700">{totalCoaches}</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
            Overall Progress
          </span>
          <span className="text-xs font-semibold text-gray-600">
            {avgCompletionPercentage}%
          </span>
        </div>
        <ProgressBar value={avgCompletionPercentage} size="md" color={progressColor} />
      </div>

      {/* Admin dialogs */}
      {showDelete && (
        <DeleteRakeDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          rakeId={rakeId}
          rakeNumber={rakeNumber}
        />
      )}
      {showEdit && (
        <EditRakeModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          rakeId={rakeId}
          currentValues={{
            rakeNumber,
            rakeCategory,
            rakeType,
            pohType,
            shedId,
            totalCoaches,
            intakeDate,
          }}
        />
      )}
    </div>
  );
}
