import { X, Search, Calendar, Clock } from 'lucide-react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { TaskResponse } from '../types/task'

interface SearchResultsOverlayProps {
  isOpen: boolean
  onClose: () => void
  searchResults: TaskResponse[]
  isSearching: boolean
  searchQuery: string
  onTaskClick?: (task: TaskResponse) => void
}

export function SearchResultsOverlay({
  isOpen,
  onClose,
  searchResults,
  isSearching,
  searchQuery,
  onTaskClick
}: SearchResultsOverlayProps) {
  if (!isOpen) return null

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('vi-VN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'LOW':
        return 'bg-green-100 text-green-700 border-green-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
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
      case 'DONE':
        return 'bg-green-50 text-green-700 border border-green-200'
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-700 border border-blue-200'
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Results Panel */}
      <div className="relative max-w-2xl w-auto mx-4 bg-white rounded-2xl shadow-2xl max-h-[70vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Search className="w-5 h-5 text-gray-400" />
            <div>
              <span className="font-semibold text-gray-900">Kết quả tìm kiếm</span>
              <span className="text-gray-500 ml-2">cho "{searchQuery}"</span>
            </div>
            {isSearching && (
              <div className="ml-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Results Content */}
        <div className="overflow-y-auto max-h-[calc(70vh-80px)] p-6">
          {searchResults.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {isSearching ? 'Đang tìm kiếm...' : 'Không tìm thấy công việc phù hợp với tìm kiếm'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Tìm thấy {searchResults.length} công việc
              </p>
              {searchResults.map((task) => (
                <Card 
                  key={task.taskId} 
                  className="p-4 hover:shadow-md transition-all cursor-pointer border-l-4 border-l-blue-500"
                  onClick={() => onTaskClick?.(task)}
                >
                  <div className="space-y-3">
                    {/* Title and Priority */}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-lg flex-1">{task.title}</h3>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                    </div>

                    {/* Description */}
                    {task.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {/* Time Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Bắt đầu:</span>
                        <span className="font-medium text-gray-700">
                          {task.startTime ? formatDate(task.startTime) : 'Không có'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Hạn chót:</span>
                        <span className="font-medium text-gray-700">
                          {formatDate(task.deadline)}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
