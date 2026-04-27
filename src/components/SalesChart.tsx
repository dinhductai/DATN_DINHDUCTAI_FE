import { Card } from './ui/card'
import { Button } from './ui/button'
import { BarChart, Eye, Share2 } from 'lucide-react'

export function SalesChart() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">Sales Performance</h3>
          <p className="text-sm text-gray-500">Visited 10 of 100 countries</p>
        </div>
        <Button variant="ghost" size="sm" className="text-gray-600">
          <Share2 className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Chart Area */}
      <div className="h-48 relative mb-6">
        <svg viewBox="0 0 400 150" className="w-full h-full">
          {/* Grid lines */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          {/* Area chart */}
          <path
            d="M0,130 Q50,120 100,110 T200,90 T300,70 T400,50 L400,150 L0,150 Z"
            fill="url(#gradient)"
          />
          
          {/* Line */}
          <path
            d="M0,130 Q50,120 100,110 T200,90 T300,70 T400,50"
            stroke="#8B5CF6"
            strokeWidth="2"
            fill="none"
          />
          
          {/* Data point */}
          <circle cx="300" cy="70" r="4" fill="#8B5CF6" />
          <circle cx="300" cy="70" r="8" fill="#8B5CF6" fillOpacity="0.2" />
        </svg>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400 -ml-8">
          <span>25 k</span>
          <span>20 k</span>
          <span>15 k</span>
          <span>10 k</span>
          <span>5 k</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center space-x-8">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <div>
            <p className="text-sm text-gray-500">Views</p>
            <p className="font-semibold">20,751</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <div>
            <p className="text-sm text-gray-500">Sales</p>
            <p className="font-semibold">2,564</p>
          </div>
        </div>
      </div>
    </Card>
  )
}