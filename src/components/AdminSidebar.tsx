'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Users, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';

export function AdminSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { icon: BarChart3, label: 'Stats', href: '/admin' },
    { icon: Users, label: 'Users', href: '/admin/users' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin' || pathname === '/admin/';
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isAdmin');
    // Clear cookies
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax; secure';
    document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax; secure';
    document.cookie = 'userEmail=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax; secure';
    document.cookie = 'isAdmin=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax; secure';
    window.location.href = '/login';
  };

  return (
    <div className="w-56 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6">
        <Link href="/admin" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">SS</span>
          </div>
          <span className="font-semibold text-gray-900">Smart Schedule</span>
        </Link>
      </div>

      {/* Admin Profile */}
      <div className="px-6 mb-6">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400"
              alt="Admin"
            />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-sm">Administrator</div>
            <div className="text-xs text-gray-400">System Admin</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <div className="space-y-1">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                isActive(item.href)
                  ? 'text-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6 border-t pt-4">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg w-full"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </div>
  );
}
