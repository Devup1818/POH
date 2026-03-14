'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { ShedProvider } from '@/lib/shed-context';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth protection is now handled by middleware.ts
  // The middleware redirects unauthenticated users to /login
  // so if we reach here, the user is authenticated (or middleware is not blocking in dev)

  return (
    <ShedProvider>
      <div className="flex h-screen overflow-hidden bg-[var(--background)]">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex flex-1 flex-col overflow-hidden">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </ShedProvider>
  );
}
