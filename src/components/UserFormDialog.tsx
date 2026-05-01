import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { useState, useEffect } from 'react'
import { userService } from '../services/userService'
import { toast } from 'sonner'

export interface User {
  userId: number
  userName: string
  email: string
  password?: string
  profile: string
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
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setUserName(user.userName)
      setEmail(user.email)
      setPassword('')
    } else {
      // Reset form for creating new user
      setUserName('')
      setEmail('')
      setPassword('')
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
          profile: user.profile
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
          email
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
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{user ? 'Cập nhật người dùng' : 'Tạo người dùng mới'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
