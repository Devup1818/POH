'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateJobCardForCoach } from '@/lib/actions/job-card-generation';

interface GenerateJobCardButtonProps {
  coachId: string;
  rakeType: string;
  coachType: string;
  pohCycle: string;
}

export function GenerateJobCardButton({ coachId, rakeType, coachType, pohCycle }: GenerateJobCardButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const result = await generateJobCardForCoach(coachId, rakeType, coachType, pohCycle);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Job card generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Generating...' : 'Generate Job Card'}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
