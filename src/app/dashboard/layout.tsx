'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { TaskFormProvider } from '@/contexts/TaskFormContext';
import { TeachSidebar } from '@/components/TeachSidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.isAdmin) {
    router.push('/admin');
    return null;
  }

  return (
    <TaskFormProvider>
      <div className="min-h-screen bg-gray-50 flex">
        <TeachSidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </TaskFormProvider>
  );
}
