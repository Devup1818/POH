'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, CalendarCheck, Clock, Layers, Pencil, Trash2, BarChart3, Train } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { DeleteRakeDialog } from '@/components/rakes/delete-rake-dialog';
import { EditRakeModal } from '@/components/rakes/edit-rake-modal';
import { canDeleteRake, canEditRake } from '@/lib/auth/permissions';
import { getClientUser } from '@/lib/supabase/get-user-or-dev';
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
  coaches?: RakeHeaderCoach[];
}

export function RakeHeader({
  rakeId, rakeNumber, rakeCategory, rakeType, pohType, shedId, shedName,
  intakeDate, elapsedDays, currentStage, totalCoaches, avgCompletionPercentage, coaches,
}: RakeHeaderProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    async function fetchRole() {
      try {
        const { supabase, userId } = await getClientUser();
        if (!userId) return;
        const { data: profile } = await supabase.from('users').select('role').eq('id', userId).single();
        setUserRole((profile?.role as UserRole) ?? null);
      } catch { /* ignore */ }
    }
    fetchRole();
  }, []);

  const showEdit = userRole ? canEditRake(userRole) : false;
  const showDelete = userRole ? canDeleteRake(userRole) : false;

  let estCompletionStr: string;
  if (coaches && coaches.length > 0) {
    const estDate = calculateRakeEstimatedCompletion(coaches);
    estCompletionStr = formatDateIST(estDate.toISOString());
  } else {
    const estRemainingDays = Math.max(0, TOTAL_TARGET_DURATION - elapsedDays);
    const estCompletionDate = new Date(Date.now() + estRemainingDays * 86_400_000);
    estCompletionStr = formatDateIST(estCompletionDate.toISOString());
  }

  const progressColor =
    avgCompletionPercentage >= 75 ? 'bg-emerald-400'
    : avgCompletionPercentage >= 40 ? 'bg-blue-400'
    : 'bg-amber-400';

  return (
    <div className="animate-fade-in-up rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      {/* Thin progress accent bar at top */}
      <div className="h-0.5 w-full bg-gray-50">
        <div
          className={`h-full ${progressColor} transition-all duration-700 ease-out`}
          style={{ width: `${avgCompletionPercentage}%` }}
        />
      </div>

      <div className="px-6 py-5">
        {/* Back link */}
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Dashboard
        </Link>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: Identity */}
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{rakeNumber}</h1>
              <span className="text-lg font-medium tabular-nums text-gray-400">
                {avgCompletionPercentage}%
              </span>
              {(showEdit || showDelete) && (
                <div className="flex items-center gap-0.5 ml-1">
                  {showEdit && (
                    <button type="button" aria-label="Edit rake" onClick={() => setEditOpen(true)}
                      className="rounded-lg p-1.5 text-gray-300 hover:bg-gray-50 hover:text-gray-500 transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {showDelete && (
                    <button type="button" aria-label="Delete rake" onClick={() => setDeleteOpen(true)}
                      className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <Badge variant="default" size="sm">{rakeCategory}</Badge>
              {rakeType !== rakeCategory && <Badge variant="info" size="sm">{rakeType}</Badge>}
              <Badge variant="purple" size="sm">{pohType}</Badge>
              <span className="flex items-center gap-1 text-xs text-gray-400 ml-1">
                <MapPin className="h-3 w-3 text-rose-400" /> {shedName}
              </span>
            </div>
          </div>

          {/* Right: Key stats as a clean grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-3">
            {[
              { icon: Calendar, label: 'Intake', value: formatDateIST(intakeDate), color: 'text-blue-400' },
              { icon: Clock, label: 'Elapsed', value: `${elapsedDays}d`, color: 'text-amber-400' },
              { icon: Layers, label: 'Stage', value: currentStage, color: 'text-violet-400' },
              { icon: CalendarCheck, label: 'Est. Completion', value: estCompletionStr, color: 'text-emerald-400' },
              { icon: Train, label: 'Coaches', value: String(totalCoaches), color: 'text-rose-400' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-center gap-2">
                {Icon && <Icon className={cn('h-3.5 w-3.5 shrink-0', color)} />}
                <div>
                  <p className="text-[10px] text-gray-400 leading-none">{label}</p>
                  <p className="text-xs font-medium text-gray-700 tabular-nums mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action row */}
        <div className="mt-5 pt-4 border-t border-gray-50">
          <Link
            href={`/rakes/${rakeId}/section-analysis`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-150 bg-gray-50/50 px-3.5 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-200 transition-all duration-150"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Section Analysis
          </Link>
        </div>
      </div>

      {/* Admin dialogs */}
      {showDelete && (
        <DeleteRakeDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} rakeId={rakeId} rakeNumber={rakeNumber} />
      )}
      {showEdit && (
        <EditRakeModal open={editOpen} onClose={() => setEditOpen(false)} rakeId={rakeId}
          currentValues={{ rakeNumber, rakeCategory, rakeType, pohType, shedId, totalCoaches, intakeDate }} />
      )}
    </div>
  );
}
