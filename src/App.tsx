import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { TeachSidebar } from "./components/TeachSidebar";
import { AdminSidebar } from "./components/AdminSidebar";
import { ScheduleHeader } from "./components/ScheduleHeader";
import { ScheduleView } from "./components/ScheduleView";
import { DashboardView } from "./components/DashboardView";
import { AdminStatsView } from "./components/AdminStatsView";
import { AdminUsersView } from "./components/AdminUsersView";
import { RightPanel } from "./components/RightPanel";
import { AIChatPanel } from "./components/AIChatPanel";
import { TaskFormDialog, Task, mapTaskResponseToTask } from "./components/TaskFormDialog";
import { EventManagementView } from "./components/EventManagementView";
import { ProfilePage } from "./components/ProfilePage";
import { createTask, getTasks } from "./services/taskService";
// import { pushNotificationService } from "./services/pushNotificationService";
import { TaskResponse, TaskCreationRequest } from "./types/task";

// Profile page component that renders without sidebar
function ProfileWrapper() {
  return <ProfilePage />;
}

// Wrapper components that handle auth state and routing
function UserLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeView, setActiveView] = useState<"schedule" | "stats" | "notifications">(
    location.pathname === "/stats" ? "stats" : 
    location.pathname === "/event" ? "notifications" : "schedule"
  );
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [defaultTaskStartDate, setDefaultTaskStartDate] = useState<string | undefined>();
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [conflictWarning, setConflictWarning] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);

  // Check if we're on the profile page
  const isProfilePage = location.pathname === "/profile";

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

  // Load tasks when component mounts
  useEffect(() => {
    if (!isProfilePage) {
      loadTasks();
      // initializePushNotifications();
    }
  }, [isProfilePage]);

  // Push notifications disabled
  // const initializePushNotifications = async () => {
  //   try {
  //     const isSubscribed = await pushNotificationService.isSubscribed();
  //     if (!isSubscribed && Notification.permission === 'default') {
  //       console.log('Push notifications available but not enabled');
  //     }
  //   } catch (error) {
  //     console.error('Error initializing push notifications:', error);
  //   }
  // };

  const loadTasks = async () => {
    try {
      const response = await getTasks();
      const uiTasks = response.map((task: TaskResponse) => mapTaskResponseToTask(task));
      setTasks(uiTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      alert('Không thể tải công việc. Vui lòng thử lại.');
    }
  };

  // Check if a task overlaps with existing tasks
  const checkTaskOverlap = (
    newTask: Omit<Task, "id"> | Task,
    excludeTaskId?: string
  ) => {
    const newStart = new Date(newTask.startDate).getTime();
    const newEnd = new Date(newTask.deadline).getTime();

    const overlappingTasks = tasks.filter((task) => {
      if (excludeTaskId && task.id === excludeTaskId) return false;

      const existingStart = new Date(task.startDate).getTime();
      const existingEnd = new Date(task.deadline).getTime();

      return newStart < existingEnd && newEnd > existingStart;
    });

    return overlappingTasks;
  };

  const handleSaveTask = async (taskData: Omit<Task, "id"> | Task) => {
    const isUpdate = "id" in taskData;

    if (isUpdate) {
      const overlapping = checkTaskOverlap(taskData, taskData.id);
      if (overlapping.length > 0) {
        setConflictWarning(
          `Cảnh báo: Công việc này trùng lặp với "${overlapping[0].title}" và ${
            overlapping.length - 1
          } công việc khác. Vui lòng điều chỉnh ngày/giờ.`
        );
        return;
      }
    } else {
      const overlapping = checkTaskOverlap(taskData);
      if (overlapping.length > 0) {
        setConflictWarning(
          `Cảnh báo: Công việc này trùng lặp với "${overlapping[0].title}" và ${
            overlapping.length > 1 ? overlapping.length - 1 + " công việc khác" : ""
          } công việc khác. Vui lòng điều chỉnh ngày/giờ.`
        );
        return;
      }
    }

    try {
      if (isUpdate) {
        setTasks(tasks.map(t => t.id === taskData.id ? taskData as Task : t));
        setConflictWarning("");
      } else {
        const startDate = new Date(taskData.startDate);
        const deadline = new Date(taskData.deadline);

        const apiTask: TaskCreationRequest = {
          title: taskData.title,
          description: taskData.description,
          startTime: startDate.toISOString(),
          deadline: deadline.toISOString(),
          priority: taskData.priority
        };

        // Forward event payload if the task was created as an event
        if (taskData.isEvent && taskData.eventCreationRequest) {
          apiTask.isEvent = true;
          apiTask.eventCreationRequest = {
            ...taskData.eventCreationRequest,
            startTime: startDate.toISOString()
          };
        }

        await createTask(apiTask);
        await loadTasks();
        setConflictWarning("");
      }
    } catch (error) {
      console.error('Failed to save task:', error);
      alert('Không thể lưu công việc. Vui lòng thử lại.');
    }
  };

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setDefaultTaskStartDate(undefined);
    setConflictWarning("");
    setIsTaskFormOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate("/login");
  };

  const handleCalendarClick = (date: Date, hour: number) => {
    if (activeView !== "schedule") return;

    const clickedDateTime = new Date(date);
    clickedDateTime.setHours(hour, 0, 0, 0);

    const year = clickedDateTime.getFullYear();
    const month = String(clickedDateTime.getMonth() + 1).padStart(2, "0");
    const day = String(clickedDateTime.getDate()).padStart(2, "0");
    const hours = String(clickedDateTime.getHours()).padStart(2, "0");
    const minutes = String(clickedDateTime.getMinutes()).padStart(2, "0");

    const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

    setEditingTask(undefined);
    setDefaultTaskStartDate(formattedDateTime);
    setConflictWarning("");
    setIsTaskFormOpen(true);
  };

  const handleNewTaskClick = () => {
    setEditingTask(undefined);
    setDefaultTaskStartDate(undefined);
    setConflictWarning("");
    setIsTaskFormOpen(true);
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

  const handleNavigation = (view: "schedule" | "stats" | "notifications") => {
    setActiveView(view);
    if (view === "schedule") {
      navigate("/schedule");
    } else if (view === "stats") {
      navigate("/stats");
    } else {
      navigate("/event");
    }
  };

  // If on profile page, render only the profile page without sidebar/header
  if (isProfilePage) {
    return <ProfilePage />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <TeachSidebar
        activeView={activeView}
        onViewChange={handleNavigation}
        onNewTask={handleNewTaskClick}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <ScheduleHeader onOpenAIChat={() => setIsAIChatOpen(true)} />

        <div className="flex-1 overflow-auto">
          <div className="flex gap-6 p-6 h-full">
            <div className="flex-1 min-w-0">
              {activeView === "stats" ? (
                <DashboardView />
              ) : activeView === "notifications" ? (
                <EventManagementView />
              ) : (
                <ScheduleView
                  tasks={tasks}
                  selectedDateRange={selectedDateRange}
                  onDateRangeChange={handleDateRangeChange}
                  onCalendarClick={handleCalendarClick}
                  onTaskClick={handleTaskClick}
                />
              )}
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
        </div>
      </div>

      <TaskFormDialog
        open={isTaskFormOpen}
        onClose={() => {
          setIsTaskFormOpen(false);
          setEditingTask(undefined);
          setDefaultTaskStartDate(undefined);
          setConflictWarning("");
        }}
        onSaveTask={handleSaveTask}
        onDeleteTask={handleDeleteTask}
        defaultStartDate={defaultTaskStartDate}
        editingTask={editingTask}
        conflictWarning={conflictWarning}
      />
    </div>
  );
}

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [adminView, setAdminView] = useState<"stats" | "users">(
    location.pathname === "/admin/users" ? "users" : "stats"
  );

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate("/login");
  };

  const handleNavigation = (view: "stats" | "users") => {
    setAdminView(view);
    if (view === "stats") {
      navigate("/admin/dashboard");
    } else {
      navigate("/admin/users");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar
        activeView={adminView}
        onViewChange={handleNavigation}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-auto">
        {adminView === "stats" ? <AdminStatsView /> : <AdminUsersView />}
      </div>
    </div>
  );
}

function LoginWrapper() {
  const navigate = useNavigate();

  const handleLogin = (isAdminUser: boolean) => {
    if (isAdminUser) {
      navigate("/admin/dashboard");
    } else {
      navigate("/schedule");
    }
  };

  const handleSwitchToRegister = () => {
    navigate("/register");
  };

  return <LoginPage onLogin={handleLogin} onSwitchToRegister={handleSwitchToRegister} />;
}

function RegisterWrapper() {
  const navigate = useNavigate();

  const handleRegister = () => {
    navigate("/login");
  };

  const handleSwitchToLogin = () => {
    navigate("/login");
  };

  return <RegisterPage onRegister={handleRegister} onSwitchToLogin={handleSwitchToLogin} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginWrapper />} />
        <Route path="/register" element={<RegisterWrapper />} />
        <Route path="/schedule" element={<UserLayout />} />
        <Route path="/stats" element={<UserLayout />} />
        <Route path="/event" element={<UserLayout />} />
        <Route path="/profile" element={<ProfileWrapper />} />
        <Route path="/admin/dashboard" element={<AdminLayout />} />
        <Route path="/admin/users" element={<AdminLayout />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
