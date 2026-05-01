import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Alert, AlertDescription } from './ui/alert'
import { AlertCircle, Trash2, CalendarDays, Plus, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { updateTask, deleteTask } from '../services/taskService'
import { toast } from 'sonner'

import { PriorityLevel, TaskStatus, TaskCreationRequest, TaskResponse, EventCreationRequest, EventUpdateRequest } from '../types/task'

export interface Task {
  id: string
  title: string
  description: string
  startDate: string // ISO string (= createdAt from BE, which is actually startTime)
  deadline: string  // ISO string
  priority: PriorityLevel
  status: TaskStatus
  isEvent?: boolean
  eventId?: number | null
  eventCreationRequest?: EventCreationRequest
}

export const mapTaskResponseToTask = (response: TaskResponse): Task => ({
  id: response.taskId.toString(),
  title: response.title,
  description: response.description,
  startDate: response.startTime,
  deadline: response.deadline,
  priority: response.priority,
  status: response.status,
  isEvent: response.isEvent,
  eventId: response.eventId,
})

export const mapTaskToCreationRequest = (task: Omit<Task, 'id'>): TaskCreationRequest => ({
  title: task.title,
  description: task.description,
  startTime: task.startDate,
  deadline: task.deadline,
  priority: task.priority
})

interface TaskFormDialogProps {
  open: boolean
  onClose: () => void
  onSaveTask: (task: Omit<Task, 'id'> | Task) => void
  onDeleteTask?: (taskId: string) => void
  defaultStartDate?: string
  editingTask?: Task
  conflictWarning?: string
}

export function TaskFormDialog({ open, onClose, onSaveTask, onDeleteTask, defaultStartDate, editingTask, conflictWarning }: TaskFormDialogProps) {
  // ── Task fields ──────────────────────────────────────────────
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [deadline, setDeadline] = useState('')
  const [priority, setPriority] = useState<PriorityLevel>(PriorityLevel.MEDIUM)
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO)

  // ── Event toggle ─────────────────────────────────────────────
  const [isEvent, setIsEvent] = useState(false)

  // ── Event fields ─────────────────────────────────────────────
  const [eventDescription, setEventDescription] = useState('')
  const [linkEvent, setLinkEvent] = useState('')
  const [location, setLocation] = useState('')
  const [isOnline, setIsOnline] = useState(false)
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(30)
  const [invitedEmails, setInvitedEmails] = useState<string[]>([])

  // ── UI state ─────────────────────────────────────────────────
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const isEditMode = !!editingTask

  useEffect(() => {
    if (editingTask) {
      console.log('[TaskFormDialog] editingTask loaded:', { id: editingTask.id, isEvent: editingTask.isEvent, eventId: editingTask.eventId })
      setTitle(editingTask.title)
      setDescription(editingTask.description)

      const formatForInput = (isoString: string) => {
        const date = new Date(isoString)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${minutes}`
      }

      setStartDate(formatForInput(editingTask.startDate))
      setDeadline(formatForInput(editingTask.deadline))
      setPriority(editingTask.priority)
      setStatus(editingTask.status)
      // Populate event fields when editing an event (blank defaults — BE accepts partial updates)
      setIsEvent(!!editingTask.isEvent)
      setEventDescription('')
      setLinkEvent('')
      setLocation('')
      setIsOnline(false)
      setReminderMinutesBefore(30)
      setInvitedEmails([])
    } else {
      resetForm()
      if (defaultStartDate) {
        setStartDate(defaultStartDate)
      }
    }
  }, [editingTask, defaultStartDate])

  // Pre-fill current user's email as the first invited email entry on dialog open (create mode)
  useEffect(() => {
    if (!isEditMode && invitedEmails.length === 0) {
      const currentUserEmail = localStorage.getItem('email') || ''
      if (currentUserEmail) {
        setInvitedEmails([currentUserEmail])
      }
    }
  }, [isEditMode])

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setStartDate('')
    setDeadline('')
    setPriority(PriorityLevel.MEDIUM)
    setStatus(TaskStatus.TODO)
    setIsEvent(false)
    setEventDescription('')
    setLinkEvent('')
    setLocation('')
    setIsOnline(false)
    setReminderMinutesBefore(30)
    setInvitedEmails([])
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleAddEmailField = () => {
    setInvitedEmails((prev) => [...prev, ''])
  }

  const handleEmailChange = (index: number, value: string) => {
    setInvitedEmails((prev) => {
      const updated = [...prev]
      updated[index] = value
      return updated
    })
  }

  const handleRemoveEmailField = (index: number) => {
    setInvitedEmails((prev) => prev.filter((_, i) => i !== index))
  }

  const handleToggleEvent = () => {
    setIsEvent((prev) => {
      const next = !prev
      if (next) {
        // Switching ON: pre-fill current user email
        const currentUserEmail = localStorage.getItem('email') || ''
        setInvitedEmails(currentUserEmail ? [currentUserEmail] : [])
      } else {
        // Switching OFF: clear event fields
        setEventDescription('')
        setLinkEvent('')
        setLocation('')
        setIsOnline(false)
        setReminderMinutesBefore(30)
        setInvitedEmails([])
      }
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !startDate || !deadline) {
      toast.error('Vui lòng điền đầy đủ các trường bắt buộc')
      return
    }

    // Validate eventDescription when creating an event
    if (isEvent && !eventDescription.trim()) {
      toast.error('Mô tả sự kiện là bắt buộc khi tạo sự kiện')
      return
    }

    setIsSaving(true)
    try {
      const deadlineISO = new Date(deadline).toISOString()
      const startTimeISO = new Date(startDate).toISOString()

      if (isEditMode && editingTask) {
        const updatePayload: Parameters<typeof updateTask>[1] = {
          title,
          description,
          startTime: new Date(startDate).toISOString(),
          deadline: deadlineISO,
          priority,
          status,
        }

        if (isEvent && editingTask.eventId != null) {
          const nonEmptyEmails = invitedEmails.filter((e) => e.trim() !== '')
          const eventUpd: EventUpdateRequest = {
            ...(eventDescription.trim() && { eventDescription: eventDescription.trim() }),
            isOnline,
            ...(isOnline ? (linkEvent.trim() && { linkEvent: linkEvent.trim() }) : (location.trim() && { location: location.trim() })),
            reminderMinutesBefore,
            ...(nonEmptyEmails.length > 0 && { invitedEmails: nonEmptyEmails }),
          }
          updatePayload.eventId = editingTask.eventId
          updatePayload.eventUpdateRequest = eventUpd
        }

        const response = await updateTask(Number(editingTask.id), updatePayload)

        toast.success(isEvent ? 'Cập nhật sự kiện thành công' : 'Cập nhật công việc thành công')

        const updatedTask: Task = {
          id: response.taskId.toString(),
          title: response.title,
          description: response.description,
          startDate: response.startTime,
          deadline: response.deadline,
          priority: response.priority,
          status: response.status,
          isEvent: response.isEvent,
          eventId: response.eventId,
        }

        onSaveTask(updatedTask)
      } else {
        if (isEvent) {
          const nonEmptyEmails = invitedEmails.filter((e) => e.trim() !== '')
          const eventReq: EventCreationRequest = {
            eventDescription: eventDescription.trim(),
            linkEvent: linkEvent.trim() || undefined,
            location: location.trim() || undefined,
            isOnline,
            reminderMinutesBefore,
            invitedEmails: nonEmptyEmails,
            startTime: startTimeISO
          }

          onSaveTask({
            title,
            description,
            startDate: startTimeISO,
            deadline: deadlineISO,
            priority,
            status: TaskStatus.TODO,
            isEvent: true,
            eventCreationRequest: eventReq,
          })
        } else {
          // Normal task creation — existing flow
          onSaveTask({
            title,
            description,
            startDate,
            deadline,
            priority,
            status: TaskStatus.TODO
          })
        }
      }

      resetForm()
      onClose()
    } catch (error: any) {
      console.error('Error saving task:', error)
      toast.error(error.message || 'Lưu công việc thất bại')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editingTask || !onDeleteTask) return

    if (!confirm('Bạn có chắc muốn xóa công việc này?')) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteTask(Number(editingTask.id), editingTask.eventId ?? undefined)
      toast.success(isEvent ? 'Xóa sự kiện thành công' : 'Xóa công việc thành công')
      onDeleteTask(editingTask.id)
      resetForm()
      onClose()
    } catch (error: any) {
      console.error('Error deleting task:', error)
      toast.error(error.message || 'Lưu công việc thất bại')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="!p-0 !pt-0"
        style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden', maxWidth: '560px', width: '100%' }}
      >
          {/* Fixed top section */}
          <div className="px-6 pb-0 shrink-0">
            <DialogHeader className="pb-0 flex flex-row items-center gap-4">
              <div className="flex items-center">
                <h2 className="text-lg leading-none font-semibold">
                  {isEditMode
                    ? (isEvent ? 'Sửa sự kiện' : 'Sửa công việc')
                    : (isEvent ? 'Tạo sự kiện mới' : 'Tạo công việc mới')}
                </h2>
                {!isEditMode && (
                  <>
                    <button
                      type="button"
                      onClick={handleToggleEvent}
                      title={isEvent ? 'Chuyển sang công việc thường' : 'Chuyển thành sự kiện'}
                      className={`ml-4 p-1.5 rounded-md border-2 transition-all duration-200 cursor-pointer ${
                        isEvent
                          ? 'border-blue-500 bg-blue-50 text-blue-600 hover:bg-blue-100'
                          : 'border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500'
                      }`}
                    >
                      <CalendarDays className="w-4 h-4" />
                    </button>
                    <span className={`ml-2 text-xs font-medium border rounded-full px-2 py-0.5 transition-colors duration-200 ${
                      isEvent
                        ? 'text-blue-600 border-blue-200 bg-blue-50'
                        : 'text-gray-400 border-gray-200 bg-gray-50'
                    }`}>
                      Chế độ sự kiện
                    </span>
                  </>
                )}
              </div>
            </DialogHeader>
          </div>

          {conflictWarning && !isEditMode && (
            <div className="px-6 shrink-0">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{conflictWarning}</AlertDescription>
              </Alert>
            </div>
          )}

          {/* Scrollable form area */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 1.5rem' }}>
            <form id="task-form" onSubmit={handleSubmit} className="space-y-4 pb-4">
            {/* ── Title ── */}
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề *</Label>
              <Input
                id="title"
                placeholder={isEvent ? 'Nhập tiêu đề sự kiện' : 'Nhập tiêu đề công việc'}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* ── Description ── */}
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                placeholder={isEvent ? 'Nhập mô tả sự kiện' : 'Nhập mô tả công việc'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* ── Date range ── */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Ngày bắt đầu *</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  readOnly={isEditMode}
                  className={isEditMode ? 'cursor-not-allowed bg-muted' : ''}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Hạn chót *</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* ── Priority + Status ── */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Mức ưu tiên</Label>
                <Select value={priority} onValueChange={(value: string) => setPriority(value as PriorityLevel)}>
                  <SelectTrigger id="priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded" />
                        <span>Cao</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="MEDIUM">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded" />
                        <span>Trung bình</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="LOW">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded" />
                        <span>Thấp</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isEditMode && (
                <div className="space-y-2">
                  <Label htmlFor="status">Trạng thái</Label>
                  <Select value={status} onValueChange={(value: string) => setStatus(value as TaskStatus)}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-gray-400 rounded-full" />
                          <span>Cần làm</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="IN_PROGRESS">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full" />
                          <span>Đang làm</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="DONE">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full" />
                          <span>Hoàn thành</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* ── Event fields — create mode (isEvent toggle ON) ── */}
            {!isEditMode && isEvent && (
              <div className="space-y-4 rounded-lg border-2 border-blue-200 bg-blue-50/40 p-4">
                <p className="text-sm font-medium text-blue-700">Chi tiết sự kiện</p>

                {/* eventDescription */}
                <div className="space-y-2">
                  <Label htmlFor="eventDescription">Mô tả sự kiện *</Label>
                  <Textarea
                    id="eventDescription"
                    placeholder="Mô tả nội dung hoặc chương trình sự kiện"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* isOnline toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOnline(!isOnline)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      isOnline ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                        isOnline ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <Label className="cursor-pointer select-none">
                    {isOnline ? 'Sự kiện trực tuyến' : 'Sự kiện ngoại tuyến'}
                  </Label>
                </div>

                {/* Conditional: link if online, location if offline */}
                {isOnline ? (
                  <div className="space-y-2">
                    <Label htmlFor="linkEvent">Đường link họp</Label>
                    <Input
                      id="linkEvent"
                      type="url"
                      placeholder="https://meet.google.com/..."
                      value={linkEvent}
                      onChange={(e) => setLinkEvent(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="location">Địa điểm</Label>
                    <Input
                      id="location"
                      placeholder="Nhập địa điểm hoặc địa chỉ"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                )}

                {/* reminderMinutesBefore */}
                <div className="space-y-2">
                  <Label htmlFor="reminderMinutesBefore">Nhắc nhở (phút trước khi bắt đầu)</Label>
                  <Input
                    id="reminderMinutesBefore"
                    type="number"
                    min={5}
                    max={1440}
                    placeholder="30"
                    value={reminderMinutesBefore}
                    onChange={(e) => setReminderMinutesBefore(Number(e.target.value))}
                  />
                  <p className="text-xs text-gray-500">Email nhắc nhở sẽ được gửi trước sự kiện bắt đầu đúng khoảng thời gian này.</p>
                </div>

                {/* invitedEmails — dynamic list */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Email được mời</Label>
                    <button
                      type="button"
                      onClick={handleAddEmailField}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Thêm email
                    </button>
                  </div>

                  <div className="space-y-2">
                    {invitedEmails.map((email, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="email"
                          placeholder={`Email ${index + 1}`}
                          value={email}
                          onChange={(e) => handleEmailChange(index, e.target.value)}
                          className="flex-1"
                        />
                        {invitedEmails.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveEmailField(index)}
                            className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer flex-shrink-0"
                            title="Remove this email"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Email đầu tiên tự động là email tài khoản của bạn.
                    {invitedEmails.length <= 1
                      ? ' Nhấn "Thêm email" để mời người khác.'
                      : ' Email nhắc nhở sự kiện được gửi tự động.'}
                  </p>
                </div>
              </div>
            )}

            {/* ── Event fields — edit mode (task is an event) ── */}
            {isEditMode && isEvent && (
              <div className="space-y-4 rounded-lg border-2 border-blue-200 bg-blue-50/40 p-4">
                <p className="text-sm font-medium text-blue-700">Chi tiết sự kiện</p>
                <p className="text-xs text-gray-500 -mt-2">Để trống nếu muốn giữ nguyên giá trị hiện tại.</p>

                {/* eventDescription */}
                <div className="space-y-2">
                  <Label htmlFor="editEventDesc">Mô tả sự kiện</Label>
                  <Textarea
                    id="editEventDesc"
                    placeholder="Cập nhật mô tả sự kiện…"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                {/* isOnline toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOnline(!isOnline)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      isOnline ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isOnline ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <Label className="cursor-pointer select-none">
                    {isOnline ? 'Sự kiện trực tuyến' : 'Sự kiện ngoại tuyến'}
                  </Label>
                </div>

                {isOnline ? (
                  <div className="space-y-2">
                    <Label htmlFor="editLinkEvent">Đường link họp</Label>
                    <Input
                      id="editLinkEvent"
                      type="url"
                      placeholder="https://meet.google.com/…"
                      value={linkEvent}
                      onChange={(e) => setLinkEvent(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="editLocation">Địa điểm</Label>
                    <Input
                      id="editLocation"
                      placeholder="Nhập địa điểm hoặc địa chỉ"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                )}

                {/* reminderMinutesBefore */}
                <div className="space-y-2">
                  <Label htmlFor="editReminder">Nhắc nhở (phút trước khi bắt đầu)</Label>
                  <Input
                    id="editReminder"
                    type="number"
                    min={5}
                    max={1440}
                    value={reminderMinutesBefore}
                    onChange={(e) => setReminderMinutesBefore(Number(e.target.value))}
                  />
                </div>

                {/* invitedEmails */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Email được mời</Label>
                    <button
                      type="button"
                      onClick={handleAddEmailField}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Thêm email
                    </button>
                  </div>
                  <div className="space-y-2">
                    {invitedEmails.map((email, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          type="email"
                          placeholder={`Email ${index + 1}`}
                          value={email}
                          onChange={(e) => handleEmailChange(index, e.target.value)}
                          className="flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveEmailField(index)}
                          className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {invitedEmails.length === 0 && (
                      <p className="text-xs text-gray-400 italic">Chưa thêm email — lời mời hiện có sẽ được giữ.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* ── Footer — always visible at bottom ── */}
        <div className="px-6 pt-3 pb-6 border-t shrink-0">
          {isEditMode && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || isSaving}
              className="mr-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </Button>
          )}
          <div className="flex justify-end gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSaving || isDeleting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              form="task-form"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSaving || isDeleting}
            >
              {isSaving ? 'Đang lưu...' : isEditMode ? 'Cập nhật công việc' : isEvent ? 'Tạo sự kiện' : 'Tạo công việc'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
