import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Eye, EyeOff, Upload } from 'lucide-react'
import { register, uploadProfile } from '../services/authService'

interface RegisterPageProps {
  onRegister: () => void
  onSwitchToLogin: () => void
}

export function RegisterPage({ onRegister, onSwitchToLogin }: RegisterPageProps) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [profileFile, setProfileFile] = useState<File | null>(null)
  const [profilePreview, setProfilePreview] = useState<string>('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setProfileFile(file)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfilePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username.trim()) {
      setError('Tên người dùng là bắt buộc')
      return
    }

    if (!email.trim()) {
      setError('Email là bắt buộc')
      return
    }

    if (!password.trim()) {
      setError('Mật khẩu là bắt buộc')
      return
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    setIsLoading(true)
    setUploadProgress('Đang tạo tài khoản...')

    const requestBody = {
      userName: username.trim(),
      email: email.trim(),
      password: password,
    }

    console.log('Registration request:', requestBody)

    try {
      const response = await register(requestBody)
      console.log('Registration successful, userId:', response.userId)

      if (profileFile) {
        setUploadProgress('Đang tải ảnh đại diện...')
        try {
          const uploadResult = await uploadProfile(response.userId, profileFile)
          console.log('Profile uploaded:', uploadResult.url)
        } catch (uploadErr) {
          console.warn('Profile upload failed, but account was created:', uploadErr)
        }
      }

      console.log('Registration and profile upload complete')
      onRegister()
    } catch (err) {
      console.error('Registration catch error:', err)
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
      setUploadProgress('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold mb-2">Tạo tài khoản</h1>
            <p className="text-gray-500">Đăng ký để bắt đầu với Smart Schedule</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Tên người dùng</Label>
              <Input
                id="username"
                type="text"
                placeholder="Nhập tên người dùng"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value)
                  setError('')
                }}
                className="h-12 bg-gray-50 border-gray-200"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Địa chỉ email</Label>
              <Input
                id="email"
                type="text"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                className="h-12 bg-gray-50 border-gray-200"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  className="h-12 bg-gray-50 border-gray-200 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile">Ảnh đại diện (tùy chọn)</Label>
              <div className="relative">
                <Input
                  id="profile"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="profile"
                  className="flex items-center justify-center h-12 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <Upload className="w-5 h-5 mr-2 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {profilePreview ? 'Đã chọn ảnh' : 'Chọn tệp'}
                  </span>
                </label>
              </div>
              {profilePreview && (
                <div className="mt-2 flex items-center space-x-3">
                  <img
                    src={profilePreview}
                    alt="Profile preview"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <span className="text-sm text-gray-500">
                    {profileFile?.name} ({(profileFile?.size || 0 / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}
            </div>

            {uploadProgress && (
              <div className="text-sm text-blue-600 text-center">
                {uploadProgress}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </Button>

            <div className="text-center text-sm text-gray-600">
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Đăng nhập
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
