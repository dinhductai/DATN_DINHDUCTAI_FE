export interface NotificationItem {
  id: number
  userId: number
  taskId: number
  title: string
  content: string
  isRead: boolean
  createdAt: string
}

export interface NotificationsResponse {
  notifications: NotificationItem[]
  unreadCount: number
}
