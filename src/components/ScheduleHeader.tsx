import { Search, Sparkles, Bell, ChevronDown, X, Clock } from 'lucide-react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Avatar, AvatarFallback } from './ui/avatar'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { userService } from '../services/userService'
import { useState, useEffect, useRef, useCallback } from 'react'
import { searchTasksByTitle } from '../services/taskService'
import { TaskResponse } from '../types/task'
import { NotificationItem } from '../types/notification'
import { notificationService, formatNotificationTime } from '../services/notificationService'
import { useNavigate } from 'react-router-dom'

interface ScheduleHeaderProps {
  onOpenAIChat: () => void
  onTaskClick?: (task: TaskResponse) => void
}

export function ScheduleHeader({ onOpenAIChat, onTaskClick }: ScheduleHeaderProps) {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<{ userName: string; profile?: string } | null>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<TaskResponse[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // Notification state
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  // Load notifications + connect WebSocket
  useEffect(() => {
    loadNotifications()

    const token = localStorage.getItem('token')
    if (!token) return

    notificationService.connect((incoming) => {
      setNotifications((prev) => [incoming, ...prev])
      setUnreadCount((c) => c + 1)
    })

    return () => {
      notificationService.disconnect()
    }
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const user = await userService.getMe()
      setCurrentUser({ userName: user.userName, profile: user.profile })
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const loadNotifications = async () => {
    try {
      const data = await notificationService.getNotifications()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const handleMarkAsRead = useCallback(async (id: number) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }, [])

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true)
        const results = await searchTasksByTitle(searchQuery)
        setSearchResults(results)
        setShowResults(true)
      } catch (error) {
        console.error('Error searching tasks:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleCloseSearch = () => {
    setShowResults(false)
    setSearchQuery('')
    setSearchResults([])
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':   return 'bg-red-100 text-red-700 border-red-200'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'LOW':    return 'bg-green-100 text-green-700 border-green-200'
      default:       return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'HIGH':   return 'Cao'
      case 'MEDIUM': return 'Trung bình'
      case 'LOW':    return 'Thấp'
      default:       return priority
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'TODO':        return 'Cần làm'
      case 'IN_PROGRESS': return 'Đang làm'
      case 'DONE':        return 'Hoàn thành'
      default:            return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DONE':        return 'bg-green-50 text-green-700'
      case 'IN_PROGRESS': return 'bg-blue-50 text-blue-700'
      default:            return 'bg-gray-50 text-gray-600'
    }
  }

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Search */}
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Tìm kiếm công việc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setShowResults(true)}
              className="pl-10 pr-10 bg-gray-50 border-gray-200 rounded-lg"
            />
            {searchQuery && (
              <button
                onClick={handleCloseSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}

            {showResults && searchQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 w-96 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    {isSearching ? 'Đang tìm kiếm...' : 'Không tìm thấy công việc phù hợp'}
                  </div>
                ) : (
                  <>
                    <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                      Tìm thấy {searchResults.length} công việc
                    </div>
                    {searchResults.map((task) => (
                      <div
                        key={task.taskId}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 transition-colors"
                        onClick={() => {
                          onTaskClick?.(task)
                          handleCloseSearch()
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium text-gray-900 text-sm">{task.title}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded border shrink-0 ${getPriorityColor(task.priority)}`}>
                            {getPriorityLabel(task.priority)}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(task.deadline).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${getStatusColor(task.status)}`}>
                            {getStatusLabel(task.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            <Button
              onClick={onOpenAIChat}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Trợ lý lịch trình
            </Button>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-gray-600 hover:bg-gray-50"
                onClick={() => setShowNotifications((v) => !v)}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>

              {showNotifications && (
                <div className="absolute top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden"
                  style={{ right: '0' }}>
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <span className="font-semibold text-gray-900 text-sm">Thông báo</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Đánh dấu tất cả đã đọc
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center text-sm text-gray-400">
                        Không có thông báo nào
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                          className={`px-4 py-3 border-b border-gray-50 last:border-0 cursor-pointer transition-colors ${
                            n.isRead ? 'bg-white hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className={`text-sm font-medium ${n.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                              {n.title}
                            </span>
                            {!n.isRead && (
                              <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{n.content}</p>
                          <span className="text-xs text-gray-400 mt-1 block">
                            {formatNotificationTime(n.createdAt)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Avatar
              className="w-9 h-9 cursor-pointer hover:ring-2 hover:ring-blue-200 transition-all"
              onClick={() => navigate('/profile')}
            >
              <ImageWithFallback
                src={currentUser?.profile || '/profile_picture.png'}
                alt={currentUser?.userName || 'User'}
              />
              <AvatarFallback>{currentUser?.userName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </>
  )
}
