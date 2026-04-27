// API Configuration
// Using relative paths - Next.js rewrites will proxy to backend
// Backend expected at http://localhost:8080/api

// API endpoints (relative to the proxy)
export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_REFRESH: '/api/auth/refresh',
  AUTH_ME: '/api/auth/me',
  
  // Tasks
  TASKS: '/api/tasks',
  TASKS_SEARCH: '/api/tasks/search',
  TASKS_TODAY: '/api/tasks/today',
  TASKS_COMPLETED_TODAY: '/api/tasks/completed-today',
  TASKS_OVERDUE_TODAY: '/api/tasks/overdue-today',
  
  // Statistics
  STATS_COMPLETION_RATE: '/api/statistics/completion-before-deadline-rate',
  STATS_FREE_HOURS: '/api/statistics/free-hours-this-week',
  STATS_WEEKLY_STATUS: '/api/statistics/weekly-task-status',
  STATS_WEEKLY_DISTRIBUTION: '/api/statistics/weekly-task-distribution',
  STATS_TASK_TIMELINE: '/api/statistics/task-creation-timeline',
  
  // Admin
  ADMIN_USERS: '/api/admin/users',
  ADMIN_USERS_SEARCH: '/api/admin/users/search',
  ADMIN_USERS_TOTAL: '/api/admin/users/counts',
  ADMIN_USERS_NEW_WEEK: '/api/admin/users/counts-register',
  ADMIN_ACTIVE_USERS: '/api/statistics/active-users-this-week',
  ADMIN_TASKS_CREATED_WEEK: '/api/statistics/tasks-created-this-week',
  ADMIN_DAILY_COMPLETED: '/api/statistics/daily-completed-tasks',
  ADMIN_TASKS_BY_PRIORITY: '/api/statistics/tasks-by-priority',
  
  // Chat
  CHAT_CONVERSATIONS: '/api/conversations',
  CHAT_MESSAGES: '/api/messages',
  CHAT_AI: '/api/ai',
  
  // Push Notifications
  PUSH_SUBSCRIBE: '/api/push/subscribe',
  PUSH_UNSUBSCRIBE: '/api/push/unsubscribe',
} as const;
