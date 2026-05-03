import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { useState, useEffect } from 'react'
import { userService } from '../services/userService'
import { toast } from 'sonner'
import { Camera } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'
import { ImageWithFallback } from './figma/ImageWithFallback'

export interface User {
  userId: number
  userName: string
  email: string
  password?: string
  profile: string
  createdAt?: string
  roles?: string[]
}

interface UserFormDialogProps {
  open: boolean
  onClose: () => void
  onSave: () => void  // Changed to callback after successful save
  user?: User
}

export function UserFormDialog({ open, onClose, onSave, user }: UserFormDialogProps) {
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [profile, setProfile] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setUserName(user.userName)
      setEmail(user.email)
      setPassword('')
      setProfile(user.profile || '')
    } else {
      // Reset form for creating new user
      setUserName('')
      setEmail('')
      setPassword('')
      setProfile('')
    }
  }, [user, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (userName.length < 3) {
      toast.error('Tên người dùng phải có ít nhất 3 ký tự')
      return
    }
    
    if (!email.includes('@')) {
      toast.error('Vui lòng nhập email hợp lệ')
      return
    }

    // Validate password if provided
    if (password && password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự nếu được cung cấp')
      return
    }
    
    // For create mode, password is required
    if (!user && !password) {
      toast.error('Mật khẩu là bắt buộc cho người dùng mới')
      return
    }

    setLoading(true)
    try {
      if (user) {
        // Update existing user
        const updateRequest: any = {
          userName,
          email,
          profile
        }

        // Only include password if user provided one (optional)
        if (password) {
          updateRequest.password = password
        }

        await userService.updateUser(user.userId, updateRequest)
        toast.success('Cập nhật người dùng thành công')
      } else {
        // Create new user - password is required
        await userService.createUser({
          userName,
          password,
          email,
          profile
        })
        toast.success('Tạo người dùng thành công')
      }
      
      onSave() // Trigger parent to refresh user list
      handleClose()
    } catch (error: any) {
      console.error('Error saving user:', error)
      toast.error(error.message || 'Lưu người dùng thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setUserName('')
    setEmail('')
    setPassword('')
    setProfile('')
    onClose()
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{user ? 'Cập nhật người dùng' : 'Tạo người dùng mới'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Picture Preview */}
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-gray-100 shadow-sm">
                {profile ? (
                  <ImageWithFallback src={profile} alt={userName} />
                ) : null}
                <AvatarFallback className="text-2xl bg-purple-100 text-purple-700">
                  {getInitials(userName || 'U')}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="profile-upload"
                className="absolute -bottom-1 -right-1 p-1.5 bg-purple-600 rounded-full border-2 border-white cursor-pointer hover:bg-purple-700 transition-colors"
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
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onloadend = () => {
                    setProfile(reader.result as string)
                  }
                  reader.readAsDataURL(file)
                }
              }}
            />
            <div className="relative">
              <Input
                type="text"
                readOnly
                placeholder="Chọn ảnh từ máy..."
                value={profile ? 'Đã chọn ảnh' : ''}
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

          <div className="space-y-2">
            <Label htmlFor="userName">Tên</Label>
            <Input
              id="userName"
              placeholder="Nhập tên người dùng (tối thiểu 3 ký tự)"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              minLength={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Địa chỉ email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Nhập email người dùng"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              {user ? 'Mật khẩu mới (tùy chọn)' : 'Mật khẩu *'}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={user ? 'Để trống để giữ nguyên mật khẩu hiện tại' : 'Nhập mật khẩu (tối thiểu 6 ký tự)'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!user}
              minLength={6}
            />
            {user && (
              <p className="text-xs text-gray-500">
                💡 Để trống nếu bạn không muốn thay đổi mật khẩu
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Hủy
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={loading}>
              {loading ? 'Đang lưu...' : (user ? 'Cập nhật người dùng' : 'Tạo người dùng')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
