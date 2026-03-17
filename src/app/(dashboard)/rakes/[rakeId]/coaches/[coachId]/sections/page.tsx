import Link from 'next/link';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { getCoachSectionDashboard, getUserAssignedSection } from '@/lib/queries/section-dashboard';
import { Badge } from '@/components/ui/badge';
import { SectionCard } from '@/components/sections/section-card';
import { JobCardExportButton } from '@/components/sections/job-card-export-button';
import { GenerateJobCardButton } from '@/components/sections/generate-job-card-button';
import { createClient } from '@/lib/supabase/server';
import { getEffectiveUser } from '@/lib/supabase/dev-session';

interface SectionDashboardPageProps {
  params: Promise<{ rakeId: string; coachId: string }>;
}

export default async function SectionDashboardPage({ params }: SectionDashboardPageProps) {
  const { rakeId, coachId } = await params;

  const [dashboardData, assignedSection] = await Promise.all([
    getCoachSectionDashboard(coachId),
    getUserAssignedSection(),
  ]);

  // Check if current user is admin
  let isAdmin = false;
  try {
    const supabase = await createClient();
    const user = await getEffectiveUser();
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      isAdmin = profile?.role === 'Admin';
    }
  } catch {
    // ignore
  }

  if (!dashboardData) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="text-sm text-gray-400">Coach data not found or sections not available.</p>
        <Link
          href={`/rakes/${rakeId}/coaches/${coachId}`}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Coach Detail
        </Link>
      </div>
    );
  }

  const { coachNumber, coachType, rakeType, pohCycle, sections, aggregateCompletionPct } = dashboardData;

  // Check if job card has been generated (any section has work items)
  const hasJobCardData = sections.some(s => s.totalWorkItems > 0 || s.testsTotal > 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <Link
            href={`/rakes/${rakeId}/coaches/${coachId}`}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Coach {coachNumber}
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href={`/rakes/${rakeId}/section-analysis`}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              Section Analysis
            </Link>
            <JobCardExportButton coachId={coachId} />
          </div>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Section Dashboard — Coach {coachNumber}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge variant={coachType === 'MC' ? 'info' : 'warning'} size="sm">
                {coachType}
              </Badge>
              <Badge variant="blue" size="sm">{rakeType}</Badge>
              <Badge variant="purple" size="sm">{pohCycle}</Badge>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-500">Job Card Completion</p>
            <p className="text-2xl font-bold text-gray-900">{aggregateCompletionPct}%</p>
          </div>
        </div>

        <div className="mt-3">
          <div className="h-2.5 w-full rounded-full bg-gray-200">
            <div
              className="h-2.5 rounded-full bg-blue-600 transition-all"
              style={{ width: `${Math.min(aggregateCompletionPct, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Generate Job Card prompt for coaches without data */}
      {!hasJobCardData && isAdmin && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800 mb-2">
            Job card has not been generated for this coach yet. Click the button below to populate work items, must change items, and tests.
          </p>
          <GenerateJobCardButton
            coachId={coachId}
            rakeType={rakeType}
            coachType={coachType}
            pohCycle={pohCycle}
          />
        </div>
      )}

      {!hasJobCardData && !isAdmin && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-sm text-gray-600">
            Job card has not been generated for this coach yet. Please contact an Admin to generate the job card before work items can be edited.
          </p>
        </div>
      )}

      {/* Section cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sections.map((section) => {
          const isSSEAssigned = assignedSection === section.sectionCode;
          const isEditable = isAdmin || isSSEAssigned;
          return (
            <SectionCard
              key={section.sectionCode}
              section={section}
              coachId={coachId}
              rakeId={rakeId}
              isEditable={isEditable}
              isAssignedToCurrentSSE={isSSEAssigned}
            />
          );
        })}
      </div>
    </div>
  );
}
