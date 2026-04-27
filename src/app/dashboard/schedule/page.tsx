'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScheduleView } from '@/components/ScheduleView';
import { RightPanel } from '@/components/RightPanel';
import { AIChatPanel } from '@/components/AIChatPanel';
import { TaskFormDialog, Task } from '@/components/TaskFormDialog';
import { createTask, getTasks } from '@/services/taskService';
import { pushNotificationService } from '@/services/pushNotificationService';
import { useTaskForm } from '@/contexts/TaskFormContext';
import type { TaskResponse } from '@/types/task';

export default function SchedulePage() {
  const { state, close, edit } = useTaskForm();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);

  // Initialize with current date and 7 day range (3 before, current, 3 after)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const initialStart = new Date(today);
  initialStart.setDate(initialStart.getDate() - 3);
  const initialEnd = new Date(today);
  initialEnd.setDate(initialEnd.getDate() + 3);

  const [selectedDateRange, setSelectedDateRange] = useState({
    start: initialStart,
    end: initialEnd,
  });

  useEffect(() => {
    loadTasks();
    initializePushNotifications();
  }, []);

  const initializePushNotifications = async () => {
    try {
      const isSubscribed = await pushNotificationService.isSubscribed();
      if (!isSubscribed && Notification.permission === 'default') {
        console.log('Push notifications available but not enabled');
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await getTasks();
      const uiTasks = response.map((task: TaskResponse) => {
        const startDate = new Date(task.startTime || task.createdAt);
        const deadline = new Date(task.deadline);

        const formatDate = (date: Date) => {
          return date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0') + 'T' +
            String(date.getHours()).padStart(2, '0') + ':' +
            String(date.getMinutes()).padStart(2, '0');
        };

        return {
          id: task.taskId.toString(),
          title: task.title,
          description: task.description,
          startDate: formatDate(startDate),
          deadline: formatDate(deadline),
          priority: task.priority,
          status: task.status
        };
      });
      setTasks(uiTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  };

  const checkTaskOverlap = useCallback((newTask: Omit<Task, "id"> | Task, excludeTaskId?: string) => {
    const newStart = new Date(newTask.startDate).getTime();
    const newEnd = new Date(newTask.deadline).getTime();

    return tasks.filter((task) => {
      if (excludeTaskId && task.id === excludeTaskId) return false;
      const existingStart = new Date(task.startDate).getTime();
      const existingEnd = new Date(task.deadline).getTime();
      return newStart < existingEnd && newEnd > existingStart;
    });
  }, [tasks]);

  const handleSaveTask = async (taskData: Omit<Task, "id"> | Task) => {
    const isUpdate = "id" in taskData;

    if (isUpdate) {
      const overlapping = checkTaskOverlap(taskData, taskData.id);
      if (overlapping.length > 0) {
        setConflictWarning(`Warning: This task overlaps with "${overlapping[0].title}" and ${overlapping.length - 1} other task(s).`);
        return;
      }
    } else {
      const overlapping = checkTaskOverlap(taskData);
      if (overlapping.length > 0) {
        setConflictWarning(`Warning: This task overlaps with "${overlapping[0].title}" and ${overlapping.length > 1 ? overlapping.length - 1 + " other" : ""} task(s).`);
        return;
      }
    }

    try {
      if (isUpdate) {
        setTasks(prev => prev.map(t => t.id === taskData.id ? taskData as Task : t));
        setConflictWarning("");
        close();
      } else {
        const startDate = new Date(taskData.startDate);
        const deadline = new Date(taskData.deadline);

        await createTask({
          title: taskData.title,
          description: taskData.description,
          startTime: startDate.toISOString(),
          deadline: deadline.toISOString(),
          priority: taskData.priority
        });

        await loadTasks();
        setConflictWarning("");
        close();
      }
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleTaskClick = (task: Task) => {
    edit(task);
    setConflictWarning("");
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    close();
  };

  const handleCalendarClick = (date: Date, hour: number) => {
    const clickedDateTime = new Date(date);
    clickedDateTime.setHours(hour, 0, 0, 0);

    const year = clickedDateTime.getFullYear();
    const month = String(clickedDateTime.getMonth() + 1).padStart(2, "0");
    const day = String(clickedDateTime.getDate()).padStart(2, "0");
    const hours = String(clickedDateTime.getHours()).padStart(2, "0");
    const minutes = String(clickedDateTime.getMinutes()).padStart(2, "0");

    const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    edit(undefined); // Clear any editing task
    setConflictWarning("");
  };

  const handleDateRangeChange = (direction: "prev" | "next") => {
    const daysDiff = Math.ceil(
      (selectedDateRange.end.getTime() - selectedDateRange.start.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const newStart = new Date(selectedDateRange.start);
    const newEnd = new Date(selectedDateRange.end);

    if (direction === "next") {
      newStart.setDate(newStart.getDate() + daysDiff);
      newEnd.setDate(newEnd.getDate() + daysDiff);
    } else {
      newStart.setDate(newStart.getDate() - daysDiff);
      newEnd.setDate(newEnd.getDate() - daysDiff);
    }

    setSelectedDateRange({ start: newStart, end: newEnd });
  };

  const handleDateRangeSelect = (start: Date, end: Date) => {
    setSelectedDateRange({ start, end });
  };

  const handleTaskFormClose = () => {
    setConflictWarning("");
    close();
  };

  return (
    <>
      <div className="flex gap-6 p-6 h-full">
        <div className="flex-1 min-w-0">
          <ScheduleView
            tasks={tasks}
            selectedDateRange={selectedDateRange}
            onDateRangeChange={handleDateRangeChange}
            onCalendarClick={handleCalendarClick}
            onTaskClick={handleTaskClick}
          />
        </div>

        <AnimatePresence mode="wait">
          {!isAIChatOpen && (
            <motion.div
              key="right-panel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <RightPanel
                selectedDateRange={selectedDateRange}
                onDateRangeSelect={handleDateRangeSelect}
              />
            </motion.div>
          )}

          {isAIChatOpen && (
            <motion.div
              key="ai-chat"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              <AIChatPanel onClose={() => setIsAIChatOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <TaskFormDialog
        open={state.isOpen}
        onClose={handleTaskFormClose}
        onSaveTask={handleSaveTask}
        onDeleteTask={handleDeleteTask}
        defaultStartDate={state.defaultStartDate}
        editingTask={state.editingTask}
        conflictWarning={conflictWarning}
      />
    </>
  );
}
