import { Calendar, BarChart3, LogOut, Plus, Pin, Bell } from 'lucide-react'
import { Button } from './ui/button'
import { useState } from 'react'

interface TeachSidebarProps {
  activeView: 'schedule' | 'stats' | 'notifications'
  onViewChange: (view: 'schedule' | 'stats' | 'notifications') => void
  onNewTask: () => void
  onLogout: () => void
}

export function TeachSidebar({ activeView, onViewChange, onNewTask, onLogout }: TeachSidebarProps) {
  const [isPinned, setIsPinned] = useState(true)
  
  const menuItems = [
    { icon: Calendar, label: 'Lịch trình', view: 'schedule' as const },
    { icon: BarChart3, label: 'Bảng điều khiển', view: 'stats' as const },
    { icon: Bell, label: 'Thông báo', view: 'notifications' as const },
  ]

  return (
    <div className="w-56 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">SS</span>
            </div>
            <span className="font-semibold text-gray-900">Smart Schedule</span>
          </div>
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

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <div className="space-y-1">
          {menuItems.map((item, index) => (
            <div key={index} className="relative">
              <button
                onClick={() => onViewChange(item.view)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  activeView === item.view
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
              </button>
            </div>
          ))}
        </div>
      </nav>

      {/* New Task Button */}
      <div className="px-3 mb-4">
        <Button 
          onClick={onNewTask}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-6"
        >
          <Plus className="w-5 h-5 mr-2" />
          Tạo công việc
        </Button>
      </div>

      {/* Logout */}
      <div className="px-3 pb-6 border-t pt-4">
        <button 
          onClick={onLogout}
          className="flex items-center space-x-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg w-full"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Đăng xuất</span>
        </button>
      </div>
    </div>
  )
}
