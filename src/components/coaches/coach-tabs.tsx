'use client';

import { cn } from '@/lib/utils';

export type CoachTab = 'overview' | 'parts' | 'checklist' | 'testing' | 'notes';

const TAB_LABELS: { key: CoachTab; label: string }[] = [
  { key: 'overview', label: 'Workflow' },
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
    <nav className="flex items-center gap-1 rounded-xl bg-gray-50 p-1" aria-label="Coach detail tabs">
      {TAB_LABELS.map(({ key, label }) => {
        const isActive = activeTab === key;
        const isDisabled = key === 'testing' && testingDisabled;

        return (
          <button
            key={key}
            onClick={() => !isDisabled && onTabChange(key)}
            disabled={isDisabled}
            className={cn(
              'relative rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 min-h-[36px]',
              isActive
                ? 'bg-black text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50',
              isDisabled && 'cursor-not-allowed opacity-40',
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            {label}
            {key === 'notes' && noteCount !== undefined && noteCount > 0 && (
              <span className={cn(
                'ml-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-semibold',
                isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500',
              )}>
                {noteCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
