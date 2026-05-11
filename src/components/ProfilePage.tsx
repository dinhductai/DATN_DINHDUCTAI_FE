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
import { ConfirmDialog } from './ConfirmDialog'
import { useTheme } from '../contexts/ThemeContext'

interface UserProfile {
  userId: number
  userName: string
  email: string
  profile?: string
  createdAt?: string
  registerSince?: number
}

export function ProfilePage() {
  const navigate = useNavigate()
  const { darkMode, toggleDarkMode } = useTheme()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSystemSettings, setShowSystemSettings] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [language, setLanguage] = useState('ENG')
  const [bannerIndex, setBannerIndex] = useState(0)

  const banners = ['/banner1.jpg', '/banner2.jpg']

  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % banners.length)
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const userData = await userService.getMe()
      setUser(userData)
    } catch (err) {
      console.error('Failed to load user profile:', err)
      setError('Tải hồ sơ thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSuccess = () => {
    loadUserProfile()
  }

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const handleDeleteSuccess = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Không có'
    const date = new Date(dateStr)
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMemberSinceText = (profile?: UserProfile) => {
    if (!profile) return 'Không có'
    if (profile.registerSince !== undefined && profile.registerSince !== null) {
      if (profile.registerSince < 1) return 'Ít hơn một tháng'
      if (profile.registerSince === 1) return '1 tháng'
      return `${profile.registerSince} tháng`
    }
    if (!profile.createdAt) return 'Không có'
    const date = new Date(profile.createdAt)
    const now = new Date()
    const months = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30))
    if (months < 1) return 'Ít hơn một tháng'
    if (months === 1) return '1 tháng'
    return `${months} tháng`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Đang tải hồ sơ...</p>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Không thể tải hồ sơ</h2>
          <p className="text-sm text-gray-500 mb-6">{error || 'Đã xảy ra lỗi. Vui lòng thử lại.'}</p>
          <Button onClick={loadUserProfile} className="bg-blue-600 hover:bg-blue-700">
            Thử lại
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
              <span>Quay lại trang chủ</span>
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span 
                className="hover:text-gray-700 cursor-pointer"
                onClick={() => navigate('/schedule')}
              >
                Trang chủ
              </span>
              <span>›</span>
              <span className="text-gray-900">Hồ sơ của tôi</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">1</span>
            </button>
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <img 
                src={user.profile || '/profile_picture.png'} 
                alt={user.userName} 
                className="w-full h-full rounded-full object-cover" 
              />
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-8" style={{ maxWidth: '1100px', marginLeft: 'auto', marginRight: 'auto' }}>
        {/* Cover Banner */}
        <div
          className="rounded-t-2xl overflow-hidden relative"
          style={{ height: '160px' }}
        >
          <div
            style={{
              display: 'flex',
              width: `${banners.length * 100}%`,
              height: '100%',
              transform: `translateX(-${bannerIndex * (100 / banners.length)}%)`,
              transition: 'transform 0.8s ease-in-out',
            }}
          >
            {banners.map((banner, index) => (
              <div
                key={index}
                style={{
                  width: `${100 / banners.length}%`,
                  height: '100%',
                  backgroundImage: `url(${banner})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-b-2xl shadow-sm" style={{ padding: '0 32px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', marginTop: '-64px', marginBottom: '24px' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: '128px', height: '128px', borderRadius: '16px', background: 'white', padding: '4px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
                <img
                  src={user.profile || '/profile_picture.png'}
                  alt={user.userName}
                  style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }}
                />
              </div>
              <div style={{ position: 'absolute', bottom: '-8px', right: '-8px', width: '36px', height: '36px', background: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', fontSize: '16px' }}>
                ✓
              </div>
            </div>
            <div style={{ paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827', margin: 0 }}>{user.userName}</h1>
                <span style={{ fontSize: '0.875rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', background: '#16a34a', borderRadius: '50%', display: 'inline-block' }} />
                  Đã xác minh
                </span>
              </div>
              <p style={{ color: '#6b7280', margin: 0 }}>{user.email}</p>
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
                <h3>Trạng thái tài khoản</h3>
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">Hoạt động</span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-white/80">Thành viên từ</p>
                <p className="text-lg">{getMemberSinceText(user)}</p>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="col-span-2 space-y-6">
            {/* Account Information */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl">Thông tin tài khoản</h2>
                <button
                  onClick={() => setIsUpdateDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <span>✎</span>
                  Sửa
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tên tài khoản</p>
                    <p className="text-gray-900">{user.userName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Địa chỉ email</p>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ảnh đại diện</p>
                    <p className="text-gray-900">{user.profile ? 'Đã tải lên' : 'Chưa đặt'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tài khoản được tạo</p>
                    <p className="text-gray-900">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings & Preferences */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl mb-6">Cài đặt & Tùy chọn</h2>
              <div className="space-y-3">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#f9fafb', borderRadius: '12px', transition: 'background 0.15s' }}>
                    <div style={{ width: '40px', height: '40px', background: '#f97316', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                      <Bell style={{ width: '20px', height: '20px' }} />
                    </div>
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <p style={{ color: '#111827', margin: 0, fontWeight: 500 }}>Thông báo</p>
                      <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                        {notificationsEnabled ? 'Bật' : 'Tắt'}
                      </p>
                    </button>
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      style={{ padding: '4px', borderRadius: '6px', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                    >
                      <ChevronRight style={{ width: '20px', height: '20px', color: '#9ca3af', transition: 'transform 0.2s', transform: showNotifications ? 'rotate(90deg)' : 'rotate(0deg)' }} />
                    </button>
                  </div>

                  {showNotifications && (
                    <div style={{ marginTop: '8px', marginLeft: '56px', padding: '16px', background: '#f9fafb', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <p style={{ color: '#111827', margin: 0, fontWeight: 500 }}>Thông báo đẩy</p>
                          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Thông báo đẩy từ trình duyệt</p>
                        </div>
                        <button
                          onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                          style={{
                            position: 'relative',
                            height: '28px',
                            width: '52px',
                            borderRadius: '14px',
                            background: notificationsEnabled ? '#2563eb' : '#d1d5db',
                            transition: 'background 0.2s',
                            border: 'none',
                            cursor: 'pointer',
                            flexShrink: 0,
                            padding: 0,
                          }}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              top: '3px',
                              left: notificationsEnabled ? '27px' : '3px',
                              height: '22px',
                              width: '22px',
                              borderRadius: '50%',
                              background: 'white',
                              transition: 'left 0.2s',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            }}
                          />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: '#f9fafb', borderRadius: '12px', transition: 'background 0.15s' }}>
                    <div style={{ width: '40px', height: '40px', background: '#22c55e', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                      <Settings style={{ width: '20px', height: '20px' }} />
                    </div>
                    <button
                      onClick={() => setShowSystemSettings(!showSystemSettings)}
                      style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <p style={{ color: '#111827', margin: 0, fontWeight: 500 }}>Cài đặt hệ thống</p>
                      <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>{language}</p>
                    </button>
                    <button
                      onClick={() => setShowSystemSettings(!showSystemSettings)}
                      style={{ padding: '4px', borderRadius: '6px', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                    >
                      <ChevronRight style={{ width: '20px', height: '20px', color: '#9ca3af', transition: 'transform 0.2s', transform: showSystemSettings ? 'rotate(90deg)' : 'rotate(0deg)' }} />
                    </button>
                  </div>

                  {showSystemSettings && (
                    <div style={{ marginTop: '12px', marginLeft: '56px', padding: '16px', background: '#f9fafb', borderRadius: '12px' }}>
                      {/* Dark Mode Toggle */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {darkMode
                            ? <Moon style={{ width: '20px', height: '20px', color: '#374151' }} />
                            : <Sun style={{ width: '20px', height: '20px', color: '#374151' }} />
                          }
                          <div>
                            <p style={{ color: '#111827', margin: 0, fontWeight: 500 }}>Chế độ tối</p>
                            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Chuyển đổi chế độ tối/sáng</p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleDarkMode()}
                          style={{
                            position: 'relative',
                            height: '28px',
                            width: '52px',
                            borderRadius: '14px',
                            background: darkMode ? '#2563eb' : '#d1d5db',
                            transition: 'background 0.2s',
                            border: 'none',
                            cursor: 'pointer',
                            flexShrink: 0,
                            padding: 0,
                          }}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              top: '3px',
                              left: darkMode ? '27px' : '3px',
                              height: '22px',
                              width: '22px',
                              borderRadius: '50%',
                              background: 'white',
                              transition: 'left 0.2s',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            }}
                          />
                        </button>
                      </div>

                      {/* Language Toggle */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Globe style={{ width: '20px', height: '20px', color: '#374151' }} />
                          <div>
                            <p style={{ color: '#111827', margin: 0, fontWeight: 500 }}>Ngôn ngữ</p>
                            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Chọn ngôn ngữ của bạn</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', borderRadius: '8px', padding: '4px', border: '1px solid #e5e7eb' }}>
                          <button
                            onClick={() => setLanguage('VIE')}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '14px',
                              transition: 'all 0.15s',
                              background: language === 'VIE' ? '#2563eb' : 'transparent',
                              color: language === 'VIE' ? 'white' : '#4b5563',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            VIE
                          </button>
                          <button
                            onClick={() => setLanguage('ENG')}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '14px',
                              transition: 'all 0.15s',
                              background: language === 'ENG' ? '#2563eb' : 'transparent',
                              color: language === 'ENG' ? 'white' : '#4b5563',
                              border: 'none',
                              cursor: 'pointer',
                            }}
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
              <h2 className="text-xl text-red-600 mb-2">Khu vực nguy hiểm</h2>
              <p className="text-gray-600 text-sm mb-4">
                Khi bạn xóa tài khoản, không thể khôi phục. Vui lòng chắc chắn.
              </p>
              <button
                onClick={() => setIsDeleteDialogOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Xóa tài khoản của tôi
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
      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Đăng xuất"
        description="Bạn có chắc chắn muốn đăng xuất không?"
        onConfirm={handleLogout}
        confirmText="Đồng ý"
        cancelText="Hủy"
        destructive
      />
    </div>
  )
}
