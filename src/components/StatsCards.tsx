import { Clock, CheckCircle, DollarSign } from 'lucide-react'
import { Card } from './ui/card'

export function StatsCards() {
  const stats = [
    {
      title: 'Waiting list',
      value: '840',
      change: '+0.5%',
      color: 'bg-blue-500',
      icon: Clock,
      bgGradient: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Completed flights',
      value: '235',
      change: '+0.5%',
      color: 'bg-purple-500',
      icon: CheckCircle,
      bgGradient: 'from-purple-500 to-pink-500'
    },
    {
      title: 'Total revenue',
      value: '$2m',
      change: '+0.5%',
      color: 'bg-gray-900',
      icon: DollarSign,
      bgGradient: 'from-gray-800 to-gray-900'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className={`p-4 text-white bg-gradient-to-r ${stat.bgGradient} border-0`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm mb-1">{stat.title}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-white/80 text-sm mt-1">{stat.change}</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-12 h-8 bg-white/20 rounded flex items-center justify-center">
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
                <span className="text-xs">📊</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}