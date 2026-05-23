import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Eye, EyeOff, Upload } from 'lucide-react'
import { register, uploadProfile } from '../services/authService'
import { useTranslation } from '../contexts/LanguageContext'

interface RegisterPageProps {
  onRegister: () => void
  onSwitchToLogin: () => void
}

export function RegisterPage({ onRegister, onSwitchToLogin }: RegisterPageProps) {
  const { t } = useTranslation()
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

    const trimmedUsername = username.trim()
    const trimmedEmail = email.trim()
    const trimmedPassword = password

    if (!trimmedUsername) {
      setError(t('auth_usernameRequired'))
      return
    }

    if (!/^[a-zA-ZÀ-ỹ\s0-9]+$/.test(trimmedUsername)) {
      setError(t('auth_usernameInvalidFormat'))
      return
    }

    if (!trimmedEmail) {
      setError(t('auth_emailRequired'))
      return
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(trimmedEmail)) {
      setError(t('auth_emailInvalidFormat'))
      return
    }

    if (!trimmedPassword) {
      setError(t('auth_passwordRequired'))
      return
    }

    const hasUpper = /[A-Z]/.test(trimmedPassword)
    const hasLower = /[a-z]/.test(trimmedPassword)
    const hasDigit = /[0-9]/.test(trimmedPassword)
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(trimmedPassword)
    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial || trimmedPassword.length < 5) {
      setError(t('auth_passwordInvalidFormat'))
      return
    }

    setIsLoading(true)
    setUploadProgress(t('auth_creatingAccount'))

    const requestBody = {
      userName: trimmedUsername,
      email: trimmedEmail,
      password: trimmedPassword,
    }

    console.log('Registration request:', requestBody)

    try {
      const response = await register(requestBody)
      console.log('Registration successful, userId:', response.userId)

      if (profileFile) {
        setUploadProgress(t('auth_uploadingAvatar'))
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
      setError(err instanceof Error ? err.message : t('auth_registerFailed'))
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
            <h1 className="text-3xl font-semibold mb-2">{t('auth_registerTitle')}</h1>
            <p className="text-gray-500">{t('auth_registerSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">{t('auth_username')}</Label>
              <Input
                id="username"
                type="text"
                placeholder={t('auth_usernamePlaceholder')}
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
              <Label htmlFor="email">{t('auth_email')}</Label>
              <Input
                id="email"
                type="text"
                placeholder={t('auth_emailPlaceholder')}
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
              <Label htmlFor="password">{t('auth_password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth_passwordPlaceholder')}
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
              <Label htmlFor="profile">{t('auth_avatar')}</Label>
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
                    {profilePreview ? t('auth_imageSelected') : t('auth_chooseFile')}
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
              {isLoading ? t('auth_creatingAccount') : t('auth_registerBtn')}
            </Button>

            <div className="text-center text-sm text-gray-600">
              {t('auth_hasAccount')}{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('auth_loginBtn')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
