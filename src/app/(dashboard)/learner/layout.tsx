'use client';

import { useState, useEffect } from 'react';
import { AuthProvider } from '@/hooks/use-auth';
import { LearnerSidebar } from '@/components/learner/sidebar';
import { cn } from '@/lib/utils';

export default function LearnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Persistence
  useEffect(() => {
    const stored = localStorage.getItem('learnerSidebarCollapsed');
    if (stored !== null) setIsCollapsed(stored === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('learnerSidebarCollapsed', isCollapsed.toString());
  }, [isCollapsed]);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-surface-50">
        <LearnerSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
        <main
          className={cn(
            'pt-16 lg:pt-0 min-h-screen transition-all duration-300',
            isCollapsed ? 'lg:pl-16' : 'lg:pl-64'
          )}
        >
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </AuthProvider>
  );
}
