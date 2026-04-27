import { useState, useEffect } from 'react'
import { Camera, Eye, EyeOff, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'
import { ImageWithFallback } from './figma/ImageWithFallback'
import { userService } from '../services/userService'

interface UserProfile {
  userId: number
  userName: string
  email: string
  profile?: string
}

interface UpdateProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: UserProfile
  onSuccess: () => void
}

interface FormErrors {
  userName?: string
  email?: string
  password?: string
  confirmPassword?: string
  profile?: string
}

export function UpdateProfileDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UpdateProfileDialogProps) {
  const [userName, setUserName] = useState(user.userName)
  const [email, setEmail] = useState(user.email)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profile, setProfile] = useState(user.profile || '')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setUserName(user.userName)
      setEmail(user.email)
      setPassword('')
      setConfirmPassword('')
      setProfile(user.profile || '')
      setErrors({})
      setSubmitError(null)
    }
  }, [open, user])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!userName.trim()) {
      newErrors.userName = 'Account name is required'
    } else if (userName.length < 2) {
      newErrors.userName = 'Account name must be at least 2 characters'
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (password) {
      if (password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters'
      }

      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }
    }

    if (confirmPassword && !password) {
      newErrors.password = 'Please enter a password'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const updateData: {
        userName: string
        email: string
        profile?: string
        password?: string
      } = {
        userName: userName.trim(),
        email: email.trim(),
      }

      if (password) {
        updateData.password = password
      }

      if (profile) {
        updateData.profile = profile
      }

      await userService.updateUser(user.userId, updateData)
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Failed to update profile:', error)
      const errorMessage = error?.message || 'Failed to update profile. Please try again.'
      
      if (errorMessage.includes('email')) {
        setErrors({ email: 'This email is already in use' })
      } else {
        setSubmitError(errorMessage)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Profile</DialogTitle>
          <DialogDescription>
            Update your account information below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {submitError && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {submitError}
            </div>
          )}

          {/* Profile Picture Preview */}
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-gray-100 shadow-sm">
                {profile ? (
                  <ImageWithFallback src={profile} alt={userName} />
                ) : null}
                <AvatarFallback className="text-2xl bg-blue-100 text-blue-700">
                  {getInitials(userName || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 rounded-full border-2 border-white">
                <Camera className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </div>

          {/* Profile Picture URL */}
          <div className="space-y-2">
            <Label htmlFor="profile">Profile Picture URL</Label>
            <Input
              id="profile"
              type="url"
              placeholder="https://example.com/photo.jpg"
              value={profile}
              onChange={(e) => {
                setProfile(e.target.value)
                setErrors(prev => ({ ...prev, profile: undefined }))
              }}
              className={errors.profile ? 'border-red-500' : ''}
            />
            {errors.profile && (
              <p className="text-sm text-red-500">{errors.profile}</p>
            )}
          </div>

          {/* Account Name */}
          <div className="space-y-2">
            <Label htmlFor="userName">Account Name</Label>
            <Input
              id="userName"
              type="text"
              placeholder="Enter your account name"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value)
                setErrors(prev => ({ ...prev, userName: undefined }))
              }}
              className={errors.userName ? 'border-red-500' : ''}
            />
            {errors.userName && (
              <p className="text-sm text-red-500">{errors.userName}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setErrors(prev => ({ ...prev, email: undefined }))
              }}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">New Password (optional)</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setErrors(prev => ({ ...prev, password: undefined, confirmPassword: undefined }))
                }}
                className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setErrors(prev => ({ ...prev, confirmPassword: undefined }))
                }}
                className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
