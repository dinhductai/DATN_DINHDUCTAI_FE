import { useState, useEffect } from "react";
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
import { TaskFormDialog, Task } from "./components/TaskFormDialog";
import { PushNotificationSettings } from "./components/PushNotificationSettings";
import { createTask, getTasks } from "./services/taskService";
import { pushNotificationService } from "./services/pushNotificationService";
import { TaskResponse } from "./types/task";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [activeView, setActiveView] = useState<"schedule" | "stats">(
    "schedule"
  );
  const [adminView, setAdminView] = useState<"stats" | "users">("stats");
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [defaultTaskStartDate, setDefaultTaskStartDate] = useState<
    string | undefined
  >();
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [conflictWarning, setConflictWarning] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);

  // Load tasks when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      loadTasks();
      initializePushNotifications();
    }
  }, [isAuthenticated]);

  // Initialize push notifications
  const initializePushNotifications = async () => {
    try {
      // Check if user is already subscribed
      const isSubscribed = await pushNotificationService.isSubscribed();
      
      if (!isSubscribed && Notification.permission === 'default') {
        // Show a subtle prompt to enable notifications
        console.log('Push notifications available but not enabled');
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await getTasks();
      const uiTasks = response.map((task: TaskResponse) => {
        // Backend returns time, display as-is (no timezone conversion)
        const startDate = new Date(task.startTime || task.createdAt);
        const deadline = new Date(task.deadline);

        // Format to YYYY-MM-DDTHH:mm (display as-is)
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
          status: task.status
        };
      });
      setTasks(uiTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      alert('Failed to load tasks. Please try again.');
    }
  };

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

      // Check if time ranges overlap
      return newStart < existingEnd && newEnd > existingStart;
    });

    return overlappingTasks;
  };

  const handleSaveTask = async (taskData: Omit<Task, "id"> | Task) => {
    // Check if this is an UPDATE (has id) or CREATE (no id)
    const isUpdate = "id" in taskData;

    // Check for overlapping tasks first
    if (isUpdate) {
      const overlapping = checkTaskOverlap(taskData, taskData.id);
      if (overlapping.length > 0) {
        setConflictWarning(
          `Warning: This task overlaps with "${overlapping[0].title}" and ${
            overlapping.length - 1
          } other task(s). Please adjust the date/time.`
        );
        return;
      }
    } else {
      const overlapping = checkTaskOverlap(taskData);
      if (overlapping.length > 0) {
        setConflictWarning(
          `Warning: This task overlaps with "${overlapping[0].title}" and ${
            overlapping.length > 1 ? overlapping.length - 1 + " other" : ""
          } task(s). Please adjust the date/time.`
        );
        return;
      }
    }

    try {
      if (isUpdate) {
        // UPDATE: TaskFormDialog already called updateTask API
        // Just update the local state with the backend response
        setTasks(tasks.map(t => t.id === taskData.id ? taskData as Task : t));
        setConflictWarning("");
      } else {
        // CREATE: Call API and reload tasks
        const startDate = new Date(taskData.startDate);
        const deadline = new Date(taskData.deadline);
        
        const apiTask = {
          title: taskData.title,
          description: taskData.description,
          startTime: startDate.toISOString(),
          deadline: deadline.toISOString(),
          priority: taskData.priority
        };

        await createTask(apiTask);
        
        // Reload all tasks to get the latest data
        await loadTasks();
        setConflictWarning("");
      }
    } catch (error) {
      console.error('Failed to save task:', error);
      alert('Failed to save task. Please try again.');
    }
  };

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setDefaultTaskStartDate(undefined);
    setConflictWarning("");
    setIsTaskFormOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    // Remove task from local state
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const handleLogin = (isAdminUser: boolean) => {
    setIsAuthenticated(true);
    setIsAdmin(isAdminUser);
    setShowRegister(false);
  };

  const handleRegister = () => {
    setIsAuthenticated(true);
    setIsAdmin(false);
    setShowRegister(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setShowRegister(false);
    setActiveView("schedule");
    setAdminView("stats");
    setIsAIChatOpen(false);
    setTasks([]);
  };

  const handleCalendarClick = (date: Date, hour: number) => {
    if (activeView !== "schedule") return;

    // Create datetime string for the clicked position
    const clickedDateTime = new Date(date);
    clickedDateTime.setHours(hour, 0, 0, 0);

    // Format for datetime-local input
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

  // Show login/register pages if not authenticated
  if (!isAuthenticated) {
    if (showRegister) {
      return (
        <RegisterPage
          onRegister={handleRegister}
          onSwitchToLogin={() => setShowRegister(false)}
        />
      );
    }
    return (
      <LoginPage
        onLogin={handleLogin}
        onSwitchToRegister={() => setShowRegister(true)}
      />
    );
  }

  // Admin View
  if (isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Admin Sidebar */}
        <AdminSidebar
          activeView={adminView}
          onViewChange={setAdminView}
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-auto">
          {adminView === "stats" ? <AdminStatsView /> : <AdminUsersView />}
        </div>
      </div>
    );
  }

  // User View
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <TeachSidebar
        activeView={activeView}
        onViewChange={setActiveView}
        onNewTask={handleNewTaskClick}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <ScheduleHeader onOpenAIChat={() => setIsAIChatOpen(true)} />

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="flex gap-6 p-6 h-full">
            {/* Main Content - Switch between Stats and Schedule */}
            <div className="flex-1 min-w-0">
              {activeView === "stats" ? (
                <DashboardView />
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

            {/* Right Panel - Hide when AI Chat is open */}
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

              {/* AI Chat Panel - Slide in from right */}
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

      {/* Task Form Dialog */}
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
