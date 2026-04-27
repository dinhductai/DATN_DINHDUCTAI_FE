import { Card } from './ui/card'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'
import { Plane, Clock } from 'lucide-react'

export function BookingsTable() {
  const bookings = [
    {
      id: 1,
      time: '06:00',
      destination: 'Singapore',
      arrivalTime: '08:30',
      arrivalCity: 'Bandung',
      date: 'Nov 03, 2021',
      duration: '2h 30m',
      passengers: [
        { name: 'John', avatar: '/api/placeholder/24/24' },
        { name: 'Jane', avatar: '/api/placeholder/24/24' }
      ]
    },
    {
      id: 2,
      time: '20:00',
      destination: 'London',
      arrivalTime: '23:30',
      arrivalCity: 'Moscow',
      date: 'Nov 01, 2021',
      duration: '3h 30m',
      passengers: [
        { name: 'Mike', avatar: '/api/placeholder/24/24' },
        { name: 'Sara', avatar: '/api/placeholder/24/24' }
      ]
    }
  ]

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">All Bookings</h3>
        <Select defaultValue="month">
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="day">Day</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filters */}
      <div className="flex space-x-4 mb-6">
        <Select defaultValue="departure">
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Departure date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="departure">Departure date</SelectItem>
          </SelectContent>
        </Select>
        
        <Select defaultValue="booking">
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Booking type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="booking">Booking type</SelectItem>
          </SelectContent>
        </Select>
        
        <Select defaultValue="date">
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table Headers */}
      <div className="grid grid-cols-4 gap-4 mb-4 text-sm text-gray-500 pb-2 border-b">
        <div>Destination</div>
        <div>Date</div>
        <div>People</div>
        <div></div>
      </div>

      {/* Booking Rows */}
      <div className="space-y-4">
        {bookings.map((booking) => (
          <div key={booking.id} className="grid grid-cols-4 gap-4 items-center py-2">
            {/* Destination */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Plane className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">{booking.time}</div>
                  <div className="text-sm text-gray-500">{booking.destination}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-gray-400">
                <div className="w-4 border-t border-dashed border-gray-300"></div>
                <Clock className="w-3 h-3" />
                <div className="text-xs">{booking.duration}</div>
                <div className="w-4 border-t border-dashed border-gray-300"></div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div>
                  <div className="font-medium">{booking.arrivalTime}</div>
                  <div className="text-sm text-gray-500">{booking.arrivalCity}</div>
                </div>
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <Plane className="w-4 h-4 text-gray-600 transform rotate-90" />
                </div>
              </div>
            </div>

            {/* Date */}
            <div className="text-sm text-gray-600">{booking.date}</div>

            {/* People */}
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {booking.passengers.map((passenger, idx) => (
                  <Avatar key={idx} className="w-6 h-6 border-2 border-white">
                    <AvatarImage src={passenger.avatar} alt={passenger.name} />
                    <AvatarFallback className="text-xs">{passenger.name[0]}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" className="text-gray-400">
                •••
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}