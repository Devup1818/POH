'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { updateSectionWorkItemStatus } from '@/lib/actions/section-work-items';
import type { SectionWorkItem, WorkItemStatus } from '@/types';

interface WorkItemListProps {
  items: SectionWorkItem[];
  isEditable: boolean;
}

const statusVariant: Record<WorkItemStatus, 'gray' | 'warning' | 'success'> = {
  'Not Started': 'gray',
  'In Progress': 'warning',
  'Completed': 'success',
};

const STATUS_OPTIONS: WorkItemStatus[] = ['Not Started', 'In Progress', 'Completed'];

export function WorkItemList({ items, isEditable }: WorkItemListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (itemId: string, newStatus: WorkItemStatus) => {
    setUpdatingId(itemId);
    setError(null);
    const result = await updateSectionWorkItemStatus(itemId, newStatus);
    if (!result.success) {
      setError(result.error);
    } else {
      startTransition(() => router.refresh());
    }
    setUpdatingId(null);
  };

  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-400">
        No work items assigned for this section.
      </p>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 mb-2">{error}</div>
      )}
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between py-3 px-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900">{item.wiNumber}</span>
              <span className="text-xs text-gray-500">v{item.versionNumber}</span>
              <Badge variant="outline" size="sm">{item.rakeType}</Badge>
            </div>
            {item.notes && (
              <p className="mt-0.5 text-xs text-gray-500 truncate">{item.notes}</p>
            )}
          </div>
          {isEditable ? (
            <select
              value={item.status}
              onChange={(e) => handleStatusChange(item.id, e.target.value as WorkItemStatus)}
              disabled={updatingId === item.id || isPending}
              className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200 disabled:opacity-50"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          ) : (
            <Badge variant={statusVariant[item.status]} size="sm">
              {item.status}
            </Badge>
          )}
        </div>
      ))}
    </div>
  );
}
