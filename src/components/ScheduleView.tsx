import { ChevronLeft, ChevronRight, Circle, Clock, CheckCircle2 } from 'lucide-react'
import { Button } from './ui/button'
import { Task } from './TaskFormDialog'
import { PriorityLevel, TaskStatus } from '../types/task'

// ─── Config ───────────────────────────────────────────────────────────────────
const PX_PER_MINUTE = 1   // 1px per minute  →  1 hour = 60px
const HOUR_HEIGHT   = 60  // px per hour (must match grid lines in JSX)
const DAY_HEADER_HEIGHT = 56 // px — sticky header height per day column
const MIN_EVENT_SHOW_TITLE = 15 // minutes — below this, no title displayed

// ─── Types ────────────────────────────────────────────────────────────────────
interface TaskPosition {
  top: number       // px from top of day column
  height: number    // px
  duration: number  // minutes
  left: number      // % offset within column (for overlap)
  width: number     // % width of column (for overlap)
  index: number     // column index among overlapping events (0, 1, 2…)
}

interface ScheduleViewProps {
  tasks: Task[]
  selectedDateRange: { start: Date; end: Date }
  onDateRangeChange: (direction: 'prev' | 'next') => void
  onCalendarClick: (date: Date, hour: number) => void
  onTaskClick: (task: Task) => void
}

// ─── Core helpers ─────────────────────────────────────────────────────────────

/**
 * Detects overlapping events and assigns left/width so they sit side-by-side
 * inside the day column, just like Google Calendar.
 *
 * Algorithm: sweep-line — sort by start time, merge non-overlapping segments,
 * assign a column index to each event.  Overlapping events share the total
 * column count; non-overlapping events reuse column space.
 */
function resolveOverlaps(taskList: Task[], day: Date): TaskPosition[] {
  if (!taskList.length) return []

  // Build (startMin, endMin) pairs clamped to this day
  const events = taskList.map(t => {
    const taskStart = new Date(t.startDate)
    const taskEnd   = new Date(t.deadline)
    const dayStart  = new Date(day); dayStart.setHours(0, 0, 0, 0)
    const dayEnd    = new Date(day); dayEnd.setHours(23, 59, 59, 999)

    const s = Math.max(0, (taskStart < dayStart ? dayStart : taskStart).getTime() - dayStart.getTime()) / 60_000
    const e = Math.max(0, (taskEnd   > dayEnd   ? dayEnd   : taskEnd).getTime()   - dayStart.getTime()) / 60_000

    return { task: t, start: s, end: e }
  })

  // Sort by start time
  events.sort((a, b) => a.start - b.start)

  // Assign column groups (groups[i] = array of events in the same column)
  const columns: typeof events[] = []

  for (const ev of events) {
    let placed = false
    for (const col of columns) {
      // Can this event fit at the bottom of this column?
      const last = col[col.length - 1]
      if (ev.start >= last.end) {
        col.push(ev)
        placed = true
        break
      }
    }
    if (!placed) {
      columns.push([ev])
    }
  }

  const totalCols = columns.length

  // Build positions
  return events.map(ev => {
    // Find which column this event is in
    let colIndex = 0
    for (let i = 0; i < columns.length; i++) {
      if (columns[i].includes(ev)) { colIndex = i; break }
    }

    const colCount = totalCols
    const pctWidth = 100 / colCount
    const left     = colIndex * pctWidth
    const width    = pctWidth - 0.5 // tiny gap between overlapping events

    return {
      top:      ev.start * PX_PER_MINUTE,
      height:   Math.max(4, (ev.end - ev.start) * PX_PER_MINUTE),
      duration: ev.end - ev.start,
      left,
      width,
      index: colIndex,
    }
  })
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ScheduleView({ tasks, selectedDateRange, onDateRangeChange, onCalendarClick, onTaskClick }: ScheduleViewProps) {
  
  // ── Derived data per day ──────────────────────────────────────────────────
  const daysDiff    = Math.ceil((selectedDateRange.end.getTime() - selectedDateRange.start.getTime()) / (1000 * 60 * 60 * 24))
  const numberOfDays = Math.min(Math.max(daysDiff, 3), 15)

  const days = Array.from({ length: numberOfDays }, (_, i) => {
    const date = new Date(selectedDateRange.start)
    date.setDate(date.getDate() + i)
    return date
  })

  // Group tasks by the day they fall on so overlap resolution is per-column
  const tasksByDay = days.map(day => {
    const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0)
    const dayEnd   = new Date(day); dayEnd.setHours(23, 59, 59, 999)

    const dayTasks = tasks.filter(task => {
      const s = new Date(task.startDate)
      const e = new Date(task.deadline)
      return e >= dayStart && s <= dayEnd
    })

    const positions = resolveOverlaps(dayTasks, day)
    return { day, dayTasks, positions }
  })

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getPriorityColor = (priority: PriorityLevel) => {
    switch (priority) {
      case PriorityLevel.HIGH:   return 'bg-red-500 text-white'
      case PriorityLevel.MEDIUM: return 'bg-yellow-500 text-white'
      case PriorityLevel.LOW:    return 'bg-green-500 text-white'
    }
  }

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:        return Circle
      case TaskStatus.IN_PROGRESS: return Clock
      case TaskStatus.DONE:         return CheckCircle2
      default:                     return Circle
    }
  }

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
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

      {/*
        ── Time grid ───────────────────────────────────────────────────────────
        Layout: [80px time axis] | [flex-1 day columns × N]
        Total time area: 24 h × 60 px/h = 1440 px.
        Each day column is position:relative so its events (position:absolute) are
        positioned relative to it.
      */}
      <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden" style={{ height: 1440 + DAY_HEADER_HEIGHT }}>
        {/* ── Time axis (left column) ─────────────────────────────── */}
        <div className="flex-shrink-0 w-20 bg-gray-50 border-r border-gray-200 flex flex-col">
          {/* Header spacer */}
          <div style={{ height: DAY_HEADER_HEIGHT, borderBottom: '1px solid var(--color-gray-200)' }} />

          {/* 24 hour labels */}
          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={h}
              className="text-xs text-gray-400 pr-2 text-right leading-none"
              style={{ height: HOUR_HEIGHT }}
            >
              <span className="transform -translate-y-1/2 block">
                {h.toString().padStart(2, '0')}:00
              </span>
            </div>
          ))}
        </div>

        {/* ── Day columns ───────────────────────────────────────── */}
        {tasksByDay.map(({ day, dayTasks, positions }, dayIdx) => (
          <div
            key={dayIdx}
            className="flex-1 relative border-r border-gray-200 last:border-r-0"
          >
            {/* Day header — sticky at the top */}
            <div
              className="bg-gray-50 border-b border-gray-200 text-center py-2 flex-shrink-0"
              style={{ height: DAY_HEADER_HEIGHT }}
            >
              <div className="text-xs text-gray-400">{dayNames[day.getDay()]}</div>
              <div className="text-base font-semibold">{day.getDate()}</div>
            </div>

            {/* Time area — relative so events position relative to this */}
            <div className="relative" style={{ height: 1440 }}>
              {/* Clickable overlay */}
              <div
                className="absolute inset-0 cursor-pointer"
                style={{ top: 0, zIndex: 0 }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const y = e.clientY - rect.top
                  const hour = Math.floor(y / HOUR_HEIGHT)
                  onCalendarClick(day, hour)
                }}
              />

              {/* Hour grid lines */}
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
                {Array.from({ length: 24 }, (_, h) => (
                  <div
                    key={h}
                    className="border-t border-gray-100 hover:border-gray-200 hover:bg-blue-50/30 transition-colors"
                    style={{ height: HOUR_HEIGHT }}
                  />
                ))}
              </div>

              {/* Events */}
              {dayTasks.map((task, taskIdx) => {
                const pos = positions[taskIdx]
                if (!pos || pos.height < 1) return null

                const duration  = pos.duration
                const showTitle = duration > MIN_EVENT_SHOW_TITLE
                const showDesc  = duration > 60
                const StatusIcon = getStatusIcon(task.status)
                const bgClass = getPriorityColor(task.priority)

                return (
                  <div
                    key={task.id}
                    className={`absolute overflow-hidden cursor-pointer hover:opacity-80 transition-opacity rounded-sm ${bgClass}`}
                    style={{
                      top:    `${pos.top}px`,
                      height: `${pos.height}px`,
                      left:   `${pos.left}%`,
                      width:  `${pos.width}%`,
                      zIndex: 10,
                    }}
                    onClick={(e) => { e.stopPropagation(); onTaskClick(task) }}
                  >
                    {showTitle ? (
                      <div className="p-1 h-full flex flex-col">
                        <div className="flex items-start justify-between gap-0.5">
                          <span className="text-[11px] font-semibold truncate leading-tight text-white">
                            {task.title}
                          </span>
                          <StatusIcon className="w-3 h-3 flex-shrink-0 opacity-80 text-white" />
                        </div>
                        {pos.height >= 36 && (
                          <span className="text-[10px] opacity-80 text-white mt-0.5 truncate block">
                            {formatTime(task.startDate)}
                          </span>
                        )}
                        {showDesc && pos.height >= 52 && (
                          <div className="text-[10px] opacity-70 mt-0.5 leading-snug text-white line-clamp-2 overflow-hidden">
                            {task.description}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Tiny event — color bar only */
                      <div className="w-full h-full" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
