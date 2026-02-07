'use client';

import { AuthProvider } from '@/hooks/use-auth';
import { AdminSidebar } from '@/components/admin/sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-surface-50">
        <AdminSidebar />
        <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen">
          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </AuthProvider>
  );
}
