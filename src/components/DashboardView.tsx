import { Card } from './ui/card'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts'
import { CheckCircle, Clock, Circle, TrendingUp, Calendar } from 'lucide-react'
import { useEffect, useState } from 'react'
import { taskService, StatusTaskWeekResponse, DailyTaskCountResponse, TaskTimelineResponse, RecentTaskResponse, MonthlyEventCountResponse } from '../services/taskService'
import { useTranslation } from '../contexts/LanguageContext'

export function DashboardView() {
  const { t } = useTranslation()

  const [completionRate, setCompletionRate] = useState<number>(0)
  const [freeHours, setFreeHours] = useState<number>(0)
  const [weeklyStatus, setWeeklyStatus] = useState<StatusTaskWeekResponse | null>(null)
  const [weeklyDistribution, setWeeklyDistribution] = useState<DailyTaskCountResponse[]>([])
  const [timelineData, setTimelineData] = useState<TaskTimelineResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [recentTasks, setRecentTasks] = useState<RecentTaskResponse[]>([])
  const [monthlyChartData, setMonthlyChartData] = useState<MonthlyEventCountResponse[]>([])

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

        // Fetch recent tasks (last 48 hours)
        const recent = await taskService.getRecentTasks(48).catch(err => {
          console.warn('Recent tasks fetch failed:', err)
          return []
        })
        setRecentTasks(Array.isArray(recent) ? recent : [])

        // Fetch monthly event counts
        const monthly = await taskService.getEventCountsByMonth().catch(err => {
          console.warn('Monthly event counts fetch failed:', err)
          return []
        })
        setMonthlyChartData(Array.isArray(monthly) ? monthly : [])

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
    { name: t('dashboard_completed'), value: Math.round(weeklyStatus.completedRate || 0), color: '#10b981' },
    { name: t('dashboard_inProgress'), value: Math.round(weeklyStatus.inProgressRate || 0), color: '#3b82f6' },
    { name: t('dashboard_notStarted'), value: Math.round(weeklyStatus.todoRate || 0), color: '#ef4444' },
  ] : [
    { name: t('dashboard_completed'), value: 0, color: '#10b981' },
    { name: t('dashboard_inProgress'), value: 0, color: '#3b82f6' },
    { name: t('dashboard_notStarted'), value: 0, color: '#ef4444' },
  ]

  const translateDayName = (dayName: string): string => {
    const trimmed = (dayName || '').trim()
    const map: Record<string, string> = {
      'Monday': 'T2', 'Tuesday': 'T3', 'Wednesday': 'T4',
      'Thursday': 'T5', 'Friday': 'T6', 'Saturday': 'T7', 'Sunday': 'CN',
      'Mon': 'T2', 'Tue': 'T3', 'Wed': 'T4', 'Thu': 'T5', 'Fri': 'T6', 'Sat': 'T7', 'Sun': 'CN',
    }
    return map[trimmed] || dayName
  }

  // Workload data for bar chart (tasks per day)
  const workloadData = weeklyDistribution && Array.isArray(weeklyDistribution)
    ? weeklyDistribution.map(item => ({
        day: translateDayName(item.dayName || ''),
        tasks: Number(item.taskCount) || 0,
      }))
    : []

  const totalTasks = taskCompletionData.reduce((sum, item) => sum + item.value, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">{t('dashboard_loading')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold mb-1">{t('dashboard_title')}</h1>
        <p className="text-sm text-gray-500">{t('dashboard_subtitle')}</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">{t('dashboard_completionRate')}</p>
              <p className="text-3xl font-semibold text-gray-900">{completionRate}%</p>
              <div className="flex items-center space-x-1 mt-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">{t('dashboard_vsLastWeek')}</span>
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
              <p className="text-sm text-gray-500 mb-1">{t('dashboard_freeTime')}</p>
              <p className="text-3xl font-semibold text-gray-900">{freeHours}h</p>
              <div className="flex items-center space-x-1 mt-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-600">{t('dashboard_availableForPlanning')}</span>
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
            <h3 className="font-semibold mb-1">{t('dashboard_taskStatus')}</h3>
            <p className="text-sm text-gray-500">{totalTasks} {t('dashboard_tasksThisWeek')}</p>
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
              <span className="text-sm text-gray-600">{t('dashboard_completed')} ({taskCompletionData[0].value})</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">{t('dashboard_inProgress')} ({taskCompletionData[1].value})</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">{t('dashboard_notStarted')} ({taskCompletionData[2].value})</span>
            </div>
          </div>
        </Card>

        {/* Workload Bar Chart */}
        <Card className="p-6">
          <div className="mb-4">
            <h3 className="font-semibold mb-1">{t('dashboard_weeklyWorkload')}</h3>
            <p className="text-sm text-gray-500">{t('dashboard_tasksPerDay')}</p>
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
                <span className="text-sm text-gray-600">{t('dashboard_taskCount')}</span>
              </div>
            </>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              {t('dashboard_noWeeklyData')}
            </div>
          )}
        </Card>
      </div>

      {/* Timeline Chart */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="font-semibold mb-1">{t('dashboard_history')}</h3>
          <p className="text-sm text-gray-500">{t('dashboard_historyDesc')}</p>
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
              <span className="text-sm text-gray-600">{t('dashboard_createdTasks')}</span>
            </div>
          </>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-gray-400">
            {t('dashboard_noHistoryData')}
          </div>
        )}
      </Card>

      {/* Recent Tasks */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="font-semibold mb-1">{t('dashboard_recentTasks')}</h3>
          <p className="text-sm text-gray-500">{t('dashboard_recentUpdates')}</p>
        </div>

        <div className="space-y-3">
          {recentTasks.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-400">{t('dashboard_no48hTasks')}</div>
          ) : (
            recentTasks.map((task) => {
              const now = new Date()
              const start = new Date(task.startTime)
              const diffMs = now.getTime() - start.getTime()
              const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
              const diffDays = Math.floor(diffHours / 24)
              const timeAgo = diffDays > 0
                ? `${diffDays} ${t('dashboard_daysAgo')}`
                : `${diffHours} ${t('dashboard_hoursAgo')}`

              const statusIcon = task.status === 'DONE'
                ? <CheckCircle className="w-5 h-5 text-green-600" />
                : task.status === 'IN_PROGRESS'
                ? <Clock className="w-5 h-5 text-blue-600" />
                : <Circle className="w-5 h-5 text-gray-400" />

              const statusLabel = task.status === 'DONE' ? t('dashboard_completed')
                : task.status === 'IN_PROGRESS' ? t('dashboard_inProgress')
                : task.status === 'TODO' ? t('dashboard_overdue') : task.status

              const priorityLabel = task.priority === 'HIGH' ? t('priority_high')
                : task.priority === 'MEDIUM' ? t('priority_medium')
                : task.priority === 'LOW' ? t('priority_low') : task.priority

              const priorityColor = task.priority === 'HIGH' ? 'bg-red-100 text-red-700'
                : task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700'
                : task.priority === 'LOW' ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700'

              const rowBg = task.status === 'DONE' ? 'bg-green-50 hover:bg-green-100'
                : task.status === 'IN_PROGRESS' ? 'bg-blue-50 hover:bg-blue-100'
                : task.status === 'TODO' ? 'bg-red-50 hover:bg-red-100'
                : 'bg-white hover:bg-gray-50'

              return (
                <div key={task.taskId} className={`flex items-center justify-between py-3 border-b border-gray-100 last:border-0 cursor-pointer transition-colors ${rowBg}`}>
                  <div className="flex items-center space-x-3">
                    {statusIcon}
                    <div>
                      <p className="font-medium text-sm">{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{timeAgo}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded border ${priorityColor}`}>{priorityLabel}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs ${task.status === 'DONE' ? 'bg-green-100 text-green-700' : task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : task.status === 'TODO' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                    {statusLabel}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </Card>

      {/* Monthly Events Bar Chart */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="font-semibold mb-1">{t('dashboard_eventsByMonth')}</h3>
          <p className="text-sm text-gray-500">{t('dashboard_last12months')}</p>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              labelStyle={{ color: '#374151' }}
            />
            <Bar dataKey="events" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
