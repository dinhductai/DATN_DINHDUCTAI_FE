'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, BarChart3, LogOut, Plus, Pin } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { useState } from 'react';
import { useTaskForm } from '@/contexts/TaskFormContext';

export function TeachSidebar() {
  const pathname = usePathname();
  const { open } = useTaskForm();
  const [isPinned, setIsPinned] = useState(true);

  const menuItems = [
    { icon: Calendar, label: 'Schedule', href: '/dashboard/schedule' },
    { icon: BarChart3, label: 'Stats', href: '/dashboard/stats' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard/schedule') {
      return pathname === '/dashboard/schedule' || pathname === '/dashboard';
    }
    return pathname === href;
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
        <div className="flex items-center justify-between">
          <Link href="/dashboard/schedule" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">SS</span>
            </div>
            <span className="font-semibold text-gray-900">Smart Schedule</span>
          </Link>
          <button
            onClick={() => setIsPinned(!isPinned)}
            className="transition-colors"
          >
            <Pin
              className={`w-4 h-4 ${isPinned ? 'text-blue-600 fill-blue-600' : 'text-gray-400'}`}
            />
          </button>
        </div>
      </div>

      {/* User Profile */}
      <div className="px-6 mb-6">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdHxlbnwxfHx8fDE3NjAwNDEwMjd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="User"
            />
            <AvatarFallback>JC</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-sm">Jone Cooper</div>
            <div className="text-xs text-gray-400">UI Designer</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <div className="space-y-1">
          {menuItems.map((item, index) => (
            <div key={index} className="relative">
              <Link
                href={item.href}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  isActive(item.href)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </Link>
            </div>
          ))}
        </div>
      </nav>

      {/* New Task Button */}
      <div className="px-3 mb-4">
        <Button
          onClick={() => open()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-6"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Task
        </Button>
      </div>

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
