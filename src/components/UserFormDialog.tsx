import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'
import { userService } from '@/services/userService'
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
      toast.error('Username must be at least 3 characters')
      return
    }
    
    if (!email.includes('@')) {
      toast.error('Please enter a valid email')
      return
    }

    // Validate password if provided
    if (password && password.length < 6) {
      toast.error('Password must be at least 6 characters if provided')
      return
    }
    
    // For create mode, password is required
    if (!user && !password) {
      toast.error('Password is required for new user')
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
        toast.success('User updated successfully')
      } else {
        // Create new user - password is required
        await userService.createUser({
          userName,
          password,
          email
        })
        toast.success('User created successfully')
      }
      
      onSave() // Trigger parent to refresh user list
      handleClose()
    } catch (error: any) {
      console.error('Error saving user:', error)
      toast.error(error.message || 'Failed to save user')
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
          <DialogTitle>{user ? 'Update User' : 'Create New User'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userName">Name</Label>
            <Input
              id="userName"
              placeholder="Enter user name (min 3 characters)"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              minLength={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter user email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              {user ? 'New Password (Optional)' : 'Password *'}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={user ? 'Leave empty to keep current password' : 'Enter password (min 6 characters)'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!user}
              minLength={6}
            />
            {user && (
              <p className="text-xs text-gray-500">
                💡 Leave empty if you don't want to change the password
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={loading}>
              {loading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
