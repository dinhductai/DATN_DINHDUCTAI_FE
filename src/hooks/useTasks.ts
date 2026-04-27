import { useState, useEffect } from 'react';
import { taskService } from '@/services/taskService';
import type { TaskResponse } from '@/types/task';

export interface Task {
  id: string;
  title: string;
  description: string;
  startDate: string;
  deadline: string;
  priority: string;
  status: string;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await taskService.getTasks();
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
          status: task.status,
        };
      });
      setTasks(uiTasks);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const addTask = (task: Task) => {
    setTasks(prev => [...prev, task]);
  };

  const updateTask = (task: Task) => {
    setTasks(prev => prev.map(t => t.id === task.id ? task : t));
  };

  const removeTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  return {
    tasks,
    loading,
    error,
    loadTasks,
    addTask,
    updateTask,
    removeTask,
  };
}
