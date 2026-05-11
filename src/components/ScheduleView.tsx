import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Circle, Clock, CheckCircle2, Calendar } from 'lucide-react'
import { Button } from './ui/button'
import { Task } from './TaskFormDialog'
import { PriorityLevel, TaskStatus } from '../types/task'
import { useTranslation } from '../contexts/LanguageContext'

// ─── Config ───────────────────────────────────────────────────────────────────
const PX_PER_MINUTE = 1   // 1px per minute  →  1 hour = 60px
const HOUR_HEIGHT   = 60  // px per hour (must match grid lines in JSX)
const DAY_HEADER_HEIGHT = 56 // px — sticky header height per day column
const MIN_EVENT_SHOW_TITLE = 30 // minutes — below this, no title displayed

// ─── Types ────────────────────────────────────────────────────────────────────
interface TaskPosition {
  top: number       // px from top of day column
  height: number   // px
  duration: number // minutes
  left: number     // % offset within column (for overlap)
  width: number    // % width of column (for overlap)
  index: number    // column index among overlapping events (0, 1, 2…)
}

interface ScheduleViewProps {
  tasks: Task[]
  selectedDateRange: { start: Date; end: Date }
  currentDate?: Date            // defaults to now; lets parent control it in tests
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
function resolveOverlaps(taskList: Task[], day: Date): Map<number, TaskPosition> {
  if (!taskList.length) return new Map()

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
  const result = new Map<number, TaskPosition>()

  for (const ev of events) {
    let colIndex = 0
    for (let i = 0; i < columns.length; i++) {
      if (columns[i].includes(ev)) { colIndex = i; break }
    }

    const pctWidth = 100 / totalCols
    const left     = colIndex * pctWidth
    const width    = pctWidth - 0.5 // tiny gap between overlapping events

    result.set(ev.task.id, {
      top:      ev.start * PX_PER_MINUTE,
      height:   Math.max(4, (ev.end - ev.start) * PX_PER_MINUTE),
      duration: ev.end - ev.start,
      left,
      width,
      index: colIndex,
    })
  }

  return result
}

// ─── Hook ────────────────────────────────────────────────────────────────────────

/** Returns the current Date, updated every 30 seconds so the time indicator re-renders. */
function useCurrentTime(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])
  return now
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ScheduleView({ tasks, selectedDateRange, currentDate, onDateRangeChange, onCalendarClick, onTaskClick }: ScheduleViewProps) {
  const { t } = useTranslation()
  const now = useCurrentTime()

  // ── Derived data per day ──────────────────────────────────────────────────
  const daysDiff    = Math.ceil((selectedDateRange.end.getTime() - selectedDateRange.start.getTime()) / (1000 * 60 * 60 * 24))
  const numberOfDays = Math.min(Math.max(daysDiff, 3), 15)

  const days = Array.from({ length: numberOfDays }, (_, i) => {
    const date = new Date(selectedDateRange.start)
    date.setDate(date.getDate() + i)
    return date
  })

  // Group tasks by the day they fall on so overlap resolution is per-column
  const todayStr = now.toDateString()
  const tasksByDay = days.map(day => {
    const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0)
    const dayEnd   = new Date(day); dayEnd.setHours(23, 59, 59, 999)
    const isToday  = day.toDateString() === todayStr

    const dayTasks = tasks.filter(task => {
      const s = new Date(task.startDate)
      const e = new Date(task.deadline)
      return e >= dayStart && s <= dayEnd
    })

    const positions = resolveOverlaps(dayTasks, day)
    return { day, dayTasks, positions, isToday }
  })

  // Find the task running right now (if any)
  const todayEntry = tasksByDay.find(e => e.isToday)
  const currentTask = todayEntry
    ? todayEntry.dayTasks.reduce<Task | null>((best, t) => {
        const pos = todayEntry.positions.get(t.id)
        if (!pos) return best
        // task is "running" if its start is at or before now
        const taskStart = new Date(t.startDate).getTime()
        if (taskStart > now.getTime()) return best
        // pick the one with the latest start (most recently started)
        if (!best) return t
        return taskStart > new Date(best.startDate).getTime() ? t : best
      }, null)
    : null
  const currentTop = (now.getHours() * 60 + now.getMinutes()) * PX_PER_MINUTE

  // Current time label
  const currentTimeLabel = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

  // Upcoming event: nearest event (isEvent = true) from all days in range
  const upcomingEvent = (() => {
    if (!tasksByDay.length) return null
    const allFutureEvents = tasksByDay.flatMap(e => e.dayTasks)
      .filter(t => t.isEvent && t.eventId != null && new Date(t.startDate).getTime() > now.getTime())
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    return allFutureEvents[0] || null
  })()

  const STATUS_LABELS: Record<string, string> = {
    TODO: t('status_todo'),
    IN_PROGRESS: t('status_inProgress'),
    DONE: t('status_done'),
  }

  const PRIORITY_LABELS: Record<string, string> = {
    HIGH: t('priority_high'),
    MEDIUM: t('priority_medium'),
    LOW: t('priority_low'),
  }

  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

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
      case TaskStatus.DONE:        return CheckCircle2
      default:                     return Circle
    }
  }

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex flex-col">
      {/* Header row: Lịch trình của tôi (1/4) | Task info (3/4) → split 50/50 */}
      <div className="flex items-center mb-6 gap-6">
        {/* Left: Lịch trình của tôi + date range */}
        <div className="w-1/4 flex-shrink-0">
          <h1 className="text-2xl font-semibold mb-1">{t('schedule_mySchedule')}</h1>
          <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onDateRangeChange('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">
              {selectedDateRange.start.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })} - {selectedDateRange.end.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}
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

        {/* Right: split 50/50 */}
        <div className="flex-1 min-w-0 flex gap-6">

          {/* Left half: current task */}
          <div className="flex-1">
            {currentTask ? (
              <div className={`flex items-center gap-4 rounded-2xl px-6 py-6 border-l-8 ${
                currentTask.priority === 'HIGH' ? 'bg-red-50 dark:bg-red-900/20 border-red-400' :
                currentTask.priority === 'MEDIUM' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400' :
                'bg-green-50 dark:bg-green-900/20 border-green-400'
              }`}>
                <div className="flex-shrink-0">
                  {currentTask.status === 'DONE' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : currentTask.status === 'IN_PROGRESS' ? (
                    <Clock className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div className="flex flex-col min-w-0 flex-1 gap-3">
                  <div className="flex items-center gap-4 flex-wrap px-2">
                    <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{currentTimeLabel}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      currentTask.priority === 'HIGH' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' :
                      currentTask.priority === 'MEDIUM' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400' :
                      'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                    }`}>
                      {PRIORITY_LABELS[currentTask.priority]}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      currentTask.status === 'DONE' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' :
                      currentTask.status === 'IN_PROGRESS' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {STATUS_LABELS[currentTask.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 flex-wrap px-2">
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">{currentTask.title}</span>
                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500 flex-shrink-0">
                      {formatTime(currentTask.startDate)} → {formatTime(currentTask.deadline)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sm text-gray-400 dark:text-gray-500 rounded-2xl bg-gray-50 dark:bg-gray-800 px-6 py-6">
                <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span>{currentTimeLabel} — {t('schedule_noActiveTasks')}</span>
              </div>
            )}
          </div>

          {/* Right half: upcoming event (nearest isEvent = true) */}
          <div className="flex-1 flex flex-col gap-2">
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">{t('schedule_upcomingEvents')}</span>
            {upcomingEvent ? (
              <div
                className={`flex items-center gap-3 rounded-xl px-5 py-4 cursor-pointer border-l-4 ${
                  upcomingEvent.priority === 'HIGH' ? 'bg-red-50 dark:bg-red-900/20 border-red-400 hover:bg-red-100 dark:hover:bg-red-900/30' :
                  upcomingEvent.priority === 'MEDIUM' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30' :
                  'bg-green-50 dark:bg-green-900/20 border-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
                }`}
                onClick={() => onTaskClick(upcomingEvent)}
              >
                <div className="flex items-center justify-center gap-6 px-2 flex-1 min-w-0">
                  <Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span className="text-base font-semibold text-gray-800 dark:text-gray-100 truncate flex-shrink-0">{upcomingEvent.title}</span>
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 flex-shrink-0">
                    {formatTime(upcomingEvent.startDate)} → {formatTime(upcomingEvent.deadline)}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                    upcomingEvent.priority === 'HIGH' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' :
                    upcomingEvent.priority === 'MEDIUM' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400' :
                    'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                  }`}>
                    {PRIORITY_LABELS[upcomingEvent.priority]}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                    upcomingEvent.status === 'TODO' ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' :
                    upcomingEvent.status === 'IN_PROGRESS' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400' :
                    'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                  }`}>
                    {STATUS_LABELS[upcomingEvent.status]}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 rounded-xl bg-gray-50 dark:bg-gray-800 px-4 py-3">
                <Circle className="w-3 h-3" />
                <span>{t('schedule_noUpcomingEvents')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Time grid ───────────────────────────────────────────────────────────
        Layout: [80px time axis] | [flex-1 day columns × N]
        Total time area: 24 h × 60 px/h = 1440 px.
        Each day column is position:relative so its events (position:absolute) are
        positioned relative to it.
      */}
      <div className="flex bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden" style={{ height: 1440 + DAY_HEADER_HEIGHT }}>
        {/* ── Time axis (left column) ─────────────────────────────── */}
        <div className="flex-shrink-0 w-20 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Header spacer */}
          <div style={{ height: DAY_HEADER_HEIGHT, borderBottom: '1px solid var(--color-gray-200)' }} />

          {/* 24 hour labels */}
          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={h}
              className="text-xs text-gray-400 dark:text-gray-500 pr-2 text-right leading-none"
              style={{ height: HOUR_HEIGHT }}
            >
              <span className="transform -translate-y-1/2 block">
                {h.toString().padStart(2, '0')}:00
              </span>
            </div>
          ))}
        </div>

        {/* ── Day columns ───────────────────────────────────────── */}
        {tasksByDay.map(({ day, dayTasks, positions, isToday }, dayIdx) => (
          <div
            key={dayIdx}
            className="flex-1 relative border-r border-gray-200 dark:border-gray-700 last:border-r-0 px-1"
          >
            {/* Day header — sticky at the top */}
            <div
              className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-center py-2 flex-shrink-0"
              style={{ height: DAY_HEADER_HEIGHT }}
            >
              <div className="text-xs text-gray-400 dark:text-gray-500">{dayNames[day.getDay()]}</div>
              <div className="text-base font-semibold dark:text-gray-100">{day.getDate()}</div>
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
                    className="border-t border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                    style={{ height: HOUR_HEIGHT }}
                  />
                ))}
              </div>

              {/* Current-time indicator — only on today's column */}
              {isToday && (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    top: currentTop,
                    left: 0,
                    right: 0,
                    height: 2,
                    backgroundColor: '#3b82f6',
                    zIndex: 50,
                  }}
                >
                  {/* Blue dot on the left edge */}
                  <div
                    className="absolute"
                    style={{
                      left: -4,
                      top: -3,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: '#3b82f6',
                    }}
                  />
                </div>
              )}

              {/* Events */}
              {dayTasks.map((task) => {
                const pos = positions.get(task.id)
                if (!pos || pos.height < 1) return null

                const duration  = pos.duration
                const showTitle = duration >= MIN_EVENT_SHOW_TITLE
                const showDesc  = duration > 60
                const tinyText  = duration < 45
                const vTinyText = duration <= 35
                const StatusIcon = getStatusIcon(task.status)
                const bgClass = getPriorityColor(task.priority)

                return (
                  <div
                    key={task.id}
                    className={`absolute overflow-hidden cursor-pointer hover:opacity-80 transition-opacity rounded-sm ${bgClass}`}
                    style={{
                      top:    `${pos.top + 2}px`,
                      height: `${Math.max(pos.height - 4, 1)}px`,
                      left:   `${pos.left}%`,
                      width:  `calc(${pos.width}% - 8px)`,
                      marginLeft: '4px',
                      marginRight: '4px',
                      zIndex: 10,
                    }}
                    onClick={(e) => { e.stopPropagation(); onTaskClick(task) }}
                  >
                    {showTitle ? (
                      showDesc ? (
                        <div className="h-full flex flex-col justify-center px-3 py-1.5 gap-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-semibold truncate leading-tight text-white flex-1 min-w-0">
                              {task.title}
                            </span>
                            <StatusIcon className="w-3 h-3 flex-shrink-0 opacity-80 text-white" />
                          </div>
                          <span className="text-[9px] truncate leading-tight text-white opacity-80">
                            {task.description || 'Không có mô tả'}
                          </span>
                          <span className="text-[9px] opacity-80 text-white flex-shrink-0">
                            {formatTime(task.startDate)} - {formatTime(task.deadline)}
                          </span>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-between gap-2 px-3">
                          <span className={`${vTinyText ? 'text-[6px]' : tinyText ? 'text-[8px]' : 'text-[11px]'} font-semibold truncate leading-tight text-white flex-1 min-w-0`}>
                            {task.title}
                          </span>
                          <StatusIcon className="w-3 h-3 flex-shrink-0 opacity-80 text-white" />
                          <span className={`${vTinyText ? 'text-[5px]' : tinyText ? 'text-[7px]' : 'text-[10px]'} opacity-80 text-white flex-shrink-0`}>
                            {formatTime(task.startDate)} - {formatTime(task.deadline)}
                          </span>
                        </div>
                      )
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
