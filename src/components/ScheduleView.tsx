import { ChevronLeft, ChevronRight, Circle, Clock, CheckCircle2 } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Task } from './TaskFormDialog'
import { PriorityLevel, TaskStatus } from '../types/task'

interface ScheduleViewProps {
  tasks: Task[]
  selectedDateRange: { start: Date; end: Date }
  onDateRangeChange: (direction: 'prev' | 'next') => void
  onCalendarClick: (date: Date, hour: number) => void
  onTaskClick: (task: Task) => void
}

export function ScheduleView({ tasks, selectedDateRange, onDateRangeChange, onCalendarClick, onTaskClick }: ScheduleViewProps) {
  const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`)
  
  // Calculate days between start and end
  const daysDiff = Math.ceil((selectedDateRange.end.getTime() - selectedDateRange.start.getTime()) / (1000 * 60 * 60 * 24))
  const numberOfDays = Math.min(Math.max(daysDiff, 3), 15)
  
  // Generate days array
  const days = Array.from({ length: numberOfDays }, (_, i) => {
    const date = new Date(selectedDateRange.start)
    date.setDate(date.getDate() + i)
    return date
  })

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getPriorityColor = (priority: PriorityLevel) => {
    switch (priority) {
      case PriorityLevel.HIGH:
        return 'bg-red-500 text-white'
      case PriorityLevel.MEDIUM:
        return 'bg-yellow-500 text-white'
      case PriorityLevel.LOW:
        return 'bg-green-500 text-white'
    }
  }

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return Circle
      case TaskStatus.IN_PROGRESS:
        return Clock
      case TaskStatus.DONE:
        return CheckCircle2
      default:
        return Circle
    }
  }

  const getTaskPosition = (task: Task, day: Date) => {
    const taskStart = new Date(task.startDate)
    const taskEnd = new Date(task.deadline)
    
    // Check if task is on this day
    const dayStart = new Date(day)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(day)
    dayEnd.setHours(23, 59, 59, 999)
    
    if (taskEnd < dayStart || taskStart > dayEnd) {
      return null
    }

    // Calculate start hour including minutes
    const startHour = taskStart.getDate() === day.getDate() 
      ? taskStart.getHours() + (taskStart.getMinutes() / 60)
      : 0

    // Calculate end hour including minutes
    const endHour = taskEnd.getDate() === day.getDate()
      ? taskEnd.getHours() + (taskEnd.getMinutes() / 60)
      : 24

    // Calculate position in pixels (60px per hour)
    const topPixels = (startHour % 1) * 60 // Minutes offset within the hour
    
    // Calculate height based on duration in hours (60px per hour)
    const durationHours = endHour - startHour
    const heightPixels = durationHours * 60

    return { top: topPixels, height: heightPixels, startHour }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-1">My Schedule</h1>
          <div className="flex items-center space-x-2 text-gray-500">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => onDateRangeChange('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">
              {selectedDateRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {selectedDateRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={() => onDateRangeChange('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          (GMT +06:00) Public Time
          <ChevronRight className="w-4 h-4 inline ml-1" />
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="grid" style={{ gridTemplateColumns: `80px repeat(${numberOfDays}, 1fr)` }}>
          {/* Time column header */}
          <div className="border-r border-gray-200 bg-gray-50"></div>
          
          {/* Day headers */}
          {days.map((day, idx) => (
            <div key={idx} className="text-center border-r border-gray-200 bg-gray-50 p-3 last:border-r-0">
              <div className="text-sm text-gray-500 mb-1">{dayNames[day.getDay()]}</div>
              <div className="text-lg font-semibold">{day.getDate()}</div>
            </div>
          ))}

          {/* Time slots */}
          {timeSlots.map((time, timeIdx) => (
            <div key={timeIdx} className="contents">
              <div className="text-sm text-gray-500 p-2 border-r border-t border-gray-200 bg-gray-50 text-right">
                {time}
              </div>
              
              {days.map((day, dayIdx) => {
                const hour = parseInt(time.split(':')[0])
                
                return (
                  <div 
                    key={dayIdx} 
                    className="border-r border-t border-gray-200 relative min-h-[60px] hover:bg-blue-50 cursor-pointer transition-colors last:border-r-0"
                    onClick={() => onCalendarClick(day, hour)}
                  >
                    {/* Render tasks for this day and time slot */}
                    {tasks.map((task) => {
                      const position = getTaskPosition(task, day)
                      if (!position || Math.floor(position.startHour) !== hour) return null

                      const StatusIcon = getStatusIcon(task.status)
                      
                      return (
                        <Card
                          key={task.id}
                          className={`absolute left-1 right-1 ${getPriorityColor(task.priority)} border-0 p-2 overflow-hidden z-10 cursor-pointer hover:opacity-90 transition-opacity`}
                          style={{
                            top: `${position.top}px`,
                            height: `${position.height}px`,
                            minHeight: '40px'
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            onTaskClick(task)
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold truncate">{task.title}</div>
                              <div className="text-xs opacity-90 mt-1">
                                {formatTime(task.startDate)}
                              </div>
                              <div className="text-xs opacity-75">
                                Due: {formatDate(task.deadline)} {formatTime(task.deadline)}
                              </div>
                            </div>
                            <StatusIcon className="w-3.5 h-3.5 flex-shrink-0 ml-1 opacity-90" />
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
