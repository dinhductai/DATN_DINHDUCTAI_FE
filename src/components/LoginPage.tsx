import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Checkbox } from './ui/checkbox'
import { Eye, EyeOff } from 'lucide-react'
import { login } from '../services/authService'
import { useTranslation } from '../contexts/LanguageContext'

interface LoginPageProps {
  onLogin: (isAdmin: boolean) => void
  onSwitchToRegister: () => void
}

export function LoginPage({ onLogin, onSwitchToRegister }: LoginPageProps) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const response = await login({ email, password })
      if (response.authenticated) {
        // Store token and email in localStorage
        localStorage.setItem('token', response.token)
        localStorage.setItem('email', email)
        // For now, we'll assume admin status based on email
        const isAdmin = email.includes('admin')
        onLogin(isAdmin)
      } else {
        setError(t('auth_invalidCredentials'))
      }
    } catch (error) {
      setError(t('auth_loginFailed'))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold mb-2">{t('auth_loginTitle')}</h1>
            <p className="text-gray-500">{t('auth_loginSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

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

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked: boolean) => setRememberMe(checked)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-gray-600 cursor-pointer"
                >
                  {t('auth_rememberMe')}
                </label>
              </div>
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('auth_forgotPassword')}
              </button>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {t('auth_loginBtn')}
            </Button>

            <div className="text-center text-sm text-gray-600">
              {t('auth_noAccount')}{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('auth_signUp')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
