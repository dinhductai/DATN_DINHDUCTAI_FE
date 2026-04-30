import { TaskCreationRequest, TaskResponse, TaskUpdateRequest } from '../types/task';

const API_URL = '/api/tasks';

export const createTask = async (task: TaskCreationRequest): Promise<TaskResponse> => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(task)
  });

  if (!response.ok) {
    throw new Error('Failed to create task');
  }

  return response.json();
};

// Update full task (PUT /api/tasks/{taskId})
export const updateTask = async (taskId: number, task: TaskUpdateRequest): Promise<TaskResponse> => {
  const token = localStorage.getItem('token');
  console.log('[API] Updating task', taskId, 'token:', token ? 'present' : 'missing');
  
  const response = await fetch(`${API_URL}/${taskId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(task)
  });

  console.log('[API] Update task response status:', response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[API] Update task error:', response.status, errorText);
    throw new Error(`Failed to update task: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  console.log('[API] Update task data:', data);
  return data;
};

export const deleteTask = async (taskId: number, eventId?: number): Promise<void> => {
  const token = localStorage.getItem('token');
  console.log('[API] Deleting task', taskId, 'eventId:', eventId ?? 'none', '→', url)
  const url = eventId != null ? `${API_URL}/${taskId}?eventId=${eventId}` : `${API_URL}/${taskId}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  console.log('[API] Delete task response status:', response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[API] Delete task error:', response.status, errorText);
    throw new Error(`Failed to delete task: ${response.status} ${errorText}`);
  }

  console.log('[API] Task deleted successfully');
};

export const getTasks = async (): Promise<TaskResponse[]> => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(API_URL, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }

  return response.json();
};

export const searchTasksByTitle = async (title: string): Promise<TaskResponse[]> => {
  const token = localStorage.getItem('token');
  console.log('[API] Searching tasks with title:', title, 'token:', token ? 'present' : 'missing');
  
  const response = await fetch(`${API_URL}/search?title=${encodeURIComponent(title)}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  console.log('[API] Search tasks response status:', response.status, response.statusText);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[API] Search tasks error:', response.status, errorText);
    throw new Error(`Failed to search tasks: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  console.log('[API] Search tasks data:', data);
  return Array.isArray(data) ? data : [];
};

// services/taskService.ts

export interface TaskStatistics {
  completionBeforeDeadlineRate: number;
  freeHoursThisWeek: number;
}

export interface StatusTaskWeekResponse {
  completedRate: number;
  inProgressRate: number;
  todoRate: number;
}

export interface DailyTaskCountResponse {
  dayName: string;
  taskCount: number;
}

export interface TaskTimelineResponse {
  weekLabel: string;
  taskCount: number;
}

export interface DailyCompletedTasksResponse {
  dayName: string;
  completedCount: number;
}

export interface TaskPriorityCountResponse {
  priorityLevel: string;
  taskCount: number;
}

export const taskService = {
  // Lấy tỷ lệ hoàn thành trước deadline
  getCompletionBeforeDeadlineRate: async (): Promise<number> => {
    try {
      const token = localStorage.getItem('token');
      console.log('[API] Fetching completion rate, token:', token ? 'present' : 'missing');
      
      const response = await fetch('/api/tasks/statistics/completion-before-deadline', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('[API] Completion rate response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Completion rate error:', response.status, errorText);
        throw new Error(`Failed to fetch completion rate: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('[API] Completion rate data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching completion rate:', error);
      throw error;
    }
  },

  // Lấy số giờ rảnh trong tuần
  getFreeHoursThisWeek: async (): Promise<number> => {
    try {
      const token = localStorage.getItem('token');
      console.log('[API] Fetching free hours, token:', token ? 'present' : 'missing');
      
      const response = await fetch('/api/tasks/statistics/free-hours', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('[API] Free hours response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Free hours error:', response.status, errorText);
        throw new Error(`Failed to fetch free hours: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('[API] Free hours data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching free hours:', error);
      throw error;
    }
  },

  // Lấy tất cả thống kê
  getAllStatistics: async (): Promise<TaskStatistics> => {
    try {
      const [completionRate, freeHours] = await Promise.all([
        taskService.getCompletionBeforeDeadlineRate(),
        taskService.getFreeHoursThisWeek()
      ]);

      return {
        completionBeforeDeadlineRate: completionRate,
        freeHoursThisWeek: freeHours
      };
    } catch (error) {
      console.error('Error fetching all statistics:', error);
      throw error;
    }
  },

  // Lấy tỷ lệ task theo status trong tuần
  getWeeklyTaskStatus: async (): Promise<StatusTaskWeekResponse> => {
    try {
      const token = localStorage.getItem('token');
      console.log('[API] Fetching weekly status, token:', token ? 'present' : 'missing');
      
      const response = await fetch('/api/tasks/statistics/weekly-status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('[API] Weekly status response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Weekly status error:', response.status, errorText);
        throw new Error(`Failed to fetch weekly status: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('[API] Weekly status data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching weekly status:', error);
      throw error;
    }
  },

  // Lấy số lượng task theo ngày trong tuần
  getWeeklyTaskDistribution: async (): Promise<DailyTaskCountResponse[]> => {
    try {
      const token = localStorage.getItem('token');
      console.log('[API] Fetching weekly distribution, token:', token ? 'present' : 'missing');
      
      const response = await fetch('/api/tasks/statistics/weekly-distribution', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('[API] Weekly distribution response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Weekly distribution error:', response.status, errorText);
        throw new Error(`Failed to fetch weekly distribution: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('[API] Weekly distribution data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching weekly distribution:', error);
      throw error;
    }
  },

  // Lấy timeline task được tạo
  getTaskCreationTimeline: async (): Promise<TaskTimelineResponse[]> => {
    try {
      const token = localStorage.getItem('token');
      console.log('[API] Fetching task creation timeline, token:', token ? 'present' : 'missing');
      
      const response = await fetch('/api/tasks/statistics/creation-timeline', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('[API] Task creation timeline response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Task creation timeline error:', response.status, errorText);
        throw new Error(`Failed to fetch task creation timeline: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('[API] Task creation timeline data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching task creation timeline:', error);
      throw error;
    }
  },

  // Lấy tất cả task hôm nay
  getTodayTasks: async (): Promise<TaskResponse[]> => {
    try {
      const token = localStorage.getItem('token');
      console.log('[API] Fetching today tasks, token:', token ? 'present' : 'missing');
      
      const response = await fetch('/api/tasks/today', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('[API] Today tasks response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Today tasks error:', response.status, errorText);
        throw new Error(`Failed to fetch today tasks: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('[API] Today tasks data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching today tasks:', error);
      throw error;
    }
  },

  // Lấy task hoàn thành hôm nay
  getCompletedTodayTasks: async (): Promise<TaskResponse[]> => {
    try {
      const token = localStorage.getItem('token');
      console.log('[API] Fetching completed today tasks, token:', token ? 'present' : 'missing');
      
      const response = await fetch('/api/tasks/today/completed', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('[API] Completed today tasks response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Completed today tasks error:', response.status, errorText);
        throw new Error(`Failed to fetch completed today tasks: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('[API] Completed today tasks data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching completed today tasks:', error);
      throw error;
    }
  },

  // Lấy task quá hạn hôm nay
  getOverdueTodayTasks: async (): Promise<TaskResponse[]> => {
    try {
      const token = localStorage.getItem('token');
      console.log('[API] Fetching overdue today tasks, token:', token ? 'present' : 'missing');
      
      const response = await fetch('/api/tasks/today/overdue', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('[API] Overdue today tasks response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Overdue today tasks error:', response.status, errorText);
        throw new Error(`Failed to fetch overdue today tasks: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('[API] Overdue today tasks data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching overdue today tasks:', error);
      throw error;
    }
  },

  // Lấy số active users tuần này
  getActiveUsersThisWeek: async (): Promise<number> => {
    try {
      const token = localStorage.getItem('token');
      console.log('[API] Fetching active users this week, token:', token ? 'present' : 'missing');
      
      const response = await fetch('/api/tasks/active-users/weekly', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('[API] Active users this week response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Active users this week error:', response.status, errorText);
        throw new Error(`Failed to fetch active users this week: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('[API] Active users this week data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching active users this week:', error);
      throw error;
    }
  },

  // Lấy số task được tạo tuần này
  getTasksCreatedThisWeek: async (): Promise<number> => {
    try {
      const token = localStorage.getItem('token');
      console.log('[API] Fetching tasks created this week, token:', token ? 'present' : 'missing');
      
      const response = await fetch('/api/tasks/weekly', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('[API] Tasks created this week response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Tasks created this week error:', response.status, errorText);
        throw new Error(`Failed to fetch tasks created this week: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('[API] Tasks created this week data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching tasks created this week:', error);
      throw error;
    }
  },

  // Lấy số task hoàn thành theo ngày tuần này
  getDailyCompletedTasks: async (): Promise<DailyCompletedTasksResponse[]> => {
    try {
      const token = localStorage.getItem('token');
      console.log('[API] Fetching daily completed tasks, token:', token ? 'present' : 'missing');
      
      const response = await fetch('/api/tasks/statistics/weekly-task-complete', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('[API] Daily completed tasks response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Daily completed tasks error:', response.status, errorText);
        throw new Error(`Failed to fetch daily completed tasks: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('[API] Daily completed tasks data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching daily completed tasks:', error);
      throw error;
    }
  },

  // Lấy số task theo priority
  getTasksByPriority: async (): Promise<TaskPriorityCountResponse[]> => {
    try {
      const token = localStorage.getItem('token');
      console.log('[API] Fetching tasks by priority, token:', token ? 'present' : 'missing');
      
      const response = await fetch('/api/tasks/statistics/weekly-task-priority', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('[API] Tasks by priority response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[API] Tasks by priority error:', response.status, errorText);
        throw new Error(`Failed to fetch tasks by priority: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('[API] Tasks by priority data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching tasks by priority:', error);
      throw error;
    }
  }
};