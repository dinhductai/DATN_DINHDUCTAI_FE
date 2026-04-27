import { Search, Sparkles, Bell, MessageSquare, ChevronDown } from 'lucide-react'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { pushNotificationService } from '../services/pushNotificationService'
import { useState, useEffect } from 'react'

interface ScheduleHeaderProps {
  onOpenAIChat: () => void
}

export function ScheduleHeader({ onOpenAIChat }: ScheduleHeaderProps) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const subscribed = await pushNotificationService.isSubscribed();
      setIsSubscribed(subscribed);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleNotificationToggle = async () => {
    setIsLoading(true);
    
    try {
      if (isSubscribed) {
        // Unsubscribe
        await pushNotificationService.unsubscribe();
        setIsSubscribed(false);
      } else {
        // Subscribe
        const permission = await pushNotificationService.requestPermission();
        if (permission === 'granted') {
          await pushNotificationService.subscribe();
          setIsSubscribed(true);
        } else {
          alert('Notification permission denied. Please enable it in your browser settings.');
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
      alert('Failed to update notification settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search"
            className="pl-10 w-80 bg-gray-50 border-gray-200 rounded-lg"
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          <Button 
            onClick={onOpenAIChat}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Schedule Assistant
          </Button>

          <Button 
            variant="ghost" 
            size="icon" 
            className={`relative ${isSubscribed ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={handleNotificationToggle}
            disabled={isLoading}
            title={isSubscribed ? 'Disable notifications' : 'Enable notifications'}
          >
            <Bell className="w-5 h-5" />
            {isSubscribed && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full"></div>
            )}
          </Button>

          <Button variant="ghost" size="icon" className="text-gray-600 hover:bg-gray-50">
            <MessageSquare className="w-5 h-5" />
          </Button>

          <Avatar className="w-9 h-9 cursor-pointer">
            <ImageWithFallback 
              src="https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdHxlbnwxfHx8fDE3NjAwNDEwMjd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="User"
            />
            <AvatarFallback>JC</AvatarFallback>
          </Avatar>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  )
}