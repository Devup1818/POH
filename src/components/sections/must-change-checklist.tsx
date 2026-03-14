'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { replaceMustChangeItem } from '@/lib/actions/section-must-change';
import type { MustChangeItemInstance } from '@/types';

interface MustChangeChecklistProps {
  items: MustChangeItemInstance[];
  isEditable: boolean;
}

export function MustChangeChecklist({ items, isEditable }: MustChangeChecklistProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [oldPart, setOldPart] = useState('');
  const [newPart, setNewPart] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReplace = async (itemId: string) => {
    if (!oldPart.trim() || !newPart.trim()) {
      setError('Both old and new part details are required');
      return;
    }
    setUpdatingId(itemId);
    setError(null);
    const result = await replaceMustChangeItem(itemId, oldPart, newPart);
    if (!result.success) {
      setError(result.error);
    } else {
      setExpandedId(null);
      setOldPart('');
      setNewPart('');
      startTransition(() => router.refresh());
    }
    setUpdatingId(null);
  };

  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-400">
        No must change items for this section in the current POH cycle.
      </p>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 mb-2">{error}</div>
      )}
      {items.map((item) => (
        <div key={item.id} className="py-3 px-1">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">{item.itemName}</p>
              {item.description && (
                <p className="mt-0.5 text-xs text-gray-500">{item.description}</p>
              )}
              {item.isReplaced && item.replacedAt && (
                <p className="mt-0.5 text-xs text-gray-400">
                  Replaced: {new Date(item.replacedAt).toLocaleDateString('en-IN')}
                </p>
              )}
              {item.isReplaced && (item.oldPartDetail || item.newPartDetail) && (
                <p className="mt-0.5 text-xs text-gray-400">
                  {item.oldPartDetail} → {item.newPartDetail}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isEditable && !item.isReplaced && (
                <button
                  onClick={() => {
                    setExpandedId(expandedId === item.id ? null : item.id);
                    setOldPart('');
                    setNewPart('');
                    setError(null);
                  }}
                  className="rounded-md border border-blue-300 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  Mark Replaced
                </button>
              )}
              <Badge variant={item.isReplaced ? 'success' : 'warning'} size="sm">
                {item.isReplaced ? 'Replaced' : 'Pending'}
              </Badge>
            </div>
          </div>
          {/* Inline replace form */}
          {expandedId === item.id && (
            <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-3 space-y-2">
              <input
                type="text"
                placeholder="Old part detail"
                value={oldPart}
                onChange={(e) => setOldPart(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
              />
              <input
                type="text"
                placeholder="New part detail"
                value={newPart}
                onChange={(e) => setNewPart(e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleReplace(item.id)}
                  disabled={updatingId === item.id || isPending}
                  className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {updatingId === item.id ? 'Saving...' : 'Confirm'}
                </button>
                <button
                  onClick={() => { setExpandedId(null); setError(null); }}
                  className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
