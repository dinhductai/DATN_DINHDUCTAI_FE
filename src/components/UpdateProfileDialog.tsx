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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Preview của ảnh mới (base64 data URL) — chỉ dùng để hiển thị preview
  const [newImageFile, setNewImageFile] = useState<File | null>(null)
  const [newImagePreview, setNewImagePreview] = useState<string>('')

  useEffect(() => {
    if (open) {
      setUserName(user.userName)
      setEmail(user.email)
      setPassword('')
      setConfirmPassword('')
      setNewImageFile(null)
      setNewImagePreview('')
      setErrors({})
      setSubmitError(null)
    }
  }, [open, user])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!userName.trim()) {
      newErrors.userName = 'Tên tài khoản là bắt buộc'
    } else if (userName.length < 2) {
      newErrors.userName = 'Tên tài khoản phải có ít nhất 2 ký tự'
    }

    if (!email.trim()) {
      newErrors.email = 'Email là bắt buộc'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Vui lòng nhập địa chỉ email hỏi lệ'
    }

    if (password) {
      if (password.length < 6) {
        newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
      }

      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Mật khẩu không khớp'
      }
    }

    if (confirmPassword && !password) {
      newErrors.password = 'Vui lòng nhập mật khẩu'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setNewImageFile(file)
      setNewImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const hasTextChange =
        userName.trim() !== user.userName ||
        email.trim() !== user.email ||
        password !== ''

      const hasImageChange = newImageFile !== null

      // 1. Nếu có thay đổi thông tin text → gọi PUT /api/users/{userId}
      if (hasTextChange) {
        const updateData: {
          userName: string
          email: string
          password?: string
        } = {
          userName: userName.trim(),
          email: email.trim(),
        }

        if (password) {
          updateData.password = password
        }

        await userService.updateUser(user.userId, updateData)
      }

      // 2. Nếu có thay đổi ảnh → gọi POST /api/users/upload-profile/{userId} (chạy ngầm)
      if (hasImageChange) {
        userService.uploadProfileImage(user.userId, newImageFile!).catch(err => {
          console.error('[UpdateProfile] Upload image failed:', err)
        })
      }

      // 3. Nếu không có gì thay đổi thì không call API
      if (!hasTextChange && !hasImageChange) {
        onOpenChange(false)
        setIsSubmitting(false)
        return
      }

      // Đợi update text xong (nếu có) rồi mới gọi onSuccess
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Failed to update profile:', error)
      const errorMessage = error?.message || 'Cập nhật hồ sơ thất bại. Vui lòng thử lại.'

      if (errorMessage.includes('email')) {
        setErrors({ email: 'Email này đã được sử dụng' })
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

  // Ảnh hiển thị: ưu tiên preview mới > ảnh cũ
  const displayImage = newImagePreview || user.profile

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cập nhật hồ sơ</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin tài khoản của bạn bên dưới.
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
                {displayImage ? (
                  <ImageWithFallback src={displayImage} alt={userName} />
                ) : null}
                <AvatarFallback className="text-2xl bg-blue-100 text-blue-700">
                  {getInitials(userName || 'U')}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="profile-upload"
                className="absolute -bottom-1 -right-1 p-1.5 bg-blue-600 rounded-full border-2 border-white cursor-pointer hover:bg-blue-700 transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-white" />
              </label>
            </div>
          </div>

          {/* Profile Picture Upload */}
          <div className="space-y-2">
            <Label htmlFor="profile-upload">Ảnh đại diện</Label>
            <input
              id="profile-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <div className="relative">
              <Input
                type="text"
                readOnly
                placeholder="Chọn ảnh từ máy..."
                value={newImageFile ? 'Đã chọn ảnh mới' : ''}
                className="pr-10 cursor-pointer"
                onClick={() => document.getElementById('profile-upload')?.click()}
              />
              <label
                htmlFor="profile-upload"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </label>
            </div>
          </div>

          {/* Account Name */}
          <div className="space-y-2">
            <Label htmlFor="userName">Tên tài khoản</Label>
            <Input
              id="userName"
              type="text"
              placeholder="Nhập tên tài khoản của bạn"
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
            <Label htmlFor="email">Địa chỉ email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Nhập email của bạn"
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
            <Label htmlFor="password">Mật khẩu mới (tùy chọn)</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Nhập mật khẩu mới"
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
            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Xác nhận mật khẩu của bạn"
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
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                'Cập nhật'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
