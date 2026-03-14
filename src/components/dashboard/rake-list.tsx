'use client';

import { RakeCard, type RakeCardData } from './rake-card';
import { Train } from 'lucide-react';

interface RakeListProps {
  rakes: RakeCardData[];
}

export function RakeList({ rakes }: RakeListProps) {
  if (rakes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white/50 py-16 backdrop-blur-sm">
        <Train className="h-8 w-8 text-gray-300" />
        <p className="mt-3 text-sm text-gray-400">
          No rakes match the current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {rakes.map((rake) => (
        <RakeCard key={rake.id} rake={rake} />
      ))}
    </div>
  );
}
