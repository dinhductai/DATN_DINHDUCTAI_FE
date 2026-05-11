import { ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle } from 'lucide-react'
import { Card } from './ui/card'
import { Button } from './ui/button'
import { useState, useEffect } from 'react'
import { taskService } from '../services/taskService'
import type { TaskResponse } from '../types/task'
import { useTranslation } from '../contexts/LanguageContext'

interface RightPanelProps {
  selectedDateRange: { start: Date; end: Date }
  onDateRangeSelect: (start: Date, end: Date) => void
}

export function RightPanel({ selectedDateRange, onDateRangeSelect }: RightPanelProps) {
  const { t } = useTranslation()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [dragStart, setDragStart] = useState<Date | null>(null)
  const [dragEnd, setDragEnd] = useState<Date | null>(null)
  const [todayTasks, setTodayTasks] = useState<TaskResponse[]>([])
  const [completedTasks, setCompletedTasks] = useState<TaskResponse[]>([])
  const [overdueTasks, setOverdueTasks] = useState<TaskResponse[]>([])
  const [loading, setLoading] = useState(true)

  const calendarDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'HIGH':   return t('priority_high')
      case 'MEDIUM': return t('priority_medium')
      case 'LOW':    return t('priority_low')
      default:       return priority
    }
  }

  useEffect(() => {
    const fetchTasksData = async () => {
      try {
        setLoading(true)
        console.log('[RightPanel] Fetching tasks data...')

        const today = await taskService.getTodayTasks().catch(err => {
          console.warn('[RightPanel] Today tasks fetch failed:', err)
          return []
        })
        console.log('[RightPanel] Today tasks received:', today)
        setTodayTasks(Array.isArray(today) ? today : [])

        const completed = await taskService.getCompletedTodayTasks().catch(err => {
          console.warn('[RightPanel] Completed today tasks fetch failed:', err)
          return []
        })
        console.log('[RightPanel] Completed tasks received:', completed)
        setCompletedTasks(Array.isArray(completed) ? completed : [])

        const overdue = await taskService.getOverdueTodayTasks().catch(err => {
          console.warn('[RightPanel] Overdue today tasks fetch failed:', err)
          return []
        })
        console.log('[RightPanel] Overdue tasks received:', overdue)
        setOverdueTasks(Array.isArray(overdue) ? overdue : [])

      } catch (error) {
        console.error('[RightPanel] Error fetching tasks data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTasksData()
  }, [])

  const generateCalendarDates = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    let startDay = firstDay.getDay() - 1
    if (startDay === -1) startDay = 6

    const dates: (Date | null)[] = []

    for (let i = 0; i < startDay; i++) {
      dates.push(null)
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      dates.push(new Date(year, month, i))
    }

    return dates
  }

  const dates = generateCalendarDates()

  const handleMouseDown = (date: Date | null) => {
    if (!date) return
    setDragStart(date)
    setDragEnd(date)
  }

  const handleMouseEnter = (date: Date | null) => {
    if (!date || !dragStart) return
    setDragEnd(date)
  }

  const handleMouseUp = () => {
    if (dragStart && dragEnd) {
      const start = dragStart < dragEnd ? dragStart : dragEnd
      const end = dragStart < dragEnd ? dragEnd : dragStart

      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

      if (diffDays < 3) {
        const newEnd = new Date(start)
        newEnd.setDate(newEnd.getDate() + 2)
        onDateRangeSelect(start, newEnd)
      } else if (diffDays > 15) {
        const newEnd = new Date(start)
        newEnd.setDate(newEnd.getDate() + 14)
        onDateRangeSelect(start, newEnd)
      } else {
        onDateRangeSelect(start, end)
      }
    }
    setDragStart(null)
    setDragEnd(null)
  }

  const isDateInRange = (date: Date | null) => {
    if (!date) return false
    const dateTime = date.getTime()
    const startTime = selectedDateRange.start.getTime()
    const endTime = selectedDateRange.end.getTime()
    return dateTime >= startTime && dateTime <= endTime
  }

  const isDateInDragRange = (date: Date | null) => {
    if (!date || !dragStart || !dragEnd) return false
    const dateTime = date.getTime()
    const start = Math.min(dragStart.getTime(), dragEnd.getTime())
    const end = Math.max(dragStart.getTime(), dragEnd.getTime())
    return dateTime >= start && dateTime <= end
  }

  const formatDateTime = (date: string | Date | undefined | null) => {
    if (!date) return t('rightPanel_noTasksToday')
    const d = new Date(date)
    return d.toLocaleString('vi-VN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() + (direction === 'next' ? 1 : -1))
    setCurrentMonth(newMonth)
  }

  return (
    <div className="w-80 space-y-4 flex-shrink-0">
      {/* Calendar Card */}
      <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-sm dark:text-gray-100">
            {currentMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-6 w-6 dark:hover:bg-gray-700" onClick={() => changeMonth('prev')}>
              <ChevronLeft className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 dark:hover:bg-gray-700" onClick={() => changeMonth('next')}>
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {calendarDays.map((day) => (
              <div key={day} className="text-xs text-gray-500 dark:text-gray-400 text-center font-medium">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1" onMouseLeave={handleMouseUp}>
            {dates.map((date, index) => (
              <div
                key={index}
                className={`text-xs text-center py-1 rounded-lg cursor-pointer select-none transition-colors ${
                  isDateInDragRange(date)
                    ? 'bg-blue-300 dark:bg-blue-700 text-white font-semibold'
                    : isDateInRange(date)
                    ? 'bg-blue-600 text-white font-semibold'
                    : date
                    ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    : ''
                }`}
                onMouseDown={() => handleMouseDown(date)}
                onMouseEnter={() => handleMouseEnter(date)}
                onMouseUp={handleMouseUp}
              >
                {date?.getDate()}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{t('rightPanel_dragHint')}</p>
      </Card>

      {/* Today's schedule */}
      <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-sm dark:text-gray-100">{t('rightPanel_todaySchedule')}</h3>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">{todayTasks.length} {t('rightPanel_tasks')}</span>
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="text-xs text-gray-400 dark:text-gray-500 py-2">{t('common_loading')}</div>
          ) : todayTasks.length > 0 ? (
            todayTasks.map((task) => (
              <div key={task.taskId} className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                      <span className="font-medium text-sm dark:text-gray-100">{task.title}</span>
                    </div>
                    {task.description && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 ml-4 mb-1">{task.description}</div>
                    )}
                    <div className="text-xs text-gray-600 dark:text-gray-400 ml-4">
                      {t('rightPanel_deadline')} {formatDateTime(task.deadline)}
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    task.priority === 'HIGH'   ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' :
                    task.priority === 'MEDIUM' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400' :
                    'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                  }`}>
                    {getPriorityLabel(task.priority)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-400 dark:text-gray-500 py-2">{t('rightPanel_noTasksToday')}</div>
          )}
        </div>
      </Card>

      {/* Completed */}
      <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
            <h3 className="font-semibold text-sm dark:text-gray-100">{t('rightPanel_completed')}</h3>
          </div>
        </div>

        <div className="space-y-3">
          {completedTasks.length > 0 ? (
            completedTasks.map((task) => (
              <div key={task.taskId} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm dark:text-gray-100">{task.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t('rightPanel_completedColon')} {formatDateTime(task.completedAt)}
                  </div>
                  <div className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                    task.priority === 'HIGH'   ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' :
                    task.priority === 'MEDIUM' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400' :
                    'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                  }`}>
                    {getPriorityLabel(task.priority)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-400 dark:text-gray-500 py-2">{t('rightPanel_noCompleted')}</div>
          )}
        </div>
      </Card>

      {/* Overdue */}
      <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <h3 className="font-semibold text-sm dark:text-gray-100">{t('rightPanel_overdue')}</h3>
          </div>
        </div>

        <div className="space-y-3">
          {overdueTasks.length > 0 ? (
            overdueTasks.map((task) => (
              <div key={task.taskId} className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm dark:text-gray-100">{task.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {t('rightPanel_dueDate')} {formatDateTime(task.deadline)}
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="text-xs text-red-600 dark:text-red-400 font-medium">{t('rightPanel_overdue')}</div>
                    <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                      task.priority === 'HIGH'   ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' :
                      task.priority === 'MEDIUM' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400' :
                      'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                    }`}>
                      {getPriorityLabel(task.priority)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-400 dark:text-gray-500 py-2">{t('rightPanel_noOverdue')}</div>
          )}
        </div>
      </Card>
    </div>
  )
}
