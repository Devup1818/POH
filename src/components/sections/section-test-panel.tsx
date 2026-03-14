'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { recordSectionTestResult } from '@/lib/actions/section-tests';
import type { SectionTestInstance, SectionTestStatus } from '@/types';

interface SectionTestPanelProps {
  tests: SectionTestInstance[];
  isEditable: boolean;
}

const statusVariant: Record<SectionTestStatus, 'gray' | 'warning' | 'success' | 'danger'> = {
  'Not Started': 'gray',
  'In Progress': 'warning',
  'Completed': 'success',
  'Failed': 'danger',
};

export function SectionTestPanel({ tests, isEditable }: SectionTestPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [measuredValues, setMeasuredValues] = useState('');
  const [passed, setPassed] = useState(true);
  const [notes, setNotes] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRecord = async (testId: string) => {
    if (!measuredValues.trim()) { setError('Measured values are required'); return; }
    setUpdatingId(testId);
    setError(null);
    const result = await recordSectionTestResult(testId, measuredValues, passed, notes || undefined);
    if (!result.success) { setError(result.error); }
    else { setExpandedId(null); setMeasuredValues(''); setNotes(''); startTransition(() => router.refresh()); }
    setUpdatingId(null);
  };

  if (tests.length === 0) {
    return <p className="py-6 text-center text-sm text-gray-400">No tests defined for this section.</p>;
  }

  return (
    <div className="divide-y divide-gray-100">
      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 mb-2">{error}</div>}
      {tests.map((test) => {
        const isExpanded = expandedId === test.id;
        return (
          <div key={test.id} className="py-3 px-1">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">{test.testName}</p>
                {test.testDescription && <p className="mt-0.5 text-xs text-gray-500">{test.testDescription}</p>}
                {test.measuredValues && <p className="mt-0.5 text-xs text-gray-400">Measured: {test.measuredValues}</p>}
                {test.testedAt && <p className="mt-0.5 text-xs text-gray-400">Tested: {new Date(test.testedAt).toLocaleDateString('en-IN')}</p>}
              </div>
              <div className="flex items-center gap-2">
                {isEditable && test.status === 'Not Started' && (
                  <button
                    onClick={() => { setExpandedId(isExpanded ? null : test.id); setMeasuredValues(''); setNotes(''); setPassed(true); setError(null); }}
                    className="rounded-md border border-blue-300 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                  >Record Result</button>
                )}
                <Badge variant={statusVariant[test.status]} size="sm">
                  {test.passed === true ? 'Passed' : test.passed === false ? 'Failed' : test.status}
                </Badge>
              </div>
            </div>
            {isExpanded && (
              <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-3 space-y-2">
                <input type="text" placeholder="Measured values" value={measuredValues}
                  onChange={(e) => setMeasuredValues(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200" />
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="radio" name={`result-${test.id}`} checked={passed} onChange={() => setPassed(true)} className="text-green-600 focus:ring-green-500" /> Passed
                  </label>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="radio" name={`result-${test.id}`} checked={!passed} onChange={() => setPassed(false)} className="text-red-600 focus:ring-red-500" /> Failed
                  </label>
                </div>
                <input type="text" placeholder="Notes (optional)" value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200" />
                <div className="flex gap-2">
                  <button onClick={() => handleRecord(test.id)} disabled={updatingId === test.id || isPending}
                    className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                    {updatingId === test.id ? 'Saving...' : 'Save Result'}
                  </button>
                  <button onClick={() => { setExpandedId(null); setError(null); }}
                    className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
