import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Bell, User, Mail, Image as ImageIcon, Calendar,
  Settings, ChevronRight, Trash2, Moon, Sun, Globe, LogOut, Edit2
} from 'lucide-react'
import { Button } from './ui/button'
import { userService } from '../services/userService'
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
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSystemSettings, setShowSystemSettings] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState('ENG')

  useEffect(() => {
    const fakeUser: UserProfile = {
      userId: 1,
      userName: 'John Carter',
      email: 'johnacarter@example.com',
      profile: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
      createdAt: '2024-01-15T17:30:00Z'
    }

    setTimeout(() => {
      setUser(fakeUser)
      setLoading(false)
    }, 500)
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

  const getMemberSince = (dateStr?: string) => {
    if (!dateStr) return 'N/A'
    const date = new Date(dateStr)
    const now = new Date()
    const months = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30))
    if (months < 1) return 'Less than a month'
    if (months === 1) return '1 month'
    return `${months} months`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center max-w-sm w-full mx-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Unable to load profile</h2>
          <p className="text-sm text-gray-500 mb-6">{error || 'Something went wrong. Please try again.'}</p>
          <Button onClick={loadUserProfile} className="bg-blue-600 hover:bg-blue-700">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/schedule')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span 
                className="hover:text-gray-700 cursor-pointer"
                onClick={() => navigate('/schedule')}
              >
                Home
              </span>
              <span>›</span>
              <span className="text-gray-900">My Profile</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">1</span>
            </button>
            <button 
              onClick={handleDeleteSuccess}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <img 
                src={user.profile || ''} 
                alt={user.userName} 
                className="w-full h-full rounded-full object-cover" 
              />
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-8" style={{ maxWidth: '1100px', marginLeft: 'auto', marginRight: 'auto' }}>
        {/* Cover Banner */}
        <div className="bg-gradient-to-r from-black via-red-900 to-red-600 rounded-t-2xl h-32 relative" />

        {/* Profile Section */}
        <div className="bg-white px-8 pb-8 rounded-b-2xl shadow-sm">
          <div className="flex items-end gap-4 -mt-16 mb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl bg-white p-1 shadow-lg">
                <img 
                  src={user.profile || ''} 
                  alt={user.userName} 
                  className="w-full h-full rounded-xl object-cover" 
                />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg">
                <span className="text-lg">✓</span>
              </div>
            </div>
            <div className="pb-2">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl">{user.userName}</h1>
                <span className="text-sm text-blue-600 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  Personal Account
                </span>
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <span className="w-1 h-1 bg-green-600 rounded-full" />
                  Verified
                </span>
              </div>
              <p className="text-gray-500">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-6 mt-6">
          {/* Left Sidebar */}
          <div className="col-span-1">
            {/* Account Status Card */}
            <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h3>Account Status</h3>
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">Active</span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-white/80">Member Since</p>
                <p className="text-lg">{getMemberSince(user.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="col-span-2 space-y-6">
            {/* Account Information */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl">Account Information</h2>
                <button
                  onClick={() => setIsUpdateDialogOpen(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                >
                  <span>✎</span>
                  Edit
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Account Name</p>
                    <p className="text-gray-900">{user.userName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email Address</p>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Profile Picture</p>
                    <p className="text-gray-900">{user.profile ? 'Uploaded' : 'Not set'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Account Created</p>
                    <p className="text-gray-900">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings & Preferences */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl mb-6">Settings & Preferences</h2>
              <div className="space-y-3">
                <div>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors group"
                  >
                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-gray-900">Notifications</p>
                      <p className="text-sm text-gray-500">Enable</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-transform ${showNotifications ? 'rotate-90' : ''}`} />
                  </button>

                  {showNotifications && (
                    <div className="mt-3 ml-14 p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-900">Enable Notifications</p>
                          <p className="text-sm text-gray-500">Receive alerts and updates</p>
                        </div>
                        <button
                          onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <button
                    onClick={() => setShowSystemSettings(!showSystemSettings)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 rounded-xl transition-colors group"
                  >
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-gray-900">System Settings</p>
                      <p className="text-sm text-gray-500">Dark mode, {language}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-transform ${showSystemSettings ? 'rotate-90' : ''}`} />
                  </button>

                  {showSystemSettings && (
                    <div className="mt-3 ml-14 p-4 bg-gray-50 rounded-xl space-y-4">
                      {/* Dark Mode Toggle */}
                      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          {darkMode ? <Moon className="w-5 h-5 text-gray-700" /> : <Sun className="w-5 h-5 text-gray-700" />}
                          <div>
                            <p className="text-gray-900">Dark Mode</p>
                            <p className="text-sm text-gray-500">Toggle dark/light theme</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setDarkMode(!darkMode)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            darkMode ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              darkMode ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Language Toggle */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Globe className="w-5 h-5 text-gray-700" />
                          <div>
                            <p className="text-gray-900">Language</p>
                            <p className="text-sm text-gray-500">Select your language</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-gray-200">
                          <button
                            onClick={() => setLanguage('VIE')}
                            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                              language === 'VIE' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            VIE
                          </button>
                          <button
                            onClick={() => setLanguage('ENG')}
                            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                              language === 'ENG' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            ENG
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-red-100">
              <h2 className="text-xl text-red-600 mb-2">Danger Zone</h2>
              <p className="text-gray-600 text-sm mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button
                onClick={() => setIsDeleteDialogOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete My Account
              </button>
            </div>
          </div>
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
