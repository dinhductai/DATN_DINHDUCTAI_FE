import { Card } from './ui/card'
import { Users, UserPlus, Activity, Briefcase } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { useEffect, useState } from 'react'
import { userService } from '../services/userService'
import { taskService, DailyCompletedTasksResponse, TaskPriorityCountResponse } from '../services/taskService'

// Fake data for monthly events (last 12 months)
const FAKE_MONTHLY_EVENTS = [
  { month: 'T6/25', events: 45 },
  { month: 'T7/25', events: 62 },
  { month: 'T8/25', events: 38 },
  { month: 'T9/25', events: 71 },
  { month: 'T10/25', events: 55 },
  { month: 'T11/25', events: 83 },
  { month: 'T12/25', events: 97 },
  { month: 'T1/26', events: 64 },
  { month: 'T2/26', events: 78 },
  { month: 'T3/26', events: 91 },
  { month: 'T4/26', events: 56 },
  { month: 'T5/26', events: 73 },
]

// Fake data for this month creation
const FAKE_THIS_MONTH_DATA = [
  { name: 'Sự kiện', value: 73, color: '#3b82f6' },
  { name: 'Công việc', value: 127, color: '#10b981' },
]

export function AdminStatsView() {
  const [totalUsers, setTotalUsers] = useState<number>(0)
  const [newUsersThisWeek, setNewUsersThisWeek] = useState<number>(0)
  const [activeUsersThisWeek, setActiveUsersThisWeek] = useState<number>(0)
  const [tasksCreatedThisWeek, setTasksCreatedThisWeek] = useState<number>(0)
  const [completedTasksData, setCompletedTasksData] = useState<DailyCompletedTasksResponse[]>([])
  const [priorityTasksData, setPriorityTasksData] = useState<TaskPriorityCountResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        setLoading(true)

        // Fetch total users
        const total = await userService.getTotalUsers().catch(err => {
          console.warn('Total users fetch failed:', err)
          return 0
        })
        setTotalUsers(Number(total) || 0)

        // Fetch new users this week
        const newUsers = await userService.getNewUsersThisWeek().catch(err => {
          console.warn('New users this week fetch failed:', err)
          return 0
        })
        setNewUsersThisWeek(Number(newUsers) || 0)

        // Fetch active users this week
        const activeUsers = await taskService.getActiveUsersThisWeek().catch(err => {
          console.warn('Active users this week fetch failed:', err)
          return 0
        })
        setActiveUsersThisWeek(Number(activeUsers) || 0)

        // Fetch tasks created this week
        const tasks = await taskService.getTasksCreatedThisWeek().catch(err => {
          console.warn('Tasks created this week fetch failed:', err)
          return 0
        })
        setTasksCreatedThisWeek(Number(tasks) || 0)

        // Fetch completed tasks by day
        const completed = await taskService.getDailyCompletedTasks().catch(err => {
          console.warn('Daily completed tasks fetch failed:', err)
          return []
        })
        setCompletedTasksData(Array.isArray(completed) ? completed : [])

        // Fetch tasks by priority
        const priority = await taskService.getTasksByPriority().catch(err => {
          console.warn('Tasks by priority fetch failed:', err)
          return []
        })
        setPriorityTasksData(Array.isArray(priority) ? priority : [])

      } catch (error) {
        console.error('Error fetching admin stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAdminStats()
  }, [])

  const stats = [
    {
      title: 'Tổng số người dùng',
      value: totalUsers.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Người dùng mới tuần này',
      value: newUsersThisWeek.toLocaleString(),
      icon: UserPlus,
      color: 'bg-green-500',
      lightColor: 'bg-green-100',
      iconColor: 'text-green-600'
    },
    {
      title: 'Người dùng hoạt động tuần này',
      value: activeUsersThisWeek.toLocaleString(),
      icon: Activity,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Công việc được tạo tuần này',
      value: tasksCreatedThisWeek.toLocaleString(),
      icon: Briefcase,
      color: 'bg-orange-500',
      lightColor: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
  ]

  // Translate day names to Vietnamese
  const translateDayName = (dayName: string): string => {
    const map: Record<string, string> = {
      'Monday': 'T2', 'Tuesday': 'T3', 'Wednesday': 'T4',
      'Thursday': 'T5', 'Friday': 'T6', 'Saturday': 'T7', 'Sunday': 'CN',
      'Mon': 'T2', 'Tue': 'T3', 'Wed': 'T4', 'Thu': 'T5', 'Fri': 'T6', 'Sat': 'T7', 'Sun': 'CN',
    }
    return map[dayName] || dayName
  }

  // Transform completed tasks data for line chart
  const completedTasksChartData = completedTasksData.map(item => ({
    day: translateDayName(item.dayName),
    tasks: Number(item.completedCount) || 0
  }))

  // Transform priority tasks data for bar chart with colors
  const priorityTasksChartData = priorityTasksData.map(item => ({
    priority: item.priorityLevel,
    count: Number(item.taskCount) || 0,
    fill: item.priorityLevel.toUpperCase() === 'HIGH' 
      ? '#ef4444' 
      : item.priorityLevel.toUpperCase() === 'MEDIUM' 
      ? '#eab308' 
      : '#22c55e'
  }))

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Thống kê quản trị</h1>
        <p className="text-gray-500">Tổng quan về chỉ số hệ thống và hoạt động người dùng</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                <h3 className="text-3xl font-semibold">{stat.value}</h3>
              </div>
              <div className={`${stat.lightColor} p-3 rounded-lg`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Top Charts Row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Completed Tasks Line Chart */}
        <Card className="p-6 col-span-2">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Công việc hoàn thành tuần này</h3>
            <p className="text-sm text-gray-500">Xu hướng hoàn thành công việc theo ngày</p>
          </div>
          {completedTasksChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={completedTasksChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="day"
                  stroke="#888888"
                  fontSize={12}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="tasks"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              Không có dữ liệu
            </div>
          )}
        </Card>

        {/* Priority Tasks Bar Chart */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Công việc theo mức ưu tiên</h3>
            <p className="text-sm text-gray-500">Tuần này</p>
          </div>
          {priorityTasksChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityTasksChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="priority"
                  stroke="#888888"
                  fontSize={12}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              Không có dữ liệu
            </div>
          )}
        </Card>
      </div>

      {/* Monthly Events Bar Chart */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Sự kiện 12 tháng gần nhất</h3>
          <p className="text-sm text-gray-500">Tổng số sự kiện được tạo theo tháng</p>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={FAKE_MONTHLY_EVENTS}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              stroke="#888888"
              fontSize={12}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
              cursor={{ fill: '#f3f4f6' }}
            />
            <Bar
              dataKey="events"
              fill="#8b5cf6"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Bottom Charts Row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Pie Chart - This Month Creation */}
        <Card className="p-6 col-span-2">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Sự kiện & công việc tạo trong tháng</h3>
            <p className="text-sm text-gray-500">Tỷ lệ phân bổ tháng này</p>
          </div>
          <div className="flex items-center justify-between">
            <ResponsiveContainer width="60%" height={250}>
              <PieChart>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value} (${((value / (FAKE_THIS_MONTH_DATA[0].value + FAKE_THIS_MONTH_DATA[1].value)) * 100).toFixed(1)}%)`, 'Số lượng']}
                />
                <Pie
                  data={FAKE_THIS_MONTH_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  labelLine={{ stroke: '#888', strokeWidth: 1 }}
                >
                  {FAKE_THIS_MONTH_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-4 pr-8">
              {/* Decline stats */}
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="w-3 h-3 rounded-full bg-[#3b82f6]" />
                <div>
                  <p className="text-sm text-gray-500">Sự kiện</p>
                  <p className="text-lg font-semibold text-red-500">-15.8%</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="w-3 h-3 rounded-full bg-[#10b981]" />
                <div>
                  <p className="text-sm text-gray-500">Công việc</p>
                  <p className="text-lg font-semibold text-red-500">-8.3%</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Empty placeholder or summary card */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Tổng kết tháng</h3>
            <p className="text-sm text-gray-500">So với tháng trước</p>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Tổng sự kiện</p>
              <p className="text-2xl font-bold text-[#3b82f6]">73</p>
              <p className="text-xs text-red-500 mt-1">-15.8% so với tháng trước</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Tổng công việc</p>
              <p className="text-2xl font-bold text-[#10b981]">127</p>
              <p className="text-xs text-red-500 mt-1">-8.3% so với tháng trước</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Tổng cộng</p>
              <p className="text-2xl font-bold text-gray-700">200</p>
              <p className="text-xs text-gray-400 mt-1">Sự kiện & công việc</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
