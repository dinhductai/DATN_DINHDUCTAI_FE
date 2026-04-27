import { useState, useEffect } from 'react'
import { Card } from './ui/card'
import { Input } from './ui/input'
import { Search, Calendar, Clock } from 'lucide-react'
import { searchTasksByTitle } from '../services/taskService'
import { TaskResponse } from '../types/task'

export function TaskSearchPanel() {
  const [searchTitle, setSearchTitle] = useState('')
  const [searchResults, setSearchResults] = useState<TaskResponse[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Debounce search
  useEffect(() => {
    if (!searchTitle.trim()) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(() => {
      handleSearch(searchTitle)
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(timer)
  }, [searchTitle])

  const handleSearch = async (title: string) => {
    if (!title.trim()) {
      setSearchResults([])
      return
    }

    try {
      setIsSearching(true)
      const results = await searchTasksByTitle(title)
      setSearchResults(results)
    } catch (error) {
      console.error('Error searching tasks:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
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

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search tasks by title..."
            value={searchTitle}
            onChange={(e) => setSearchTitle(e.target.value)}
            className="pl-10"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      </Card>

      {/* Search Results */}
      {searchTitle.trim() && (
        <div className="space-y-3">
          {searchResults.length === 0 ? (
            <Card className="p-6">
              <p className="text-center text-gray-500">
                {isSearching ? 'Searching...' : 'No tasks found matching your search'}
              </p>
            </Card>
          ) : (
            <>
              <div className="text-sm text-gray-600 px-1">
                Found {searchResults.length} task{searchResults.length !== 1 ? 's' : ''}
              </div>
              {searchResults.map((task) => (
                <Card key={task.taskId} className="p-4 hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    {/* Title and Priority */}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-lg flex-1">{task.title}</h3>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>

                    {/* Description */}
                    {task.description && (
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {/* Deadline */}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Deadline:</span>
                      <span className="font-medium text-gray-700">
                        {formatDate(task.deadline)}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        task.status === 'DONE' 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : task.status === 'IN_PROGRESS'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
