import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Bell, User, Mail, Image as ImageIcon, Calendar,
  Settings, ChevronRight, Trash2, Moon, Sun, Globe, LogOut, Edit2,
  ChevronLeft
} from 'lucide-react'
import { Button } from './ui/button'
import { userService } from '../services/userService'
import { UpdateProfileDialog } from './UpdateProfileDialog'
import { DeleteAccountDialog } from './DeleteAccountDialog'
import { ConfirmDialog } from './ConfirmDialog'
import { useTheme } from '../contexts/ThemeContext'
import { useLanguage, useTranslation } from '../contexts/LanguageContext'
import { NotificationItem } from '../types/notification'
import { notificationService, formatNotificationTime } from '../services/notificationService'

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
  const { language, setLanguage } = useLanguage()
  const { t } = useTranslation()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [showSystemSettings, setShowSystemSettings] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationsEnabled')
    return saved !== null ? saved === 'true' : true
  })
  const [bannerIndex, setBannerIndex] = useState(0)

  // Notification state
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifPage, setNotifPage] = useState(0)
  const [notifTotalPages, setNotifTotalPages] = useState(1)
  const [notifLoading, setNotifLoading] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

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
    loadNotifications(0);

    notificationService.connect((incoming) => {
      const notificationsEnabled = localStorage.getItem('notificationsEnabled')
      if (notificationsEnabled === 'false') return
      setNotifications((prev) => [incoming, ...prev].slice(0, 5))
      setUnreadCount((c) => c + 1)
    })

    return () => {
      notificationService.disconnect()
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadNotifications = async (page: number) => {
    try {
      setNotifLoading(true)
      const data = await notificationService.getNotifications(page, 5)
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
      setNotifTotalPages(data.totalPages)
      setNotifPage(page)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setNotifLoading(false)
    }
  }

  const handleMarkAsRead = useCallback(async (id: number) => {
    try {
      await notificationService.markAsRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }, [])

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }, [])

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const userData = await userService.getMe()
      setUser(userData)
    } catch (err) {
      console.error('Failed to load user profile:', err)
      setError(t('profile_loadFailedMsg'))
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
    if (!dateStr) return t('profile_none')
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
    if (!profile) return t('profile_none')
    if (profile.registerSince !== undefined && profile.registerSince !== null) {
      if (profile.registerSince < 1) return t('profile_lessThanMonth')
      if (profile.registerSince === 1) return t('profile_oneMonth')
      return `${profile.registerSince} ${t('profile_months')}`
    }
    if (!profile.createdAt) return t('profile_none')
    const date = new Date(profile.createdAt)
    const now = new Date()
    const months = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30))
    if (months < 1) return t('profile_lessThanMonth')
    if (months === 1) return t('profile_oneMonth')
    return `${months} ${t('profile_months')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">{t('profile_loading')}</p>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{t('profile_loadFailed')}</h2>
          <p className="text-sm text-gray-500 mb-6">{error || t('profile_error')}</p>
          <Button onClick={loadUserProfile} className="bg-blue-600 hover:bg-blue-700">
            {t('common_retry')}
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
              <span>{t('profile_backHome')}</span>
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span
                className="hover:text-gray-700 cursor-pointer"
                onClick={() => navigate('/schedule')}
              >
                {t('profile_home')}
              </span>
              <span>›</span>
              <span className="text-gray-900">{t('profile_myProfile')}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setShowNotifications((v) => !v)}
              >
                <div className="relative inline-block">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 translate-x-px -translate-y-px min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
              </Button>

              {showNotifications && (
                <div className="absolute top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
                  style={{ right: '0' }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{t('header_notifications')}</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                      >
                        {t('header_markAllRead')}
                      </button>
                    )}
                  </div>

                  <div
                    className="overflow-y-auto notif-scroll"
                    style={{ maxHeight: '24rem' }}
                  >
                    {notifLoading && notifications.length === 0 ? (
                      <div className="py-10 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                        {t('header_noNotifications')}
                      </div>
                    ) : (
                      <>
                        <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
                          {notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                              className={`px-4 py-3 cursor-pointer transition-colors ${
                                n.isRead
                                  ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                                  : 'bg-blue-50/60 dark:bg-blue-900/20 hover:bg-blue-100/70 dark:hover:bg-blue-900/30'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className={`text-sm font-medium ${n.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-gray-100'}`}>
                                  {n.title}
                                </span>
                                {!n.isRead && (
                                  <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">{n.content}</p>
                              <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">
                                {formatNotificationTime(n.createdAt)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {notifTotalPages > 1 && (
                          <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                            <button
                              onClick={() => loadNotifications(notifPage - 1)}
                              disabled={notifPage === 0}
                              className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                              Trước
                            </button>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {notifPage + 1} / {notifTotalPages}
                            </span>
                            <button
                              onClick={() => loadNotifications(notifPage + 1)}
                              disabled={notifPage >= notifTotalPages - 1}
                              className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              Sau
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('profile_logout')}</span>
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
                  {t('profile_verified')}
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
                <h3>{t('profile_accountStatus')}</h3>
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">{t('profile_active')}</span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-white/80">{t('profile_memberSince')}</p>
                <p className="text-lg">{getMemberSinceText(user)}</p>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="col-span-2 space-y-6">
            {/* Account Information */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl">{t('profile_accountInfo')}</h2>
                <button
                  onClick={() => setIsUpdateDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-1 transition-colors"
                >
                  <span>✎</span>
                  {t('profile_edit')}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('profile_accountName')}</p>
                    <p className="text-gray-900">{user.userName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('profile_emailAddress')}</p>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('profile_avatar')}</p>
                    <p className="text-gray-900">{user.profile ? t('profile_uploaded') : t('profile_notSet')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t('profile_accountCreated')}</p>
                    <p className="text-gray-900">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Settings & Preferences */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl mb-6">{t('profile_settingsTitle')}</h2>
              <div className="space-y-3">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: darkMode ? '#1f2937' : '#f9fafb', borderRadius: '12px', transition: 'background 0.15s' }}>
                    <div style={{ width: '40px', height: '40px', background: '#f97316', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                      <Bell style={{ width: '20px', height: '20px' }} />
                    </div>
                    <button
                      onClick={() => setShowNotifications(!showNotifications)}
                      style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <p style={{ color: darkMode ? '#f9fafb' : '#111827', margin: 0, fontWeight: 500 }}>{t('profile_notifications')}</p>
                      <p style={{ fontSize: '14px', color: darkMode ? '#9ca3af' : '#6b7280', margin: 0 }}>
                        {notificationsEnabled ? t('profile_notifOn') : t('profile_notifOff')}
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
                    <div style={{ marginTop: '8px', marginLeft: '56px', padding: '16px', background: darkMode ? '#1f2937' : '#f9fafb', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <p style={{ color: darkMode ? '#f9fafb' : '#111827', margin: 0, fontWeight: 500 }}>{t('profile_pushNotif')}</p>
                          <p style={{ fontSize: '14px', color: darkMode ? '#9ca3af' : '#6b7280', margin: 0 }}>{t('profile_pushNotifDesc')}</p>
                        </div>
                        <button
                          onClick={() => {
                            const newValue = !notificationsEnabled
                            setNotificationsEnabled(newValue)
                            localStorage.setItem('notificationsEnabled', String(newValue))
                          }}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: darkMode ? '#1f2937' : '#f9fafb', borderRadius: '12px', transition: 'background 0.15s' }}>
                    <div style={{ width: '40px', height: '40px', background: '#22c55e', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                      <Settings style={{ width: '20px', height: '20px' }} />
                    </div>
                    <button
                      onClick={() => setShowSystemSettings(!showSystemSettings)}
                      style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <p style={{ color: darkMode ? '#f9fafb' : '#111827', margin: 0, fontWeight: 500 }}>{t('profile_systemSettings')}</p>
                      <p style={{ fontSize: '14px', color: darkMode ? '#9ca3af' : '#6b7280', margin: 0 }}>{language}</p>
                    </button>
                    <button
                      onClick={() => setShowSystemSettings(!showSystemSettings)}
                      style={{ padding: '4px', borderRadius: '6px', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                    >
                      <ChevronRight style={{ width: '20px', height: '20px', color: '#9ca3af', transition: 'transform 0.2s', transform: showSystemSettings ? 'rotate(90deg)' : 'rotate(0deg)' }} />
                    </button>
                  </div>

                  {showSystemSettings && (
                    <div style={{ marginTop: '12px', marginLeft: '56px', padding: '16px', background: darkMode ? '#1f2937' : '#f9fafb', borderRadius: '12px' }}>
                      {/* Dark Mode Toggle */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: darkMode ? '1px solid #374151' : '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {darkMode
                            ? <Moon style={{ width: '20px', height: '20px', color: darkMode ? '#9ca3af' : '#374151' }} />
                            : <Sun style={{ width: '20px', height: '20px', color: darkMode ? '#9ca3af' : '#374151' }} />
                          }
                          <div>
                            <p style={{ color: darkMode ? '#f9fafb' : '#111827', margin: 0, fontWeight: 500 }}>{t('profile_darkMode')}</p>
                            <p style={{ fontSize: '14px', color: darkMode ? '#9ca3af' : '#6b7280', margin: 0 }}>{t('profile_darkModeDesc')}</p>
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
                          <Globe style={{ width: '20px', height: '20px', color: darkMode ? '#9ca3af' : '#374151' }} />
                          <div>
                            <p style={{ color: darkMode ? '#f9fafb' : '#111827', margin: 0, fontWeight: 500 }}>{t('profile_language')}</p>
                            <p style={{ fontSize: '14px', color: darkMode ? '#9ca3af' : '#6b7280', margin: 0 }}>{t('profile_languageDesc')}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', items: 'center', gap: '8px', background: darkMode ? '#374151' : 'white', borderRadius: '8px', padding: '4px', border: darkMode ? '1px solid #4b5563' : '1px solid #e5e7eb' }}>
                          <button
                            onClick={() => setLanguage('VIE')}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              fontSize: '14px',
                              transition: 'all 0.15s',
                              background: language === 'VIE' ? '#2563eb' : 'transparent',
                              color: language === 'VIE' ? 'white' : darkMode ? '#d1d5db' : '#4b5563',
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
                              color: language === 'ENG' ? 'white' : darkMode ? '#d1d5db' : '#4b5563',
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
              <h2 className="text-xl text-red-600 mb-2">{t('profile_dangerZone')}</h2>
              <p className="text-gray-600 text-sm mb-4">
                {t('profile_dangerDesc')}
              </p>
              <button
                onClick={() => setIsDeleteDialogOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {t('profile_deleteAccount')}
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
        title={t('profile_logout')}
        description={t('profile_logoutConfirm')}
        onConfirm={handleLogout}
        confirmText={t('common_confirm')}
        cancelText={t('common_cancel')}
        destructive
      />
    </div>
  )
}
