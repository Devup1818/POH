import Link from 'next/link';
import { ArrowLeft, Lock, Pencil } from 'lucide-react';
import { getSectionDetail } from '@/lib/queries/section-detail';
import { Badge } from '@/components/ui/badge';
import { SectionDetailTabs } from '@/components/sections/section-detail-tabs';

interface SectionDetailPageProps {
  params: Promise<{ rakeId: string; coachId: string; sectionCode: string }>;
}

export default async function SectionDetailPage({ params }: SectionDetailPageProps) {
  const { rakeId, coachId, sectionCode } = await params;

  const data = await getSectionDetail(coachId, sectionCode);

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-gray-400">Section data not found.</p>
      </div>
    );
  }

  const {
    sectionCode: code,
    nameHindi,
    nameEnglish,
    sectionType,
    pohCycle,
    isEditable,
    workItems,
    mustChangeItems,
    tests,
    m4Entries,
  } = data;

  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        {/* Back link */}
        <div className="mb-3">
          <Link
            href={`/rakes/${rakeId}/coaches/${coachId}/sections`}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sections Dashboard
          </Link>
        </div>

        {/* Section info */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{code}</h1>
              {isEditable ? (
                <Badge variant="success" size="sm">
                  <Pencil className="mr-1 h-3 w-3" />
                  Editable
                </Badge>
              ) : (
                <Badge variant="gray" size="sm">
                  <Lock className="mr-1 h-3 w-3" />
                  Read Only
                </Badge>
              )}
            </div>
            <p className="mt-1 text-base text-gray-700">{nameEnglish}</p>
          </div>

          <div className="text-right">
            <Badge variant="purple" size="lg">{pohCycle}</Badge>
            {sectionType === 'coordination' && (
              <p className="mt-1 text-xs text-gray-500">Coordination Section</p>
            )}
            {sectionType === 'placeholder' && (
              <p className="mt-1 text-xs text-gray-500">Placeholder WIs</p>
            )}
          </div>
        </div>

        {/* Summary stats */}
        <div className="mt-3 flex flex-wrap gap-4 border-t border-gray-100 pt-3 text-sm text-gray-600">
          {sectionType !== 'coordination' && (
            <span>
              Work Items: {workItems.filter((w) => w.status === 'Completed').length}/{workItems.length}
            </span>
          )}
          {sectionType === 'coordination' && m4Entries && (
            <span>
              Coordination Entries: {m4Entries.filter((e) => e.status === 'Completed').length}/{m4Entries.length}
            </span>
          )}
          <span>
            Must Change: {mustChangeItems.filter((m) => m.isReplaced).length}/{mustChangeItems.length}
          </span>
          <span>
            Tests: {tests.filter((t) => t.passed === true).length}/{tests.length} passed
          </span>
        </div>
      </div>

      {/* Tabs content */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <SectionDetailTabs
          sectionType={sectionType}
          workItems={workItems}
          mustChangeItems={mustChangeItems}
          tests={tests}
          m4Entries={m4Entries}
          isEditable={isEditable}
        />
      </div>
    </div>
  );
}
