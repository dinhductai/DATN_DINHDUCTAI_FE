// Task service for handling task operations
import { API_ENDPOINTS } from '@/lib/api';
import { TaskCreationRequest, TaskResponse } from '@/types/task';

const getHeaders = () => {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

// Task CRUD operations
export const createTask = async (task: TaskCreationRequest): Promise<TaskResponse> => {
  const response = await fetch(API_ENDPOINTS.TASKS, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(task)
  });

  if (!response.ok) {
    throw new Error('Failed to create task');
  }

  return response.json();
};

export const updateTask = async (taskId: number, task: {
  title: string;
  description: string;
  deadline: string;
  priority: string;
  status: string;
}): Promise<TaskResponse> => {
  const response = await fetch(`${API_ENDPOINTS.TASKS}/${taskId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(task)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update task: ${response.status} ${errorText}`);
  }

  return response.json();
};

export const deleteTask = async (taskId: number): Promise<void> => {
  const response = await fetch(`${API_ENDPOINTS.TASKS}/${taskId}`, {
    method: 'DELETE',
    headers: getHeaders()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to delete task: ${response.status} ${errorText}`);
  }
};

export const getTasks = async (): Promise<TaskResponse[]> => {
  const response = await fetch(API_ENDPOINTS.TASKS, {
    headers: getHeaders()
  });

  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }

  return response.json();
};

export const searchTasksByTitle = async (title: string): Promise<TaskResponse[]> => {
  const response = await fetch(`${API_ENDPOINTS.TASKS_SEARCH}?title=${encodeURIComponent(title)}`, {
    headers: getHeaders()
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to search tasks: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

// Statistics types
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

export interface TaskStatistics {
  completionBeforeDeadlineRate: number;
  freeHoursThisWeek: number;
}

export const taskService = {
  // Statistics
  getCompletionBeforeDeadlineRate: async (): Promise<number> => {
    const response = await fetch(API_ENDPOINTS.STATS_COMPLETION_RATE, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch completion rate');
    return response.json();
  },

  getFreeHoursThisWeek: async (): Promise<number> => {
    const response = await fetch(API_ENDPOINTS.STATS_FREE_HOURS, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch free hours');
    return response.json();
  },

  getAllStatistics: async (): Promise<TaskStatistics> => {
    const [completionRate, freeHours] = await Promise.all([
      taskService.getCompletionBeforeDeadlineRate(),
      taskService.getFreeHoursThisWeek()
    ]);
    return { completionBeforeDeadlineRate: completionRate, freeHoursThisWeek: freeHours };
  },

  // Weekly statistics
  getWeeklyTaskStatus: async (): Promise<StatusTaskWeekResponse> => {
    const response = await fetch(API_ENDPOINTS.STATS_WEEKLY_STATUS, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch weekly status');
    return response.json();
  },

  getWeeklyTaskDistribution: async (): Promise<DailyTaskCountResponse[]> => {
    const response = await fetch(API_ENDPOINTS.STATS_WEEKLY_DISTRIBUTION, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch weekly distribution');
    return response.json();
  },

  getTaskCreationTimeline: async (): Promise<TaskTimelineResponse[]> => {
    const response = await fetch(API_ENDPOINTS.STATS_TASK_TIMELINE, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch task creation timeline');
    return response.json();
  },

  // Today's tasks
  getTodayTasks: async (): Promise<TaskResponse[]> => {
    const response = await fetch(API_ENDPOINTS.TASKS_TODAY, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch today tasks');
    return response.json();
  },

  getCompletedTodayTasks: async (): Promise<TaskResponse[]> => {
    const response = await fetch(API_ENDPOINTS.TASKS_COMPLETED_TODAY, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch completed today tasks');
    return response.json();
  },

  getOverdueTodayTasks: async (): Promise<TaskResponse[]> => {
    const response = await fetch(API_ENDPOINTS.TASKS_OVERDUE_TODAY, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch overdue today tasks');
    return response.json();
  },

  // Admin statistics
  getActiveUsersThisWeek: async (): Promise<number> => {
    const response = await fetch(API_ENDPOINTS.ADMIN_ACTIVE_USERS, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch active users');
    return response.json();
  },

  getTasksCreatedThisWeek: async (): Promise<number> => {
    const response = await fetch(API_ENDPOINTS.ADMIN_TASKS_CREATED_WEEK, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch tasks created');
    return response.json();
  },

  getDailyCompletedTasks: async (): Promise<DailyCompletedTasksResponse[]> => {
    const response = await fetch(API_ENDPOINTS.ADMIN_DAILY_COMPLETED, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch daily completed tasks');
    return response.json();
  },

  getTasksByPriority: async (): Promise<TaskPriorityCountResponse[]> => {
    const response = await fetch(API_ENDPOINTS.ADMIN_TASKS_BY_PRIORITY, {
      method: 'GET',
      headers: getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch tasks by priority');
    return response.json();
  }
};
