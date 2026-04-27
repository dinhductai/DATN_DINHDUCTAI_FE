'use client';

import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminStatsView } from '@/components/AdminStatsView';
import { AdminUsersView } from '@/components/AdminUsersView';
import { usePathname } from 'next/navigation';

export default function AdminDashboardPage() {
  const pathname = usePathname();
  const isUsersView = pathname === '/admin/users';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        {isUsersView ? <AdminUsersView /> : <AdminStatsView />}
      </div>
    </div>
  );
}
