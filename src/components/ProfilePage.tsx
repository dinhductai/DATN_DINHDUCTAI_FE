import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Mail, Calendar, Edit2, Trash2, Camera } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'
import { userService } from '../services/userService'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { UpdateProfileDialog } from './UpdateProfileDialog'
import { DeleteAccountDialog } from './DeleteAccountDialog'

interface UserProfile {
  userId: number
  userName: string
  email: string
  profile?: string
  createdAt?: string
}

export function ProfilePage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    // Fake data for testing - remove this when backend API is ready
    const fakeUser: UserProfile = {
      userId: 1,
      userName: 'John Carter',
      email: 'john.carter@example.com',
      profile: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdHxlbnwxfHx8fDE3NjAwNDEwMjd8MA&ixlib=rb-4.1.0&q=80&w=1080',
      createdAt: '2024-01-15T10:30:00Z'
    }
    
    // Simulate API loading
    setTimeout(() => {
      setUser(fakeUser)
      setLoading(false)
    }, 500)
    
    // Uncomment below when backend API is ready
    // loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const userData = await userService.getMe()
      setUser(userData)
    } catch (err) {
      console.error('Failed to load user profile:', err)
      setError('Failed to load profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSuccess = () => {
    loadUserProfile()
  }

  const handleDeleteSuccess = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-500 mb-4">{error || 'Failed to load profile'}</p>
            <Button onClick={loadUserProfile}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid gap-6">
          {/* Profile Card */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 pb-32">
              <CardTitle className="text-white text-center">Personal Account</CardTitle>
            </CardHeader>
            <CardContent className="relative -mt-24">
              {/* Avatar */}
              <div className="relative mx-auto mb-6 flex justify-center">
                <Avatar 
                  className="!w-64 !h-64 border-4 border-white shadow-lg"
                  style={{ width: '256px', height: '256px' }}
                >
                  {user.profile ? (
                    <ImageWithFallback src={user.profile} alt={user.userName} className="!w-64 !h-64" />
                  ) : null}
                  <AvatarFallback className="text-6xl bg-blue-100 text-blue-700">
                    {getInitials(user.userName)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* User Info */}
              <div className="space-y-6 mt-6">
                {/* Account Name */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">Account Name</p>
                    <p className="font-medium text-gray-900">{user.userName}</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Mail className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">Email Address</p>
                    <p className="font-medium text-gray-900">{user.email}</p>
                  </div>
                </div>

                {/* Profile Picture */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Camera className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">Profile Picture</p>
                    <p className="font-medium text-gray-900">
                      {user.profile ? 'Uploaded' : 'Not set'}
                    </p>
                  </div>
                </div>

                {/* Account Created */}
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">Account Created</p>
                    <p className="font-medium text-gray-900">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200 justify-center">
                <Button
                  onClick={() => setIsUpdateDialogOpen(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 px-6"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Update
                </Button>
                <Button
                  onClick={() => setIsDeleteDialogOpen(true)}
                  variant="destructive"
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 px-6"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Update Profile Dialog */}
      <UpdateProfileDialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        user={user}
        onSuccess={handleUpdateSuccess}
      />

      {/* Delete Account Dialog */}
      <DeleteAccountDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        userId={user.userId}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  )
}
