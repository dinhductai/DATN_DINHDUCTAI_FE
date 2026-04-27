import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { updateTask, deleteTask } from '@/services/taskService'
import { toast } from 'sonner'

import { PriorityLevel, TaskStatus, TaskCreationRequest, TaskResponse } from '@/types/task'

// Mapping between backend and frontend task interfaces
export interface Task {
  id: string
  title: string
  description: string
  startDate: string // ISO string
  deadline: string // ISO string
  priority: PriorityLevel
  status: TaskStatus
}

// Convert TaskResponse to frontend Task
export const mapTaskResponseToTask = (response: TaskResponse): Task => ({
  id: response.taskId.toString(),
  title: response.title,
  description: response.description,
  startDate: response.createdAt,
  deadline: response.deadline,
  priority: response.priority,
  status: response.status
})

// Convert frontend Task to TaskCreationRequest
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
  onDeleteTask?: (taskId: string) => void  // Add delete callback
  defaultStartDate?: string
  editingTask?: Task
  conflictWarning?: string
}

export function TaskFormDialog({ open, onClose, onSaveTask, onDeleteTask, defaultStartDate, editingTask, conflictWarning }: TaskFormDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [deadline, setDeadline] = useState('')
  const [priority, setPriority] = useState<PriorityLevel>(PriorityLevel.MEDIUM)
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.TODO)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const isEditMode = !!editingTask

  useEffect(() => {
    if (editingTask) {
      // Edit mode - populate with existing task data
      setTitle(editingTask.title)
      setDescription(editingTask.description)
      
      // Convert ISO string to datetime-local format (YYYY-MM-DDTHH:MM)
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
    } else if (defaultStartDate) {
      // Create mode with default date
      setStartDate(defaultStartDate)
    }
  }, [editingTask, defaultStartDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title || !startDate || !deadline) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsSaving(true)
    try {
      if (isEditMode && editingTask) {
        // Convert deadline to ISO string with timezone
        const deadlineDate = new Date(deadline)
        const deadlineISO = deadlineDate.toISOString()
        
        // Call backend API to update full task - receives TaskResponse
        const response = await updateTask(Number(editingTask.id), {
          title,
          description,
          deadline: deadlineISO,
          priority,
          status
        })
        
        toast.success('Task updated successfully')
        
        // Convert TaskResponse to Task format for local state
        const updatedTask: Task = {
          id: response.taskId.toString(),
          title: response.title,
          description: response.description,
          startDate: response.createdAt, // createdAt is the start date
          deadline: response.deadline,
          priority: response.priority,
          status: response.status
        }
        
        // Update local state via callback with backend response
        onSaveTask(updatedTask)
      } else {
        // Create new task (handled by parent)
        onSaveTask({
          title,
          description,
          startDate,
          deadline,
          priority,
          status: TaskStatus.TODO
        })
      }

      resetForm()
      onClose()
    } catch (error: any) {
      console.error('Error saving task:', error)
      toast.error(error.message || 'Failed to save task')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!editingTask || !onDeleteTask) return
    
    if (!confirm('Are you sure you want to delete this task?')) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteTask(Number(editingTask.id))
      toast.success('Task deleted successfully')
      onDeleteTask(editingTask.id)
      resetForm()
      onClose()
    } catch (error: any) {
      console.error('Error deleting task:', error)
      toast.error(error.message || 'Failed to delete task')
    } finally {
      setIsDeleting(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setStartDate('')
    setDeadline('')
    setPriority(PriorityLevel.MEDIUM)
    setStatus(TaskStatus.TODO)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        </DialogHeader>
        
        {conflictWarning && !isEditMode && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{conflictWarning}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter task description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                readOnly={isEditMode}
                className={isEditMode ? "cursor-not-allowed bg-muted" : ""}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline *</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value: string) => setPriority(value as PriorityLevel)}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span>High</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="MEDIUM">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                      <span>Medium</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="LOW">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span>Low</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isEditMode && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value: string) => setStatus(value as TaskStatus)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODO">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                        <span>To Do</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="IN_PROGRESS">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>In Progress</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="DONE">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Done</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            {isEditMode && (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={handleDelete}
                disabled={isDeleting || isSaving}
                className="mr-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving || isDeleting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSaving || isDeleting}>
              {isSaving ? 'Saving...' : (isEditMode ? 'Update Task' : 'Create Task')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
