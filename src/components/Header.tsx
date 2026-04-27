import { Search, Bell, ChevronDown } from 'lucide-react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'

export function Header() {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
            + Add New Widgets
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search anything..."
              className="pl-10 w-64 bg-gray-50 border-0"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></span>
          </Button>

          {/* User Profile */}
          <div className="flex items-center space-x-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src="/api/placeholder/32/32" alt="User" />
              <AvatarFallback>SW</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-gray-900">Sheyla W.</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  )
}