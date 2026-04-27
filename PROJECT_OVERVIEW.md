# Smart Schedule Calendar — Mô tả toàn diện dự án

> Ngày tạo: 2026-03-28
> Phiên bản: Calendarv5

---

## Mục lục

1. [Tổng quan dự án](#1-tổng-quan-dự-án)
2. [Kiến trúc hệ thống](#2-kiến-trúc-hệ-thống)
3. [Công nghệ sử dụng](#3-công-nghệ-sử-dụng)
4. [Cấu trúc thư mục](#4-cấu-trúc-thư-mục)
5. [Chức năng theo vai trò người dùng](#5-chức-năng-theo-vai-trò-người-dùng)
6. [Giao diện người dùng — Chi tiết từng màn hình](#6-giao-diện-người-dùng--chi-tiết-từng-màn-hình)
7. [Mô hình dữ liệu](#7-mô-hình-dữ-liệu)
8. [API Endpoints](#8-api-endpoints)
9. [Luồng xử lý nghiệp vụ chính](#9-luồng-xử-lý-nghiệp-vụ-chính)
10. [Tính năng nổi bật](#10-tính-năng-nổi-bật)
11. [Cấu hình & Triển khai](#11-cấu-hình--triển-khai)
12. [Hạn chế & Ghi chú kỹ thuật](#12-hạn-chế--ghi-chú-kỹ-thuật)

---

## 1. Tổng quan dự án

**Smart Schedule Calendar** là ứng dụng quản lý lịch và nhiệm vụ cá nhân / nhóm, được xây dựng theo mô hình SPA (Single Page Application) với React + TypeScript ở frontend và Spring Boot Microservices ở backend.

### Mục tiêu
- Giúp người dùng lên lịch công việc theo khung giờ trực quan (timeline hàng giờ)
- Theo dõi tiến độ, thống kê năng suất cá nhân
- Giao tiếp với AI assistant để tối ưu lịch làm việc
- Nhận thông báo push trình duyệt khi nhiệm vụ sắp đến hạn
- Quản trị viên (Admin) có thể giám sát toàn hệ thống và quản lý người dùng

### Đối tượng người dùng
| Vai trò | Mô tả |
|---|---|
| **User (Người dùng thông thường)** | Quản lý lịch cá nhân, xem thống kê, chat AI |
| **Admin (Quản trị viên)** | Xem thống kê hệ thống, quản lý danh sách người dùng |

---

## 2. Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────┐
│                  FRONTEND (React + Vite)                │
│                     Port: 3000                          │
└──────────────────────┬──────────────────────────────────┘
                       │  HTTP (proxy /api → :8080)
                       ▼
┌─────────────────────────────────────────────────────────┐
│              API GATEWAY / LOAD BALANCER                │
│                     Port: 8080                          │
└──────┬────────────┬────────────┬────────────────────────┘
       │            │            │
       ▼            ▼            ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│  User    │ │  Task    │ │   AI     │
│ Service  │ │ Service  │ │ Service  │
│ :8081    │ │ :8082    │ │ :8083    │
│ MySQL DB │ │ MySQL DB │ │ MySQL DB │
└──────────┘ └──────────┘ └──────────┘
```

**Backend** sử dụng kiến trúc **microservices** với 3 service độc lập, mỗi service có database MySQL riêng biệt.

**Frontend** là một **Progressive Web App (PWA)** — có thể cài đặt trên thiết bị và nhận push notification dù không mở trình duyệt.

---

## 3. Công nghệ sử dụng

### Frontend

| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| React | 18.3.1 | UI framework |
| TypeScript | ~5.x | Type-safe JavaScript |
| Vite + SWC | 6.3.5 | Build tool, dev server |
| Tailwind CSS | latest | Utility-first styling |
| Radix UI | full suite (46 components) | Headless UI primitives |
| Lucide React | 0.487.0 | Icon library |
| Recharts | 2.15.2 | Charts (Bar, Line, Pie) |
| Motion (Framer Motion) | * | Animations |
| Sonner | 2.0.3 | Toast notifications |
| React Hook Form | 7.55.0 | Form state management |
| React Day Picker | 8.10.1 | Calendar date picker |
| next-themes | 0.4.6 | Light/Dark theme |
| Service Worker | Native | PWA + Push Notifications |
| Web Push API | Native | Browser push notifications |

### Backend (Spring Boot Microservices)

| Công nghệ | Mục đích |
|---|---|
| Spring Boot (Java) | REST API framework |
| Spring Security + JWT | Authentication & Authorization |
| Spring Data JPA | ORM layer |
| Jakarta Persistence | Entity mapping |
| Lombok | Boilerplate reduction |
| MySQL (x3) | Database per service |
| nl.martijndwars.webpush | Web Push notification library |
| @Scheduled | Cron job mỗi 30 giây kiểm tra task sắp deadline |

---

## 4. Cấu trúc thư mục

```
d:\Calendarv5\Calendar\Calendar\
├── public/
│   ├── sw.js                    ← Service Worker (PWA, push notifications)
│   ├── manifest.json            ← PWA manifest (installable app)
│   └── icon-144x144.png         ← App icon
│
├── src/
│   ├── App.tsx                  ← Root component: routing + global state
│   ├── main.tsx                 ← Entry point: SW registration, VAPID key init
│   ├── index.css
│   ├── global.d.ts              ← TypeScript global type declarations
│   │
│   ├── components/
│   │   ├── LoginPage.tsx           ← Màn hình đăng nhập
│   │   ├── RegisterPage.tsx        ← Màn hình đăng ký (stub)
│   │   ├── TeachSidebar.tsx        ← Sidebar người dùng (Schedule / Stats)
│   │   ├── AdminSidebar.tsx        ← Sidebar admin (Stats / Users)
│   │   ├── ScheduleHeader.tsx      ← Header: search, AI chat button, bell icon
│   │   ├── ScheduleView.tsx        ← Lưới lịch theo giờ (timeline view)
│   │   ├── DashboardView.tsx       ← Dashboard thống kê cá nhân
│   │   ├── RightPanel.tsx          ← Panel phải: mini-calendar, task lists
│   │   ├── AIChatPanel.tsx         ← Panel chat AI (slide-in)
│   │   ├── TaskFormDialog.tsx      ← Dialog tạo/sửa/xóa task
│   │   ├── TaskSearchPanel.tsx     ← Tìm kiếm task theo tên
│   │   ├── AdminStatsView.tsx      ← Dashboard thống kê hệ thống (Admin)
│   │   ├── AdminUsersView.tsx      ← Quản lý người dùng (Admin)
│   │   ├── UserFormDialog.tsx      ← Dialog tạo/cập nhật user
│   │   ├── ConfirmDialog.tsx       ← Dialog xác nhận xóa
│   │   ├── PushNotificationSettings.tsx ← Cài đặt push notification
│   │   └── ui/                     ← 46 Radix UI primitive components
│   │
│   ├── services/
│   │   ├── authService.ts          ← Login API
│   │   ├── taskService.ts          ← Task CRUD + 9 statistics endpoints
│   │   ├── userService.ts          ← User CRUD + search + counts
│   │   ├── chatService.ts          ← AI chat: send, history, conversation ID
│   │   └── pushNotificationService.ts ← Web Push: subscribe/unsubscribe
│   │
│   ├── types/
│   │   ├── task.ts                 ← TaskResponse, TaskCreationRequest, enums
│   │   └── chat.ts                 ← ChatAIResponse, ConversationMessage
│   │
│   └── styles/
│       └── globals.css             ← CSS design tokens (light + dark mode)
│
├── index.html                   ← PWA HTML shell
├── vite.config.ts               ← Vite config (proxy, port, aliases)
├── package.json
├── README.md
└── PUSH_NOTIFICATIONS_GUIDE.md  ← Hướng dẫn push notification chi tiết
```

---

## 5. Chức năng theo vai trò người dùng

### Người dùng thông thường (User)

| Nhóm chức năng | Chi tiết |
|---|---|
| **Xác thực** | Đăng nhập bằng email + mật khẩu; nhớ đăng nhập (remember me) |
| **Lịch công việc** | Xem lịch dạng timeline 24h, điều hướng ngày, tạo/sửa/xóa task |
| **Quản lý task** | Tạo task với tiêu đề, mô tả, thời gian bắt đầu, deadline, độ ưu tiên, trạng thái |
| **Thống kê cá nhân** | Tỷ lệ hoàn thành trước deadline, thời gian rảnh, biểu đồ workload tuần |
| **Tìm kiếm** | Tìm kiếm task theo tiêu đề (real-time, debounce 500ms) |
| **AI Assistant** | Chat với AI để lên lịch, tra cứu, phân tích công việc |
| **Push Notification** | Nhận thông báo trình duyệt khi task sắp đến hạn (trong vòng 1 giờ) |
| **Mini Calendar** | Kéo chọn khoảng ngày (3-15 ngày) để hiển thị trên lịch |
| **Task Lists** | Xem danh sách: task hôm nay / đã hoàn thành / quá hạn |

### Quản trị viên (Admin)

| Nhóm chức năng | Chi tiết |
|---|---|
| **Thống kê hệ thống** | Tổng users, users mới/active trong tuần, tasks tạo trong tuần |
| **Biểu đồ hệ thống** | Line chart tasks hoàn thành theo ngày; Bar chart tasks theo priority |
| **Quản lý người dùng** | Xem danh sách users (phân trang 10/trang), tìm kiếm, tạo, sửa, xóa |

---

## 6. Giao diện người dùng — Chi tiết từng màn hình

### 6.1 Màn hình Đăng nhập (`LoginPage.tsx`)

```
┌─────────────────────────────────────┐
│           Smart Schedule            │
├─────────────────────────────────────┤
│  Email:    [___________________]    │
│  Password: [___________________] 👁 │
│  ☐ Remember me    Forgot password?  │
│  [        Sign In         ]         │
│  Don't have account? Register →     │
└─────────────────────────────────────┘
```

**Chức năng:**
- Form email + mật khẩu
- Nút hiện/ẩn mật khẩu
- Checkbox "Remember me"
- Link "Forgot password"
- Link chuyển sang trang Register
- Gọi `POST /api/auth/login` → nhận JWT token → lưu vào `localStorage`
- Nếu email chứa chuỗi "admin" → chuyển vào giao diện Admin

---

### 6.2 Màn hình Đăng ký (`RegisterPage.tsx`)

```
┌─────────────────────────────────────┐
│          Create Account             │
├─────────────────────────────────────┤
│  Username: [___________________]    │
│  Email:    [___________________]    │
│  Password: [___________________]    │
│  Avatar:   [Upload Image      ]     │
│  [        Register            ]     │
│  Already have account? Login →      │
└─────────────────────────────────────┘
```

> **Lưu ý:** Hiện tại là stub — chỉ chấp nhận tất cả fields = "123". Chưa kết nối API đăng ký thực.

---

### 6.3 Layout chính — Người dùng

```
┌──────────────────────────────────────────────────────────────┐
│  [Logo] Smart Schedule     [🔍 Search] [🤖 AI] [🔔 Bell]    │ ← ScheduleHeader
├──────────┬───────────────────────────────────┬───────────────┤
│          │                                   │               │
│ Sidebar  │       Main Content Area           │  Right Panel  │
│          │                                   │               │
│ Schedule │  (ScheduleView hoặc Dashboard)    │  Mini Calendar│
│ Stats    │                                   │  Task Today   │
│          │                                   │  Completed    │
│          │                                   │  Overdue      │
└──────────┴───────────────────────────────────┴───────────────┘
```

**Khi bật AI Chat** → RightPanel được thay thế bằng AIChatPanel (slide từ phải)

---

### 6.4 Màn hình Lịch công việc (`ScheduleView.tsx`)

**Giao diện:**
- Lưới 24 hàng (0:00 → 23:00), mỗi hàng = 60px = 1 giờ
- Các cột = các ngày trong khoảng chọn (3-15 ngày)
- Header hiển thị tên ngày + số ngày (hôm nay được highlight)
- Nút < Previous / Next > để điều hướng khoảng ngày

**Task trên lưới:**
- Vị trí vertical (`top`) = số phút lệch trong giờ bắt đầu × 1px/phút
- Chiều cao (`height`) = tổng số giờ × 60px
- **Màu theo Priority:**
  - `HIGH` → Đỏ (red)
  - `MEDIUM` → Vàng (yellow/amber)
  - `LOW` → Xanh lá (green)
- **Icon theo Status:**
  - `TODO` → vòng tròn rỗng
  - `IN_PROGRESS` → đồng hồ
  - `DONE` → dấu tích
- Click vào ô trống → mở `TaskFormDialog` tạo mới (điền sẵn ngày/giờ đã click)
- Click vào task → mở `TaskFormDialog` chế độ chỉnh sửa

---

### 6.5 Màn hình Dashboard thống kê (`DashboardView.tsx`)

**Các thành phần:**

| Thành phần | Dữ liệu từ API | Mô tả |
|---|---|---|
| Stat Card 1 | `/statistics/completion-before-deadline` | % task hoàn thành trước deadline |
| Stat Card 2 | `/statistics/free-hours` | Số giờ rảnh trong tuần |
| Pie Chart | `/statistics/weekly-status` | Tỷ lệ TODO / IN_PROGRESS / DONE |
| Bar Chart | `/statistics/weekly-distribution` | Số task theo từng ngày trong tuần |
| Line Chart | `/statistics/creation-timeline` | Xu hướng tạo task qua các tuần |
| Recent Tasks | (hardcoded placeholder) | Danh sách task gần đây |

---

### 6.6 Right Panel (`RightPanel.tsx`)

Panel bên phải với 4 phần:

**1. Task Search**
- Input tìm kiếm, debounce 500ms
- Gọi `GET /api/tasks/search?title=...`
- Kết quả hiển thị dạng danh sách card

**2. Mini Calendar (draggable date range)**
- Hiển thị lịch tháng nhỏ
- Người dùng kéo chọn khoảng ngày → cập nhật ScheduleView
- Ràng buộc: tối thiểu 3 ngày, tối đa 15 ngày

**3. Today's Tasks**
- Gọi `GET /api/tasks/today`
- Hiển thị tasks có trong ngày hôm nay

**4. Completed Tasks**
- Gọi `GET /api/tasks/today/completed`
- Hiển thị tasks đã hoàn thành, kèm thời gian `completedAt`

**5. Overdue/Missed Tasks**
- Gọi `GET /api/tasks/today/overdue`
- Hiển thị tasks quá hạn, badge đỏ cảnh báo

---

### 6.7 AI Chat Panel (`AIChatPanel.tsx`)

```
┌─────────────────────────────────────┐
│  🤖 Schedule Assistant         [×]  │
├─────────────────────────────────────┤
│                                     │
│  [Conversation history]             │
│  USER: Lịch hôm nay thế nào?        │
│  AI: Bạn có 3 tasks hôm nay...      │
│  ...                                │
│                                     │
├─────────────────────────────────────┤
│  [View this week] [Add class]       │
│  [Show analytics]                   │
├─────────────────────────────────────┤
│  [Type a message...        ] [Send] │
└─────────────────────────────────────┘
```

**Chức năng:**
- Hiển thị lịch sử hội thoại (phân trang từ API)
- Animation loading (bounce 3 chấm) khi AI đang trả lời
- Quick action buttons: "View this week", "Add new class", "Show analytics"
- Gửi tin nhắn → gọi `POST /api/ai?message=&conversationId=`
- Mỗi cuộc hội thoại có `conversationId` để AI nhớ ngữ cảnh

---

### 6.8 Dialog Tạo/Sửa Task (`TaskFormDialog.tsx`)

```
┌─────────────────────────────────────┐
│  Create Task / Edit Task            │
├─────────────────────────────────────┤
│  Title:       [_________________]   │
│  Description: [_________________]   │
│               [_________________]   │
│  Start:       [Date] [Time    ]     │
│  Deadline:    [Date] [Time    ]     │
│  Priority:    [HIGH ▼          ]    │
│  Status:      [TODO ▼          ]    │  ← chỉ hiện khi Edit
│                                     │
│  ⚠ Overlap warning (if conflict)   │
│                                     │
│  [Delete]           [Cancel] [Save] │
└─────────────────────────────────────┘
```

**Chức năng:**
- Tạo mới: chỉ có title, description, start, deadline, priority
- Sửa: thêm field status (TODO/IN_PROGRESS/DONE) + nút Delete
- **Kiểm tra trùng lịch**: so sánh khoảng thời gian với tất cả tasks hiện có, hiển thị cảnh báo nếu có overlap
- Priority options: HIGH (đỏ), MEDIUM (vàng), LOW (xanh)
- Status options: TODO, IN_PROGRESS, DONE

---

### 6.9 Admin — Dashboard thống kê (`AdminStatsView.tsx`)

**4 Metric Cards:**

| Card | API | Mô tả |
|---|---|---|
| Total Users | `/api/users/counts` | Tổng số người dùng |
| New This Week | `/api/users/counts-register` | Người dùng đăng ký mới tuần này |
| Active This Week | `/api/tasks/active-users/weekly` | Users có hoạt động tuần này |
| Tasks This Week | `/api/tasks/weekly` | Tasks được tạo tuần này |

**2 Biểu đồ:**
- **Line Chart**: Số tasks hoàn thành từng ngày trong tuần → `GET /api/tasks/statistics/weekly-task-complete`
- **Bar Chart**: Số tasks theo mức độ ưu tiên (HIGH đỏ / MEDIUM vàng / LOW xanh) → `GET /api/tasks/statistics/weekly-task-priority`

---

### 6.10 Admin — Quản lý người dùng (`AdminUsersView.tsx`)

```
┌──────────────────────────────────────────────────────────┐
│  Users Management    [🔍 Search...] [+ Create User]      │
├────┬────────┬──────────┬───────────┬──────────┬──────────┤
│ ID │ Avatar │ Name     │ Email     │ Profile  │ Actions  │
├────┼────────┼──────────┼───────────┼──────────┼──────────┤
│  1 │   J    │ John Doe │ j@d.com   │ Teacher  │ [✎] [🗑] │
│  2 │   A    │ Alice    │ a@d.com   │ Student  │ [✎] [🗑] │
├────┴────────┴──────────┴───────────┴──────────┴──────────┤
│                        [< Prev]  Page 1/5  [Next >]      │
└──────────────────────────────────────────────────────────┘
```

**Chức năng:**
- Phân trang: 10 users/trang, nút Prev/Next
- Tìm kiếm real-time (debounce 500ms) theo tên hoặc email
- Avatar: hiển thị chữ cái đầu của tên
- Nút **Update (✎)**: mở `UserFormDialog` để sửa thông tin
- Nút **Delete (🗑)**: mở `ConfirmDialog` xác nhận rồi gọi API xóa
- Nút **Create User**: mở `UserFormDialog` chế độ tạo mới

---

### 6.11 Push Notification Settings (`PushNotificationSettings.tsx`)

- Toggle switch bật/tắt push notification
- Hiển thị trạng thái quyền trình duyệt (Granted / Denied / Default)
- Nút "Test Notification" để gửi thông báo thử

---

## 7. Mô hình dữ liệu

### Task

```typescript
interface Task {
  id: string
  title: string
  description: string
  startDate: string      // ISO datetime (dùng trong frontend state)
  deadline: string       // ISO datetime
  priority: PriorityLevel  // "HIGH" | "MEDIUM" | "LOW"
  status: TaskStatus       // "TODO" | "IN_PROGRESS" | "DONE"
}
```

### TaskResponse (DTO từ backend)

```typescript
interface TaskResponse {
  taskId: number
  title: string
  description: string
  startTime: string       // ISO datetime
  deadline: string
  status: TaskStatus
  priority: PriorityLevel
  createdAt: string
  completedAt: string | null
  userId: number
}
```

### TaskCreationRequest

```typescript
interface TaskCreationRequest {
  title: string
  description: string
  startTime: string
  deadline: string
  priority: PriorityLevel
}
```

### User

```typescript
interface User {
  userId: number
  userName: string
  email: string
  password?: string
  profile: string         // e.g., "Teacher", "Student"
  roles?: string[]
}
```

### Chat

```typescript
interface ChatAIResponse {
  conversationId: string
  chatAIResponses: string
}

interface ConversationMessage {
  chatId: string | number
  conversationId: string
  role: 'USER' | 'ASSISTANT'
  content: string
  createAt: string
  userId: number
}

interface ConversationPage {
  content: ConversationMessage[]
  pageable: object
  totalElements: number
  totalPages: number
  last: boolean
  first: boolean
}
```

### Push Notification

```typescript
interface PushSubscriptionData {
  endpoint: string
  p256dh: string     // Public key
  auth: string       // Auth secret
}
```

### Thống kê (Statistics)

```typescript
interface StatusTaskWeekResponse {
  completedRate: number
  inProgressRate: number
  todoRate: number
}

interface DailyTaskCountResponse {
  dayName: string      // "Monday", "Tuesday", ...
  taskCount: number
}

interface TaskTimelineResponse {
  weekLabel: string
  taskCount: number
}

interface DailyCompletedTasksResponse {
  dayName: string
  completedCount: number
}

interface TaskPriorityCountResponse {
  priorityLevel: PriorityLevel
  taskCount: number
}
```

---

## 8. API Endpoints

Tất cả requests đều có header: `Authorization: Bearer {JWT_TOKEN}`

### Authentication

| Method | Endpoint | Params | Mô tả |
|---|---|---|---|
| POST | `/api/auth/login` | `{ email, password }` | Đăng nhập, trả về `{ token, authenticated }` |

### Task Service

| Method | Endpoint | Params | Mô tả |
|---|---|---|---|
| POST | `/api/tasks` | Body: TaskCreationRequest | Tạo task mới |
| GET | `/api/tasks` | — | Lấy tất cả tasks của user |
| PUT | `/api/tasks/{taskId}` | Body: task fields | Cập nhật task |
| DELETE | `/api/tasks/{taskId}` | — | Xóa task |
| GET | `/api/tasks/search` | `?title=` | Tìm task theo tiêu đề |
| GET | `/api/tasks/today` | — | Tasks ngày hôm nay |
| GET | `/api/tasks/today/completed` | — | Tasks đã hoàn thành hôm nay |
| GET | `/api/tasks/today/overdue` | — | Tasks quá hạn hôm nay |
| GET | `/api/tasks/statistics/completion-before-deadline` | — | % hoàn thành trước deadline |
| GET | `/api/tasks/statistics/free-hours` | — | Số giờ rảnh trong tuần |
| GET | `/api/tasks/statistics/weekly-status` | — | Tỷ lệ TODO/IN_PROGRESS/DONE |
| GET | `/api/tasks/statistics/weekly-distribution` | — | Tasks per day of week |
| GET | `/api/tasks/statistics/creation-timeline` | — | Xu hướng tạo task theo tuần |
| GET | `/api/tasks/statistics/weekly-task-complete` | — | Tasks hoàn thành từng ngày |
| GET | `/api/tasks/statistics/weekly-task-priority` | — | Tasks theo priority |
| GET | `/api/tasks/active-users/weekly` | — | Active users trong tuần |
| GET | `/api/tasks/weekly` | — | Tasks tạo trong tuần |

### User Service

| Method | Endpoint | Params | Mô tả |
|---|---|---|---|
| POST | `/api/users/create` | Body: User | Tạo user mới |
| GET | `/api/users` | — | Lấy tất cả users |
| GET | `/api/users/search` | `?keyword=` | Tìm user theo tên/email |
| PUT | `/api/users/{userId}` | Body: User | Cập nhật user |
| DELETE | `/api/users/{userId}` | — | Xóa user |
| GET | `/api/users/counts` | — | Tổng số users |
| GET | `/api/users/counts-register` | — | Users đăng ký mới trong tuần |

### AI Chat Service

| Method | Endpoint | Params | Mô tả |
|---|---|---|---|
| POST | `/api/ai` | `?message=&conversationId=` | Gửi tin nhắn, nhận phản hồi AI |
| GET | `/api/ai` | `?page=&size=` | Lịch sử hội thoại (phân trang) |
| GET | `/api/ai/id` | — | Lấy conversationId hiện tại |

### Push Notification

| Method | Endpoint | Body | Mô tả |
|---|---|---|---|
| POST | `/api/notifications/subscribe` | `{ endpoint, p256dh, auth }` | Đăng ký nhận push |
| DELETE | `/api/notifications/unsubscribe` | — | Hủy đăng ký |

---

## 9. Luồng xử lý nghiệp vụ chính

### 9.1 Đăng nhập

```
User nhập email + password
        ↓
POST /api/auth/login
        ↓
Backend trả về { token, authenticated }
        ↓
Frontend lưu token vào localStorage
        ↓
email chứa "admin"? → Admin layout : User layout
        ↓
Load tất cả tasks (GET /api/tasks)
```

### 9.2 Tạo Task

```
Click vào ô trống trên lịch
        ↓
TaskFormDialog mở ra (điền sẵn ngày/giờ)
        ↓
User nhập thông tin + bấm Save
        ↓
checkTaskOverlap() → có trùng? → hiện warning, chặn lưu
        ↓
Không trùng → POST /api/tasks
        ↓
Reload GET /api/tasks → cập nhật lưới lịch
```

### 9.3 Push Notification

```
User bật push notification
        ↓
requestPermission() → Browser hiện dialog xin quyền
        ↓
Được chấp nhận → SW registration → pushManager.subscribe(VAPID key)
        ↓
POST /api/notifications/subscribe { endpoint, p256dh, auth }
        ↓
Backend @Scheduled (mỗi 30s): query tasks deadline < now + 1h
        ↓
nl.martijndwars.webpush gửi push đến endpoint
        ↓
Service Worker nhận 'push' event → showNotification()
        ↓
User click notification → focus app window hoặc mở mới
```

### 9.4 AI Chat

```
User gửi tin nhắn
        ↓
POST /api/ai?message=...&conversationId=...
        ↓
AI Service (Spring Boot) xử lý, có context từ conversationId
        ↓
Trả về { conversationId, chatAIResponses }
        ↓
Frontend hiển thị response trong chat bubble
```

### 9.5 Admin quản lý User

```
Admin mở AdminUsersView
        ↓
GET /api/users (all users)
        ↓
Hiển thị bảng phân trang
        ↓
Search → GET /api/users/search?keyword=...
Create → UserFormDialog → POST /api/users/create
Update → UserFormDialog → PUT /api/users/{id}
Delete → ConfirmDialog → DELETE /api/users/{id}
```

---

## 10. Tính năng nổi bật

### Progressive Web App (PWA)
- Có thể **cài đặt** trên desktop/mobile như native app
- Hoạt động **offline** (Service Worker cache)
- Manifest với theme màu xanh `#3b82f6`
- App name: "Smart Schedule"

### Push Notifications (Web Push)
- Thông báo nền kể cả khi đóng tab trình duyệt
- Sử dụng chuẩn **VAPID** để xác thực giữa server và browser
- Backend tự động kiểm tra mỗi 30 giây và gửi thông báo cho tasks sắp đến hạn (trong 1 giờ tới)

### AI Assistant tích hợp
- Chat tự nhiên với AI về lịch làm việc
- AI có **bộ nhớ hội thoại** (conversation memory qua conversationId)
- Quick actions (shortcuts) cho các thao tác phổ biến

### Timeline Calendar với pixel accuracy
- Task được render đúng vị trí trên lưới dựa vào phút thực tế (không làm tròn)
- Hỗ trợ task kéo dài qua nhiều giờ
- Multi-day task handling

### Kiểm tra trùng lịch
- Tự động phát hiện overlap khi tạo/sửa task
- Cảnh báo trực quan trong dialog, blocking save

### Design System đầy đủ
- 46 UI primitive components dựa trên Radix UI
- CSS design token system với dark/light mode
- Tailwind CSS utility classes

---

## 11. Cấu hình & Triển khai

### Development Setup

```bash
# Install dependencies
npm install

# Start dev server (port 3000)
npm run dev

# Build production
npm run build
```

### Vite Config Key Settings (`vite.config.ts`)

```typescript
{
  server: {
    port: 3000,
    open: true,           // Tự mở trình duyệt
    proxy: {
      '/api': {
        target: 'http://localhost:8080',   // API Gateway
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: './build'     // Output vào /build thay vì /dist
  },
  resolve: {
    alias: { '@': './src' }
  }
}
```

### VAPID Key

VAPID Public Key (hardcoded trong `main.tsx`):
```
BFG7k2HpM5dHTwC2Noi-EMKSR1MUpUdQa2SrqufF1CFVoP6NlGw-V3Zgf6A90yCYBsHwSFMukGuO9tVHZWSWWhI
```

### Backend Services URLs (sau proxy)

| Service | Proxy URL |
|---|---|
| Auth | `/api/auth` → `localhost:8080/api/auth` |
| Task Service | `/api/tasks` → `localhost:8080/api/tasks` |
| User Service | `/api/users` → `localhost:8080/api/users` |
| AI Service | `/api/ai` → `localhost:8080/api/ai` |
| Notifications | `/api/notifications` → `localhost:8080/api/notifications` |

### PWA Manifest

```json
{
  "name": "Smart Schedule",
  "short_name": "SmartSchedule",
  "display": "standalone",
  "theme_color": "#3b82f6",
  "background_color": "#ffffff",
  "categories": ["productivity", "utilities"]
}
```

---

## 12. Hạn chế & Ghi chú kỹ thuật

| Vấn đề | Chi tiết |
|---|---|
| **Admin detection không an toàn** | `isAdmin` được xác định bằng `email.includes('admin')` thay vì từ JWT claims/role |
| **RegisterPage là stub** | Chỉ accept tất cả fields = "123", không kết nối API |
| **Không có routing library** | Navigation qua React state flags (`isAuthenticated`, `activeView`...) — không có URL routing |
| **Không có refresh token** | JWT lưu trong localStorage, không có cơ chế tự renew |
| **Dependency dư thừa** | `next` package có trong `package.json` nhưng không được dùng |
| **Không có test** | Không có test runner, unit test hay integration test |
| **Components legacy** | `Sidebar.tsx`, `Header.tsx`, `StatsCards.tsx`, `SalesChart.tsx`, `BookingsTable.tsx`, `ActivityPanel.tsx` không được sử dụng trong routing hiện tại |
| **Recent Tasks hardcoded** | Phần "Recent Tasks" trong DashboardView dùng dữ liệu placeholder, không từ API |

---

## Tóm tắt nhanh

| Hạng mục | Thông tin |
|---|---|
| **Tên app** | Smart Schedule Calendar |
| **Loại app** | SPA + PWA (Progressive Web App) |
| **Frontend** | React 18 + TypeScript + Vite + Tailwind CSS |
| **Backend** | Spring Boot Microservices (3 services) |
| **Database** | MySQL (3 databases riêng biệt) |
| **Authentication** | JWT (lưu localStorage) |
| **Vai trò người dùng** | User / Admin |
| **Màn hình chính** | Login, Register, Schedule (lịch), Dashboard (stats), Admin Stats, Admin Users |
| **Tính năng đặc biệt** | AI Chat, Push Notification, PWA installable |
| **Dev Port** | 3000 (frontend), 8080 (API gateway) |
