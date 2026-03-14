'use client';

import { cn } from '@/lib/utils';

export type CoachTab = 'overview' | 'parts' | 'checklist' | 'testing' | 'notes';

const TAB_LABELS: { key: CoachTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'parts', label: 'Parts' },
  { key: 'checklist', label: 'Checklist' },
  { key: 'testing', label: 'Testing' },
  { key: 'notes', label: 'Notes' },
];

export interface CoachTabsProps {
  activeTab: CoachTab;
  onTabChange: (tab: CoachTab) => void;
  noteCount?: number;
  testingDisabled?: boolean;
}

export function CoachTabs({ activeTab, onTabChange, noteCount, testingDisabled }: CoachTabsProps) {
  return (
    <nav className="border-b border-gray-200" aria-label="Coach detail tabs">
      <div className="-mb-px flex space-x-2 sm:space-x-6 overflow-x-auto px-1 scrollbar-none">
        {TAB_LABELS.map(({ key, label }) => {
          const isActive = activeTab === key;
          const isDisabled = key === 'testing' && testingDisabled;

          return (
            <button
              key={key}
              onClick={() => !isDisabled && onTabChange(key)}
              disabled={isDisabled}
              className={cn(
                'relative whitespace-nowrap border-b-2 px-2 sm:px-1 py-3 text-sm font-medium transition-colors min-h-[44px]',
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                isDisabled && 'cursor-not-allowed opacity-40',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              {label}
              {key === 'notes' && noteCount !== undefined && noteCount > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-100 px-1.5 text-xs font-medium text-gray-600">
                  {noteCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
