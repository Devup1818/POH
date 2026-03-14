'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { WorkItemList } from '@/components/sections/work-item-list';
import { MustChangeChecklist } from '@/components/sections/must-change-checklist';
import { SectionTestPanel } from '@/components/sections/section-test-panel';
import { M4CoordinationPanel } from '@/components/sections/m4-coordination-panel';
import type {
  SectionWorkItem,
  MustChangeItemInstance,
  SectionTestInstance,
  M4CoordinationEntry,
  SectionType,
} from '@/types';

type TabKey = 'work-instructions' | 'must-change' | 'testing' | 'notes';

interface Tab {
  key: TabKey;
  label: string;
}

interface SectionDetailTabsProps {
  sectionType: SectionType;
  workItems: SectionWorkItem[];
  mustChangeItems: MustChangeItemInstance[];
  tests: SectionTestInstance[];
  m4Entries?: M4CoordinationEntry[];
  isEditable: boolean;
}

const STANDARD_TABS: Tab[] = [
  { key: 'work-instructions', label: 'Work Instructions' },
  { key: 'must-change', label: 'Must Change Items' },
  { key: 'testing', label: 'Testing' },
  { key: 'notes', label: 'Notes' },
];

const M4_TABS: Tab[] = [
  { key: 'work-instructions', label: 'Coordination' },
  { key: 'must-change', label: 'Must Change Items' },
  { key: 'testing', label: 'Testing' },
  { key: 'notes', label: 'Notes' },
];

export function SectionDetailTabs({
  sectionType,
  workItems,
  mustChangeItems,
  tests,
  m4Entries,
  isEditable,
}: SectionDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('work-instructions');
  const tabs = sectionType === 'coordination' ? M4_TABS : STANDARD_TABS;

  return (
    <div>
      {/* Tab bar */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-4" aria-label="Section tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'whitespace-nowrap border-b-2 px-1 py-2.5 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div className="pt-4">
        {activeTab === 'work-instructions' && (
          sectionType === 'coordination' ? (
            <M4CoordinationPanel entries={m4Entries ?? []} isEditable={isEditable} />
          ) : sectionType === 'placeholder' ? (
            <div>
              <div className="mb-3 rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Painting section Work Instructions are placeholders. Specific WI numbers will be updated when available from RDSO.
                </p>
              </div>
              <WorkItemList items={workItems} isEditable={isEditable} />
            </div>
          ) : (
            <WorkItemList items={workItems} isEditable={isEditable} />
          )
        )}

        {activeTab === 'must-change' && (
          <MustChangeChecklist items={mustChangeItems} isEditable={isEditable} />
        )}

        {activeTab === 'testing' && (
          <SectionTestPanel tests={tests} isEditable={isEditable} />
        )}

        {activeTab === 'notes' && (
          <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-6 text-center">
            <p className="text-sm text-gray-500">
              Notes functionality will be available in a future update.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
