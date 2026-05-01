import { BarChart3, Users, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback } from './ui/avatar'
import { ImageWithFallback } from './figma/ImageWithFallback'

interface AdminSidebarProps {
  activeView: 'stats' | 'users'
  onViewChange: (view: 'stats' | 'users') => void
  onLogout: () => void
}

export function AdminSidebar({ activeView, onViewChange, onLogout }: AdminSidebarProps) {
  const menuItems = [
    { icon: BarChart3, label: 'Thống kê', view: 'stats' as const },
    { icon: Users, label: 'Người dùng', view: 'users' as const },
  ]

  return (
    <div className="w-56 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">SS</span>
          </div>
          <span className="font-semibold text-gray-900">Smart Schedule</span>
        </div>
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
            <div className="font-medium text-sm">Quản trị viên</div>
            <div className="text-xs text-gray-400">Quản trị hệ thống</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <div className="space-y-1">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => onViewChange(item.view)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                activeView === item.view
                  ? 'text-purple-600 bg-purple-50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

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
