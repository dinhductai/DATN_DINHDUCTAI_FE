import { Calendar, BarChart3, LogOut, Plus, Pin, CalendarDays } from 'lucide-react'
import { Button } from './ui/button'
import { useState } from 'react'
import { ConfirmDialog } from './ConfirmDialog'
import { useTranslation } from '../contexts/LanguageContext'

interface TeachSidebarProps {
  activeView: 'schedule' | 'stats' | 'notifications'
  onViewChange: (view: 'schedule' | 'stats' | 'notifications') => void
  onNewTask: () => void
  onLogout: () => void
}

export function TeachSidebar({ activeView, onViewChange, onNewTask, onLogout }: TeachSidebarProps) {
  const { t } = useTranslation()
  const [isPinned, setIsPinned] = useState(true)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const menuItems = [
    { icon: Calendar, label: t('sidebar_schedule'), view: 'schedule' as const },
    { icon: BarChart3, label: t('sidebar_stats'), view: 'stats' as const },
    { icon: CalendarDays, label: t('sidebar_events'), view: 'notifications' as const },
  ]

  return (
    <div className="w-56 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">TD</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-gray-100">{t('sidebar_appName')}</span>
          </div>
          <button
            onClick={() => setIsPinned(!isPinned)}
            className="transition-colors"
          >
            <Pin
              className={`w-4 h-4 ${isPinned ? 'text-blue-600 fill-blue-600' : 'text-gray-400 dark:text-gray-500'}`}
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
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
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
          {t('sidebar_createTask')}
        </Button>
      </div>

      {/* Logout */}
      <div className="px-3 pb-6 border-t dark:border-gray-700 pt-4">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center space-x-3 px-3 py-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg w-full"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">{t('sidebar_logout')}</span>
        </button>
      </div>
      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title={t('sidebar_logout')}
        description={t('sidebar_logoutConfirm')}
        onConfirm={onLogout}
        confirmText={t('common_confirm')}
        cancelText={t('common_cancel')}
        destructive
      />
    </div>
  )
}
