# Smart Schedule Calendar - AI-Powered Task Management System

## 📋 Project Description

Smart Schedule Calendar is a comprehensive task and schedule management application built with a modern tech stack. It provides users with an intelligent scheduling system, AI-powered assistance, and advanced analytics for personal and team task management. The application combines a responsive React frontend with robust Spring Boot microservices backend to deliver a seamless user experience.

### Key Highlights:
- 📅 Interactive calendar interface with drag-and-drop functionality
- 🤖 AI-powered chat assistant for intelligent task recommendations
- 👥 Multi-role admin dashboard with user management and analytics
- 📊 Real-time statistics and performance metrics
- 🔐 Secure JWT-based authentication and authorization
- 💾 Persistent data storage with microservices architecture

---

## 🛠 Technology Stack & Code Structure

### Frontend Architecture

**Framework & Build Tool:**
- **React 18** - UI library with hooks and functional components
- **TypeScript** - Type-safe development
- **Vite** - Modern build tool with hot module replacement
- **Tailwind CSS** - Utility-first CSS framework

**UI & Component Libraries:**
- **Radix UI** - Unstyled, accessible primitive components
- **Recharts** - React charting library for data visualization
- **Lucide React** - Beautiful SVG icon library
- **Sonner** - Toast notification system

**API & State Management:**
- **Fetch API** - RESTful API communication
- **React Hooks** - useState, useEffect for state management
- **Local Storage** - Client-side token persistence

### Backend Architecture

**Microservices:**
- **Spring Boot** - Java framework for REST APIs
- **Spring Security** - JWT-based authentication
- **Spring Data JPA** - ORM for database operations
- **Jakarta Persistence** - Modern JPA implementation
- **Lombok** - Boilerplate code reduction

**Core Services:**
1. **User Service** (`/api/users`) - User management, registration, authentication
2. **Task Service** (`/api/tasks`) - Task CRUD, statistics, timeline analytics
3. **AI Service** (`/api/ai`) - Chat assistant, conversation memory management

### Project Structure

```
src/
├── components/
│   ├── DashboardView.tsx          # User dashboard with stats & charts
│   ├── ScheduleView.tsx            # Calendar grid layout & task rendering
│   ├── RightPanel.tsx              # Today's tasks, completed, overdue
│   ├── AdminStatsView.tsx          # Admin analytics dashboard
│   ├── AdminUsersView.tsx          # User management table
│   ├── AIChatPanel.tsx             # AI chat interface
│   ├── TaskFormDialog.tsx          # Task creation/editing form
│   ├── UserFormDialog.tsx          # User creation/editing form
│   ├── LoginPage.tsx               # Authentication login
│   ├── RegisterPage.tsx            # User registration
│   └── ui/
│       ├── button.tsx              # Reusable button component
│       ├── card.tsx                # Card container
│       ├── dialog.tsx              # Modal dialog
│       ├── input.tsx               # Form input
│       ├── table.tsx               # Data table
│       ├── select.tsx              # Dropdown select
│       └── ... (other primitives)
├── services/
│   ├── taskService.ts              # Task API wrappers (15+ endpoints)
│   ├── userService.ts              # User API wrappers (5 endpoints)
│   ├── chatService.ts              # AI chat API wrappers (3 endpoints)
│   └── authService.ts              # Authentication logic
├── types/
│   ├── task.ts                     # Task interfaces & types
│   └── chat.ts                     # Chat interfaces & types
├── styles/
│   ├── globals.css                 # Global styles & Tailwind imports
│   └── index.css                   # Root styles
├── App.tsx                         # Main app component with routing
├── main.tsx                        # React entry point
└── vite.config.ts                  # Vite configuration
```

---

## ✨ Features & Functionality

### User Features

#### 1. **Task Management**
- ✅ Create tasks with title, description, deadline, priority (HIGH/MEDIUM/LOW)
- ✏️ Update existing tasks with all properties
- 🗑️ Delete tasks
- 📊 View task status (TODO, IN_PROGRESS, DONE)
- 🔄 Drag-and-drop tasks on calendar
- 📅 Calendar view with hourly grid layout

#### 2. **Personal Dashboard**
- 📈 **Completion Rate** - Percentage of tasks completed before deadline
- ⏰ **Free Hours** - Available time calculation for this week
- 📊 **Weekly Status** - Pie chart showing task distribution (TODO/IN_PROGRESS/DONE)
- 📈 **Weekly Workload** - Bar chart of tasks per day
- 📅 **Task Timeline** - Line chart of task creation trends

#### 3. **Schedule Management**
- 📅 Interactive calendar grid (hourly view)
- 👁️ Today's scheduled tasks with color-coding
- ✅ Completed tasks list with timestamps
- ⏰ Overdue/Missed tasks alert
- 🔍 Task overlap detection and warnings

#### 4. **AI Chat Assistant**
- 🤖 Real-time chat with AI for task recommendations
- 💬 Multi-turn conversation support with memory
- 📝 Automatic conversation history tracking
- 🔄 Continue previous conversations using conversation ID
- 📜 Paginated chat history retrieval

### Admin Features

#### 1. **User Management**
- 👥 View all registered users with pagination
- ➕ Create new users with credentials
- ✏️ Update user information (name, email, profile)
- 🗑️ Delete users with confirmation
- 🎭 User profile image support

#### 2. **Admin Analytics Dashboard**
- 📊 **4 Key Metrics:**
  - Total registered users
  - New users this week
  - Active users this week
  - Tasks created this week
- 📉 **2 Data Visualizations:**
  - Daily completed tasks line chart
  - Tasks by priority pie chart (HIGH/MEDIUM/LOW)
- 🎨 Color-coded priority levels:
  - HIGH: Red (#ef4444)
  - MEDIUM: Yellow (#eab308)
  - LOW: Green (#22c55e)

#### 3. **Activity Tracking**
- 📋 View all user activities
- 📊 Sales and performance charts
- 🔍 Detailed user statistics

---

## 🚀 Installation & Setup

### Prerequisites

Ensure you have the following installed:
- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **Java 11+** (for backend services)
- **Maven 3.8+** (for building backend)
- **Git**

### Frontend Setup

#### 1. Clone Repository
```bash
git clone <repository-url>
cd Calendar
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Configure Environment Variables
Create a `.env` file in the root directory (if needed):
```env
VITE_API_BASE_URL=http://localhost:8080
```

#### 4. Start Development Server
```bash
npm run dev
```

The application will open at `http://localhost:3000` (default Vite port)

#### 5. Build for Production
```bash
npm run build
```

Output will be in the `build/` directory.

### Backend Setup

#### 1. User Service
```bash
# Navigate to user service directory
cd user-service

# Build with Maven
mvn clean build

# Run the service
mvn spring-boot:run
```

Service runs on `http://localhost:8081` (configure in application.yml)

#### 2. Task Service
```bash
# Navigate to task service directory
cd task-service

# Build with Maven
mvn clean build

# Run the service
mvn spring-boot:run
```

Service runs on `http://localhost:8082`

#### 3. AI Service
```bash
# Navigate to AI service directory
cd ai-service

# Build with Maven
mvn clean build

# Run the service
mvn spring-boot:run
```

Service runs on `http://localhost:8083`

#### 4. API Gateway (Optional)
Configure API Gateway/Load Balancer to route requests:
```
/api/users    → User Service (8081)
/api/tasks    → Task Service (8082)
/api/ai       → AI Service (8083)
```

### Database Setup

Each microservice requires its own database:

```sql
-- User Service Database
CREATE DATABASE user_service;

-- Task Service Database
CREATE DATABASE task_service;

-- AI Service Database
CREATE DATABASE ai_service;
```

Update `application.yml` in each service:
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/service_name
    username: root
    password: your_password
  jpa:
    hibernate:
      ddl-auto: update
```

---

## 📡 API Endpoints Reference

### User Service (`/api/users`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/create` | Create new user |
| GET | `/` | Get all users |
| PUT | `/{userId}` | Update user |
| DELETE | `/{userId}` | Delete user |
| GET | `/counts` | Get total users count |
| GET | `/counts-register` | Get new users this week |

### Task Service (`/api/tasks`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create task |
| GET | `/` | Get all user tasks |
| PUT | `/{taskId}` | Update task |
| DELETE | `/{taskId}` | Delete task |
| GET | `/statistics/completion-before-deadline` | Completion rate |
| GET | `/statistics/free-hours-week` | Free hours this week |
| GET | `/statistics/weekly-status` | Weekly task status (TODO/IN_PROGRESS/DONE) |
| GET | `/statistics/weekly-distribution` | Daily task count |
| GET | `/statistics/creation-timeline` | Task creation timeline |
| GET | `/today-tasks` | Today's scheduled tasks |
| GET | `/completed-today` | Completed tasks today |
| GET | `/overdue-today` | Overdue tasks today |
| GET | `/statistics/active-users-week` | Active users this week |
| GET | `/statistics/created-week` | Tasks created this week |
| GET | `/statistics/weekly-task-complete` | Daily completed tasks |
| GET | `/statistics/weekly-task-priority` | Tasks grouped by priority |

### AI Service (`/api/ai`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Send message to AI (with optional conversationId) |
| GET | `/id` | Get current conversation ID |
| GET | `/` | Get conversation history (paginated) |

---

## 🔐 Authentication

The application uses **JWT (JSON Web Tokens)** for authentication:

1. **Login/Register** - User credentials exchanged for JWT token
2. **Token Storage** - Token saved in `localStorage`
3. **API Requests** - Token sent in `Authorization: Bearer <token>` header
4. **Token Refresh** - Handled automatically on each request

### Login Flow
```typescript
// 1. User submits credentials
POST /api/users/login
{
  "email": "user@example.com",
  "password": "password123"
}

// 2. Server returns JWT token
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}

// 3. Frontend stores token
localStorage.setItem('token', token);

// 4. Subsequent requests include token
fetch('/api/tasks', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

---

## 🎨 Styling & Design System

- **Tailwind CSS** - Utility-first CSS framework
- **Color Scheme:**
  - Primary: Blue (#2563eb)
  - Secondary: Purple (#9333ea)
  - Success: Green (#22c55e)
  - Warning: Yellow (#eab308)
  - Danger: Red (#ef4444)

- **Components** - Pre-built UI components in `src/ui/` directory
- **Responsive** - Mobile-friendly design with responsive Tailwind classes

---

## 📝 Usage Examples

### Creating a Task
```typescript
import { createTask } from './services/taskService';

const newTask = await createTask({
  title: "Complete project",
  description: "Finish the calendar app",
  startDate: "2025-10-21T09:00",
  deadline: "2025-10-25T17:00",
  priority: "HIGH",
  status: "TODO"
});
```

### Sending AI Chat Message
```typescript
import { sendMessage } from './services/chatService';

const response = await sendMessage(
  "What tasks should I prioritize today?",
  conversationId // optional - for continuing conversation
);

console.log(response.conversationId); // Save for next message
console.log(response.chatAIResponses); // AI response with proper newlines
```

### Fetching Dashboard Stats
```typescript
import { getCompletionBeforeDeadlineRate, getWeeklyTaskStatus } from './services/taskService';

const completionRate = await getCompletionBeforeDeadlineRate();
const weeklyStatus = await getWeeklyTaskStatus();

// Use in charts/UI
```

---

## 🐛 Troubleshooting

### Common Issues

**Issue:** "Failed to fetch" errors
- **Solution:** Check backend services are running on correct ports
- Verify CORS is enabled in backend
- Check network tab in browser dev tools

**Issue:** Authentication fails
- **Solution:** Verify token is stored in localStorage
- Check token expiration
- Re-login if token is invalid

**Issue:** AI chat shows escaped newlines (`\\n`)
- **Solution:** Already handled in AIChatPanel with `whitespace-pre-wrap`
- Verify chatService is replacing `\\n` with `\n`

**Issue:** Pagination not working
- **Solution:** Verify `page` and `size` parameters are passed correctly
- Check backend returns proper pagination metadata

---

## 🚦 Running the Application

### Development Mode
```bash
# Terminal 1: Frontend
cd Calendar
npm run dev

# Terminal 2-4: Backend services (each in separate terminal)
# User Service
cd user-service && mvn spring-boot:run

# Task Service
cd task-service && mvn spring-boot:run

# AI Service
cd ai-service && mvn spring-boot:run
```

### Production Build
```bash
# Build frontend
npm run build

# Deploy to server (e.g., Nginx, Vercel, AWS)
# Build backend with Maven and deploy to application server
```

---

## 📚 Additional Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [JWT Introduction](https://jwt.io/)

---

## 👥 Team & Contributing

This project is developed as a comprehensive task management solution. Contributions are welcome!

---

## 📄 License

This project is licensed under the MIT License. See LICENSE file for details.

---

## 📞 Support & Contact

For issues, questions, or suggestions, please open an issue in the repository or contact the development team.

---

**Last Updated:** October 21, 2025  
**Version:** 1.0.0  
**Status:** Active Development
