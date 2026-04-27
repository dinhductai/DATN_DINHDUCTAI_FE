import { Card } from './ui/card'
import { Button } from './ui/button'
import { Calendar, Plus } from 'lucide-react'

export function ActivityPanel() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dates = [
    [null, null, null, 1, 2, 3, 4],
    [5, 6, 7, 8, 9, 10, 11],
    [12, 13, 14, 15, 16, 17, 18],
    [19, 20, 21, 22, 23, 24, 25],
    [26, 27, 28, 29, 30, null, null]
  ]

  const activities = [
    {
      time: '07:00',
      type: 'BDO',
      status: 'GMT',
      title: 'Pre-flight Preparation Started',
      color: 'bg-blue-100 text-blue-700'
    },
    {
      time: '08:20',
      type: 'BDO',
      status: 'am',
      title: 'Registration Success Ready',
      color: 'bg-yellow-100 text-yellow-700'
    }
  ]

  return (
    <div className="w-80 space-y-4">
      {/* Calendar Card */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Activity</h3>
            <p className="text-sm text-gray-500">November 03, 2021</p>
          </div>
          <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
            <Plus className="w-4 h-4 mr-1" />
            Add Plan
          </Button>
        </div>

        {/* Mini Calendar */}
        <div className="mb-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {days.map((day) => (
              <div key={day} className="text-xs text-gray-500 text-center p-1">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {dates.flat().map((date, index) => (
              <div
                key={index}
                className={`text-xs text-center p-1 h-6 flex items-center justify-center ${
                  date === 3
                    ? 'bg-blue-500 text-white rounded'
                    : date
                    ? 'text-gray-700 hover:bg-gray-100 rounded cursor-pointer'
                    : ''
                }`}
              >
                {date}
              </div>
            ))}
          </div>
        </div>

        {/* Activities */}
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="text-xs text-gray-500 w-12">{activity.time}</div>
              <div className="flex-1">
                <div className={`inline-block px-2 py-1 rounded text-xs ${activity.color} mb-1`}>
                  {activity.type}
                </div>
                <p className="text-sm text-gray-700">{activity.title}</p>
                <div className="w-full bg-blue-100 h-1 rounded mt-2">
                  <div className="w-3/4 bg-blue-500 h-1 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Illustration Area */}
      <div className="h-64 bg-gradient-to-b from-blue-400 to-blue-500 rounded-lg relative overflow-hidden">
        {/* Sky and clouds */}
        <div className="absolute inset-0">
          <div className="absolute top-4 right-8 w-16 h-8 bg-white/30 rounded-full"></div>
          <div className="absolute top-8 right-16 w-12 h-6 bg-white/20 rounded-full"></div>
          <div className="absolute top-2 right-4 w-8 h-4 bg-white/25 rounded-full"></div>
        </div>

        {/* Airplane */}
        <div className="absolute top-12 right-8 transform rotate-12">
          <div className="w-12 h-3 bg-white rounded-full relative">
            <div className="absolute -top-1 left-8 w-6 h-5 bg-white rounded-full"></div>
            <div className="absolute top-0.5 left-2 w-8 h-1 bg-blue-600 rounded"></div>
            <div className="absolute -top-0.5 left-10 w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>

        {/* Mountains and landscape */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 300 120" className="w-full h-32">
            {/* Mountains */}
            <path d="M0,80 L50,40 L100,60 L150,30 L200,50 L250,20 L300,40 L300,120 L0,120 Z" fill="#1e3a8a" />
            <path d="M0,90 L40,60 L80,70 L120,50 L160,65 L200,45 L240,55 L280,35 L300,45 L300,120 L0,120 Z" fill="#1e40af" />
            
            {/* Trees */}
            <polygon points="60,85 65,70 70,85" fill="#065f46" />
            <polygon points="65,85 70,65 75,85" fill="#065f46" />
            <polygon points="170,90 175,75 180,90" fill="#065f46" />
            <polygon points="175,90 180,70 185,90" fill="#065f46" />
            
            {/* House */}
            <rect x="110" y="85" width="20" height="15" fill="#f3f4f6" />
            <polygon points="105,85 120,75 135,85" fill="#dc2626" />
            <rect x="115" y="90" width="4" height="10" fill="#92400e" />
            <rect x="122" y="88" width="3" height="3" fill="#fbbf24" />
          </svg>
        </div>
      </div>
    </div>
  )
}