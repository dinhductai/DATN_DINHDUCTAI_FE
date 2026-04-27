import { Card } from './ui/card'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts'
import { CheckCircle, Clock, Circle, TrendingUp, Calendar } from 'lucide-react'
import { useEffect, useState } from 'react'
import { taskService, StatusTaskWeekResponse, DailyTaskCountResponse, TaskTimelineResponse } from '../services/taskService'

export function DashboardView() {
  const [completionRate, setCompletionRate] = useState<number>(0)
  const [freeHours, setFreeHours] = useState<number>(0)
  const [weeklyStatus, setWeeklyStatus] = useState<StatusTaskWeekResponse | null>(null)
  const [weeklyDistribution, setWeeklyDistribution] = useState<DailyTaskCountResponse[]>([])
  const [timelineData, setTimelineData] = useState<TaskTimelineResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true)

        // Fetch completion rate
        const completion = await taskService.getCompletionBeforeDeadlineRate().catch(err => {
          console.warn('Completion rate fetch failed:', err)
          return 0
        })
        setCompletionRate(Math.round(completion || 0))

        // Fetch free hours
        const free = await taskService.getFreeHoursThisWeek().catch(err => {
          console.warn('Free hours fetch failed:', err)
          return 0
        })
        setFreeHours(Math.round((free || 0) * 10) / 10)

        // Fetch weekly status
        const status = await taskService.getWeeklyTaskStatus().catch(err => {
          console.warn('Weekly status fetch failed:', err)
          return null
        })
        if (status) {
          setWeeklyStatus(status)
        }

        // Fetch weekly distribution
        const distribution = await taskService.getWeeklyTaskDistribution().catch(err => {
          console.warn('Weekly distribution fetch failed:', err)
          return []
        })
        setWeeklyDistribution(Array.isArray(distribution) ? distribution : [])

        // Fetch task creation timeline
        const timeline = await taskService.getTaskCreationTimeline().catch(err => {
          console.warn('Task creation timeline fetch failed:', err)
          return []
        })
        setTimelineData(Array.isArray(timeline) ? timeline : [])

      } catch (err: any) {
        console.error('Unexpected error in fetchStatistics:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStatistics()
  }, [])
  // Task completion data for pie chart
  const taskCompletionData = weeklyStatus ? [
    { name: 'Completed', value: Math.round(weeklyStatus.completedRate || 0), color: '#10b981' },
    { name: 'In Progress', value: Math.round(weeklyStatus.inProgressRate || 0), color: '#3b82f6' },
    { name: 'Not Started', value: Math.round(weeklyStatus.todoRate || 0), color: '#ef4444' },
  ] : [
    { name: 'Completed', value: 0, color: '#10b981' },
    { name: 'In Progress', value: 0, color: '#3b82f6' },
    { name: 'Not Started', value: 0, color: '#ef4444' },
  ]

  // Workload data for bar chart (tasks per day)
  const workloadData = weeklyDistribution && Array.isArray(weeklyDistribution) 
    ? weeklyDistribution.map(item => ({
        day: item.dayName || 'Unknown',
        tasks: Number(item.taskCount) || 0,
      }))
    : []

  const totalTasks = taskCompletionData.reduce((sum, item) => sum + item.value, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading statistics...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-1">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of your tasks and schedule</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Completion Before Deadline</p>
              <p className="text-3xl font-semibold text-gray-900">{completionRate}%</p>
              <div className="flex items-center space-x-1 mt-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">+5% from last week</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Free Time This Week</p>
              <p className="text-3xl font-semibold text-gray-900">{freeHours}h</p>
              <div className="flex items-center space-x-1 mt-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-600">Available for planning</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Completion Pie Chart */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="font-semibold mb-1">Weekly Task Status</h3>
            <p className="text-sm text-gray-500">{totalTasks} total tasks this week</p>
          </div>
          
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={taskCompletionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taskCompletionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Completed ({taskCompletionData[0].value})</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">In Progress ({taskCompletionData[1].value})</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Not Started ({taskCompletionData[2].value})</span>
            </div>
          </div>
        </Card>

        {/* Workload Bar Chart */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="font-semibold mb-1">Weekly Workload</h3>
            <p className="text-sm text-gray-500">Tasks per day</p>
          </div>
          
          {workloadData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={workloadData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Bar dataKey="tasks" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              <div className="flex items-center justify-center space-x-2 mt-4">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600">Tasks Count</span>
              </div>
            </>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              No weekly data available
            </div>
          )}
        </Card>
      </div>

      {/* Timeline Chart */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="font-semibold mb-1">Tasks Added Timeline</h3>
          <p className="text-sm text-gray-500">Number of tasks added to your schedule over time</p>
        </div>
        
        {timelineData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={timelineData.map(item => ({
                week: item.weekLabel,
                tasks: Number(item.taskCount) || 0
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  labelStyle={{ color: '#374151' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="tasks" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="flex items-center justify-center space-x-2 mt-4">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Tasks Added</span>
            </div>
          </>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-gray-400">
            No timeline data available
          </div>
        )}
      </Card>

      {/* Recent Tasks */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="font-semibold mb-1">Recent Tasks</h3>
          <p className="text-sm text-gray-500">Your latest task updates</p>
        </div>

        <div className="space-y-3">
          {[
            { title: 'UX Research Class Preparation', status: 'completed', time: '2 hours ago', color: 'bg-green-100 text-green-700' },
            { title: 'Grade Student Assignments', status: 'in-progress', time: '5 hours ago', color: 'bg-blue-100 text-blue-700' },
            { title: 'Update Course Materials', status: 'pending', time: '1 day ago', color: 'bg-gray-100 text-gray-700' },
            { title: 'Prepare Webinar Slides', status: 'in-progress', time: '2 days ago', color: 'bg-blue-100 text-blue-700' },
          ].map((task, idx) => (
            <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div className="flex items-center space-x-3">
                {task.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-600" />}
                {task.status === 'in-progress' && <Clock className="w-5 h-5 text-blue-600" />}
                {task.status === 'pending' && <Circle className="w-5 h-5 text-gray-400" />}
                <div>
                  <p className="font-medium text-sm">{task.title}</p>
                  <p className="text-xs text-gray-500">{task.time}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-lg text-xs ${task.color}`}>
                {task.status === 'completed' && 'Completed'}
                {task.status === 'in-progress' && 'In Progress'}
                {task.status === 'pending' && 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
