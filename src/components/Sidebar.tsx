import { Plane, BarChart3, Users, Globe, MessageSquare, Settings, Moon } from 'lucide-react'
import { Button } from './ui/button'

export function Sidebar() {
  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', active: true },
    { icon: BarChart3, label: 'Deals' },
    { icon: Users, label: 'Clients' },
    { icon: Globe, label: 'My Site' },
    { icon: MessageSquare, label: 'Message', badge: '2' },
    { icon: Settings, label: 'Settings' },
  ]

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <Plane className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">Easy Flight</div>
            <div className="text-xs text-gray-500">Travel Company</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <nav className="space-y-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                item.active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className={`w-5 h-5 ${item.active ? 'text-blue-600' : 'text-gray-400'}`}>
                <item.icon />
              </div>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Premium Upgrade Card */}
      <div className="p-4">
        <div className="bg-gray-900 rounded-lg p-4 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-12 h-12 bg-purple-500 rounded-lg mb-3 flex items-center justify-center">
              <Plane className="w-6 h-6 text-white transform rotate-45" />
            </div>
            <div className="mb-2">
              <div className="text-sm">Updating your plan</div>
              <div className="text-sm">for Premium!</div>
            </div>
            <Button size="sm" className="bg-white text-gray-900 hover:bg-gray-100">
              Upgrade Now
            </Button>
          </div>
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500 opacity-20 rounded-full transform translate-x-4 -translate-y-4"></div>
        </div>
      </div>

      {/* Dark Mode Toggle */}
      <div className="p-4 border-t border-gray-200">
        <button className="flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg w-full">
          <Moon className="w-5 h-5" />
          <span>Dark Mode</span>
        </button>
      </div>
    </div>
  )
}