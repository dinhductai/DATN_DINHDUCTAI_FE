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

  /**
   * Mở WebSocket connection đến backend thông qua STOMP.
   * @param onMessage - callback được gọi mỗi khi có notification realtime đến từ backend.
   *
   * Luồng thực hiện:
   *  1. Lấy JWT token từ localStorage.
   *  2. Khởi tạo STOMP Client với brokerURL, connectHeaders (chứa JWT), và các callback.
   *  3. Khi kết nối thành công (onConnect), tự động subscribe vào /user/queue/notifications
   *     — đây là channel riêng của user trên STOMP broker, đảm bảo mỗi user chỉ nhận notification của mình.
   *  4. Mỗi khi backend gửi message đến channel này, callback onMessage được gọi
   *     → Frontend nhận notification ngay lập tức mà không cần polling API.
   */
  connect(onMessage: (item: NotificationItem) => void): void {
    // kiểm tra nếu đã có connection đang active thì bỏ qua để tránh tạo trùng
    if (this.stompClient?.active) return

    // Lấy JWT token từ localStorage để xác thực với backend qua STOMP CONNECT frame
    const token = localStorage.getItem('token')

    //Khởi tạo STOMP Client
    this.stompClient = new Client({
      brokerURL: getWsUrl(), // WS endpoint: /ws (dev qua Vite proxy, prod từ env VITE_WS_URL)
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {}, // JWT gửi kèm
      reconnectDelay: 5000, // Tự động reconnect sau 5s nếu mất kết nối

      // callback khi WebSocket handshake thành công tới subscribe channel
      onConnect: () => {
        console.log('[WS] Connected:', getWsUrl())
        // Subscribe vào channel riêng của user: /user/queue/notifications
        // STOMP broker sẽ định tuyến message đến đúng user dựa trên userId đã xác thực
        this.stompClient!.subscribe('/user/queue/notifications', (frame) => {
          try {
            // Parse JSON từ message body thành NotificationItem
            const notification: NotificationItem = JSON.parse(frame.body)
            // Gọi callback tới Frontend update UI ngay (badge, dropdown...)
            onMessage(notification)
          } catch {
            // Bỏ qua nếu message không parse được
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

    //kích hoạt WebSocket connection — bắt đầu handshake với backend
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
