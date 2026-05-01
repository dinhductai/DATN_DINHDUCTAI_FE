import { Search, Sparkles, Bell, ChevronDown, X, Calendar, Clock } from 'lucide-react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { pushNotificationService } from '../services/pushNotificationService'
import { useState, useEffect } from 'react'
import { searchTasksByTitle } from '../services/taskService'
import { TaskResponse } from '../types/task'
import { useNavigate } from 'react-router-dom'

interface ScheduleHeaderProps {
  onOpenAIChat: () => void
  onTaskClick?: (task: TaskResponse) => void
}

export function ScheduleHeader({ onOpenAIChat, onTaskClick }: ScheduleHeaderProps) {
  const navigate = useNavigate()
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<TaskResponse[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

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

  const checkSubscriptionStatus = async () => {
    try {
      const subscribed = await pushNotificationService.isSubscribed();
      setIsSubscribed(subscribed);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleNotificationToggle = async () => {
    setIsLoading(true);
    
    try {
      if (isSubscribed) {
        await pushNotificationService.unsubscribe();
        setIsSubscribed(false);
      } else {
        const permission = await pushNotificationService.requestPermission();
        if (permission === 'granted') {
          await pushNotificationService.subscribe();
          setIsSubscribed(true);
        } else {
          alert('Thông báo bị từ chối. Vui lòng bật trong cài đặt trình duyệt.');
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      alert('Không thể cập nhật cài đặt thông báo. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

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
      case 'DONE':       return 'Hoàn thành'
      default:           return status
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

            {/* Inline Search Dropdown */}
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

            <Button 
              variant="ghost" 
              size="icon" 
              className={`relative ${isSubscribed ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={handleNotificationToggle}
              disabled={isLoading}
              title={isSubscribed ? 'Tắt thông báo' : 'Bật thông báo'}
            >
              <Bell className="w-5 h-5" />
              {isSubscribed && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full"></div>
              )}
            </Button>

            <Avatar 
              className="w-9 h-9 cursor-pointer hover:ring-2 hover:ring-blue-200 transition-all"
              onClick={() => navigate('/profile')}
            >
              <ImageWithFallback 
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdHxlbnwxfHx8fDE3NjAwNDEwMjd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="User"
              />
              <AvatarFallback>JC</AvatarFallback>
            </Avatar>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </>
  )
}
