import { Client } from '@stomp/stompjs'
import { NotificationItem, NotificationsResponse } from '../types/notification'

const BASE = '/api/notifications'

const DEFAULT_PAGE_SIZE = 5

const authHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
})

function getWsUrl(): string {
  // Production: set VITE_WS_URL=wss://your-domain.com/ws in .env
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL as string
  }
  // Dev: go through Vite proxy (/ws → localhost:8080/ws)
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws`
}

class NotificationService {
  private stompClient: Client | null = null

  connect(onMessage: (item: NotificationItem) => void): void {
    if (this.stompClient?.active) return

    const token = localStorage.getItem('token')

    this.stompClient = new Client({
      brokerURL: getWsUrl(),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('[WS] Connected:', getWsUrl())
        this.stompClient!.subscribe('/user/queue/notifications', (frame) => {
          try {
            const notification: NotificationItem = JSON.parse(frame.body)
            onMessage(notification)
          } catch {
            // ignore malformed frames
          }
        })
      },
      onStompError: (frame) => {
        console.error('[WS] STOMP error', frame)
      },
      onDisconnect: () => {
        console.log('[WS] Disconnected')
      },
    })

    this.stompClient.activate()
  }

  disconnect(): void {
    this.stompClient?.deactivate()
    this.stompClient = null
  }

  async getNotifications(page = 0, size = DEFAULT_PAGE_SIZE): Promise<NotificationsResponse> {
    const res = await fetch(`${BASE}?page=${page}&size=${size}`, { headers: authHeaders() })
    if (!res.ok) throw new Error('Failed to fetch notifications')
    const data = await res.json()
    return data as NotificationsResponse
  }

  async markAsRead(notificationId: number): Promise<void> {
    await fetch(`${BASE}/${notificationId}/read`, {
      method: 'PATCH',
      headers: authHeaders(),
    })
  }

  async markAllAsRead(): Promise<void> {
    await fetch(`${BASE}/read-all`, {
      method: 'PATCH',
      headers: authHeaders(),
    })
  }
}

export const notificationService = new NotificationService()

export function getUserIdFromToken(): number | null {
  const token = localStorage.getItem('token')
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return parseInt(payload.sub, 10)
  } catch {
    return null
  }
}

export function formatNotificationTime(createdAt: string): string {
  const date = new Date(createdAt)
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Vừa xong'
  if (diffMins < 60) return `${diffMins} phút trước`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} giờ trước`
  return date.toLocaleDateString('vi-VN')
}
