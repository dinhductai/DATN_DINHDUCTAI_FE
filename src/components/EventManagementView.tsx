import { Card } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  Calendar, Users, User, BarChart3, Edit, Trash2,
  MapPin, Video, Clock, AlertCircle, Plus, Search, X
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { taskService } from '../services/taskService'
import { toast } from 'sonner'
import { ConfirmDialog } from './ConfirmDialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Textarea } from './ui/textarea'
import { useTranslation } from '../contexts/LanguageContext'

interface EventItem {
  eventId: number
  taskId: number
  title: string
  description: string
  startTime: string
  deadline: string
  status: string
  priority: string
  eventDescription: string
  linkEvent: string
  location: string
  isOnline: boolean
  reminderMinutesBefore: number
  invitedEmails: string[]
}

interface EventStats {
  totalEvents: number
  personalEvents: number
  groupEvents: number
  eventsByPriority: Array<{ priority: string; taskId: number }>
}

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#22c55e',
}

const STATUS_COLORS: Record<string, string> = {
  TODO: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
}

export function EventManagementView() {
  const { t } = useTranslation()

  const PRIORITY_LABELS: Record<string, string> = {
    HIGH: t('priority_high'),
    MEDIUM: t('priority_medium'),
    LOW: t('priority_low'),
  }

  const STATUS_LABELS: Record<string, string> = {
    TODO: t('status_todo'),
    IN_PROGRESS: t('status_inProgress'),
    DONE: t('status_done'),
  }

  const [stats, setStats] = useState<EventStats | null>(null)
  const [recentEvents, setRecentEvents] = useState<EventItem[]>([])
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [filteredEvents, setFilteredEvents] = useState<EventItem[]>([])

  // Edit dialog
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Delete dialog
  const [deletingEvent, setDeletingEvent] = useState<EventItem | null>(null)

  // Edit form state
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editEventDescription, setEditEventDescription] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editLink, setEditLink] = useState('')
  const [editIsOnline, setEditIsOnline] = useState(false)
  const [editPriority, setEditPriority] = useState<string>('MEDIUM')
  const [editStatus, setEditStatus] = useState<string>('TODO')
  const [editIsSaving, setEditIsSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase()
      setFilteredEvents(recentEvents.filter(e =>
        e.title.toLowerCase().includes(keyword) ||
        e.description?.toLowerCase().includes(keyword) ||
        e.eventDescription?.toLowerCase().includes(keyword) ||
        e.invitedEmails?.some(email => email.toLowerCase().includes(keyword))
      ))
    } else {
      setFilteredEvents(recentEvents)
    }
  }, [searchKeyword, recentEvents])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [statsData, allEventsData, upcomingData] = await Promise.all([
        taskService.getEventStatisticsYear().catch(() => null),
        taskService.getAllEvents().catch(() => []),
        taskService.getUpcomingEvents(20).catch(() => [])
      ])

      setStats(statsData)
      setRecentEvents(allEventsData)
      setFilteredEvents(allEventsData)
      setUpcomingEvents(upcomingData)
    } catch (err) {
      console.error('Error fetching event data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Pie chart data
  const pieData = stats ? [
    { name: t('events_personal'), value: stats.personalEvents, color: '#3b82f6' },
    { name: t('events_group'), value: stats.groupEvents, color: '#8b5cf6' },
  ] : []

  // Bar chart data (events by priority)
  const priorityData = stats?.eventsByPriority.map(item => ({
    name: PRIORITY_LABELS[item.priority] || item.priority,
    count: Number(item.title) || 0,
    fill: PRIORITY_COLORS[item.priority] || '#94a3b8'
  })) || []

  const formatDateTime = (isoString: string | null) => {
    if (!isoString) return '-'
    const date = new Date(isoString)
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleOpenEdit = (event: EventItem) => {
    setEditingEvent(event)
    setEditTitle(event.title)
    setEditDescription(event.description || '')
    setEditEventDescription(event.eventDescription || '')
    setEditLocation(event.location || '')
    setEditLink(event.linkEvent || '')
    setEditIsOnline(event.isOnline || false)
    setEditPriority(event.priority || 'MEDIUM')
    setEditStatus(event.status || 'TODO')
    setIsEditing(true)
  }

  const handleCloseEdit = () => {
    setIsEditing(false)
    setEditingEvent(null)
  }

  const handleSaveEdit = async () => {
    if (!editingEvent) return
    setEditIsSaving(true)
    try {
      const { updateTask } = await import('../services/taskService')
      await updateTask(editingEvent.taskId, {
        title: editTitle,
        description: editDescription,
        priority: editPriority as any,
        status: editStatus as any,
        eventId: editingEvent.eventId,
        eventUpdateRequest: {
          eventDescription: editEventDescription,
          location: editLocation,
          linkEvent: editLink,
          isOnline: editIsOnline,
        }
      })
      toast.success(t('events_updateSuccess'))
      handleCloseEdit()
      fetchData()
    } catch (err: any) {
      toast.error(err.message || t('events_updateFailed'))
    } finally {
      setEditIsSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingEvent) return
    try {
      await taskService.deleteEvent(deletingEvent.taskId, deletingEvent.eventId)
      toast.success(t('events_deleteSuccess'))
      setDeletingEvent(null)
      fetchData()
    } catch (err: any) {
      toast.error(err.message || t('events_deleteFailed'))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Đang tải dữ liệu sự kiện...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 overflow-auto h-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-1">{t('events_title')}</h1>
        <p className="text-sm text-gray-500">{t('events_subtitle')}</p>
      </div>

      {/* Upcoming Events */}
      <Card className="p-4 flex flex-col" style={{ maxHeight: '420px' }}>
        <div className="flex items-center justify-between mb-3 shrink-0">
          <h3 className="font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-600" />
            {t('events_upcoming')}
          </h3>
          <span className="text-xs text-gray-400">{upcomingEvents.length} sự kiện</span>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Calendar className="w-10 h-10 text-gray-200 mb-2" />
            <p className="text-sm text-gray-400 text-center">{t('events_noUpcoming')}</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {upcomingEvents.map(event => {
              const now = new Date().getTime()
              const start = new Date(event.startTime).getTime()
              const diffMs = start - now
              const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
              const diffDays = Math.floor(diffHours / 24)

              let timeLabel = ''
              if (diffDays > 0) {
                timeLabel = t('events_daysLeft').replace('{days}', String(diffDays))
              } else if (diffHours > 0) {
                timeLabel = t('events_hoursLeft').replace('{hours}', String(diffHours))
              } else {
                timeLabel = t('events_aboutToStart')
              }

              return (
                <div
                  key={event.eventId}
                  className="p-3 rounded-lg border border-green-100 bg-white hover:border-green-300 hover:bg-green-50/30 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                      {event.eventDescription && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{event.eventDescription}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`text-xs px-2 py-1 rounded-lg font-medium ${
                          diffDays === 0 && diffHours < 2
                            ? 'bg-red-100 text-red-700'
                            : diffDays === 0
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {timeLabel}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDateTime(event.startTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {event.isOnline ? (
                          <span className="text-xs text-blue-600 flex items-center gap-0.5">
                            <Video className="w-3 h-3" /> {t('events_online')}
                          </span>
                        ) : event.location ? (
                          <span className="text-xs text-gray-500 flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" /> {event.location}
                          </span>
                        ) : null}
                        {event.invitedEmails && event.invitedEmails.length > 0 && (
                          <span className="text-xs text-purple-600 flex items-center gap-0.5">
                            <Users className="w-3 h-3" /> {event.invitedEmails.length}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(event) }}
                        className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                        title={t('common_update')}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeletingEvent(event) }}
                        className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                        title={t('common_delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Recent Events */}
      <Card className="p-4 flex flex-col" style={{ maxHeight: '420px' }}>
        <div className="flex items-center justify-between mb-3 shrink-0">
          <h3 className="font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-600" />
            {t('events_recent')}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{recentEvents.length} sự kiện</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3 shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
          <Input
            placeholder={t('events_searchPlaceholder')}
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>

        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Calendar className="w-10 h-10 text-gray-200 mb-2" />
            <p className="text-sm text-gray-400 text-center">{t('events_none')}</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredEvents.map(event => (
              <div
                key={event.eventId}
                className="p-3 rounded-lg border border-gray-100 bg-white hover:border-purple-200 hover:bg-purple-50/30 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                    {event.eventDescription && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{event.eventDescription}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={`text-xs px-2 py-1 rounded-lg font-medium ${STATUS_COLORS[event.status] || ''}`}>
                        {STATUS_LABELS[event.status] || event.status}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(event.startTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      {event.isOnline ? (
                        <span className="text-xs text-blue-600 flex items-center gap-0.5">
                          <Video className="w-3 h-3" /> {t('events_online')}
                        </span>
                      ) : event.location ? (
                        <span className="text-xs text-gray-500 flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" /> {event.location}
                        </span>
                      ) : null}
                      {event.invitedEmails && event.invitedEmails.length > 0 && (
                        <span className="text-xs text-purple-600 flex items-center gap-0.5">
                          <Users className="w-3 h-3" /> {event.invitedEmails.length} {t('events_people')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenEdit(event) }}
                      className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                      title={t('common_update')}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingEvent(event) }}
                      className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                      title={t('common_delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Compact charts: Events in year + Events by priority, side by side */}
      <div className="grid grid-cols-2 gap-4">
        {/* Pie Chart: Events in year */}
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-purple-600" />
            Sự kiện trong năm {new Date().getFullYear()}
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              {stats && (stats.totalEvents > 0) ? (
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="40%"
                      cy="50%"
                      outerRadius={55}
                      innerRadius={35}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value} sự kiện`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[140px] flex items-center justify-center">
                  <p className="text-xs text-gray-400">{t('events_noEvents')}</p>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 shrink-0 min-w-[100px]">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-800">{stats?.personalEvents || 0} <span className="text-[10px] text-gray-400 font-normal">({stats && stats.totalEvents > 0 ? ((stats.personalEvents / stats.totalEvents) * 100).toFixed(0) : 0}%)</span></p>
                  <p className="text-[10px] text-gray-400">{t('events_personal')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gray-800">{stats?.groupEvents || 0} <span className="text-[10px] text-gray-400 font-normal">({stats && stats.totalEvents > 0 ? ((stats.groupEvents / stats.totalEvents) * 100).toFixed(0) : 0}%)</span></p>
                  <p className="text-[10px] text-gray-400">{t('events_group')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bar Chart: Events by Priority */}
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <h3 className="font-semibold text-sm flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-orange-600" />
            {t('events_byPriority')}
          </h3>
          {priorityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={priorityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => `${value} sự kiện`} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {priorityData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[160px] flex items-center justify-center">
              <p className="text-xs text-gray-400">{t('events_noPriorityData')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Event Dialog */}
      <Dialog open={isEditing} onOpenChange={handleCloseEdit}>
        <DialogContent className="!p-0 !pt-0 max-w-lg" style={{ display: 'flex', flexDirection: 'column', maxHeight: '85vh', overflow: 'hidden' }}>
          <div className="px-6 pb-0 shrink-0">
            <DialogHeader className="pb-0">
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Cập nhật sự kiện
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="edit-title">{t('events_titleLabel')}</Label>
              <Input id="edit-title" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-desc">{t('events_descLabel')}</Label>
              <Textarea id="edit-desc" rows={2} value={editDescription} onChange={e => setEditDescription(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-event-desc">{t('events_eventDesc')}</Label>
              <Textarea id="edit-event-desc" rows={2} value={editEventDescription} onChange={e => setEditEventDescription(e.target.value)} placeholder={t('events_updateDescPlaceholder')} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t('events_priorityLabel')}</Label>
                <Select value={editPriority} onValueChange={setEditPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded" />
                        <span>{t('priority_high')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="MEDIUM">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded" />
                        <span>{t('priority_medium')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="LOW">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded" />
                        <span>{t('priority_low')}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">{t('status_todo')}</SelectItem>
                    <SelectItem value="IN_PROGRESS">{t('status_inProgress')}</SelectItem>
                    <SelectItem value="DONE">{t('status_done')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setEditIsOnline(!editIsOnline)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editIsOnline ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${editIsOnline ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <Label className="cursor-pointer select-none">
                {editIsOnline ? t('events_onlineEvent') : t('events_offlineEvent')}
              </Label>
            </div>

            {editIsOnline ? (
              <div className="space-y-2">
                <Label>Đường link họp</Label>
                <Input type="url" placeholder={t('events_meetingLinkPlaceholder')} value={editLink} onChange={e => setEditLink(e.target.value)} />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Địa điểm</Label>
                <Input placeholder={t('events_locationPlaceholder')} value={editLocation} onChange={e => setEditLocation(e.target.value)} />
              </div>
            )}
          </div>

          <div className="px-6 pt-3 pb-6 border-t shrink-0">
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={handleCloseEdit} disabled={editIsSaving}>
                {t('common_cancel')}
              </Button>
              <Button onClick={handleSaveEdit} disabled={editIsSaving} className="bg-blue-600 hover:bg-blue-700">
                {editIsSaving ? 'Đang lưu...' : t('events_saveChanges')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingEvent}
        onClose={() => setDeletingEvent(null)}
        onConfirm={handleConfirmDelete}
        title={t('events_deleteTitle')}
        description={t('events_deleteConfirm').replace('{title}', deletingEvent?.title || '')}
        confirmText={t('common_delete')}
        cancelText={t('common_cancel')}
        variant="destructive"
      />
    </div>
  )
}
