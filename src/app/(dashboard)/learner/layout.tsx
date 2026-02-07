'use client';

import { AuthProvider } from '@/hooks/use-auth';
import { LearnerSidebar } from '@/components/learner/sidebar';

export default function LearnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-surface-50">
        <LearnerSidebar />
        <main className="lg:pl-72 pt-16 lg:pt-0 min-h-screen">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </AuthProvider>
  );
}
