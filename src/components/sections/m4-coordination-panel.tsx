'use client';

import { Badge } from '@/components/ui/badge';
import type { M4CoordinationEntry } from '@/types';

interface M4CoordinationPanelProps {
  entries: M4CoordinationEntry[];
  isEditable: boolean;
}

const statusVariant: Record<string, 'gray' | 'warning' | 'success'> = {
  'Pending': 'gray',
  'In Progress': 'warning',
  'Completed': 'success',
};

export function M4CoordinationPanel({ entries, isEditable }: M4CoordinationPanelProps) {
  if (entries.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-400">
        No coordination entries recorded yet.
      </p>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-center justify-between py-3 px-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">{entry.activityType}</span>
              <Badge variant="outline" size="sm">→ {entry.supportedSectionCode}</Badge>
            </div>
            {entry.notes && (
              <p className="mt-0.5 text-xs text-gray-500">{entry.notes}</p>
            )}
            {entry.createdAt && (
              <p className="mt-0.5 text-xs text-gray-400">
                {new Date(entry.createdAt).toLocaleDateString('en-IN')}
              </p>
            )}
          </div>
          <Badge variant={statusVariant[entry.status] ?? 'gray'} size="sm">
            {entry.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}
