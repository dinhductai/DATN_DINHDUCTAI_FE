import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Checkbox } from './ui/checkbox'
import { Eye, EyeOff, X } from 'lucide-react'
import { login, forgotPassword } from '../services/authService'
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
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [forgotEmailError, setForgotEmailError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email.trim())) {
      setError(t('auth_emailInvalidFormat'))
      return
    }

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setForgotEmailError('')
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(forgotEmail.trim())) {
      setForgotEmailError(t('auth_emailInvalidFormat'))
      return
    }
    setForgotStatus('sending')
    setError('')

    try {
      await forgotPassword(forgotEmail)
      setForgotStatus('success')
    } catch (err) {
      setForgotStatus('error')
    }
  }

  const openForgotPassword = () => {
    setShowForgotPassword(true)
    setForgotStatus('idle')
    setForgotEmail('')
    setForgotEmailError('')
    setError('')
  }

  const closeForgotPassword = () => {
    setShowForgotPassword(false)
    setForgotStatus('idle')
    setForgotEmail('')
    setForgotEmailError('')
    setError('')
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
                onClick={openForgotPassword}
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

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">{t('auth_forgotPasswordTitle')}</h2>
              <button
                onClick={closeForgotPassword}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {forgotStatus === 'success' ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('auth_forgotPasswordSuccess')}</h3>
                  <p className="text-gray-500 mb-4">{t('auth_forgotPasswordBack')}</p>
                  <Button
                    onClick={closeForgotPassword}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {t('auth_loginBtn')}
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 mb-6 text-center">
                    {t('auth_forgotPasswordDesc')}
                  </p>

                  {forgotStatus === 'error' && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                      {t('auth_forgotPasswordError')}
                    </div>
                  )}

                  {forgotEmailError && (
                    <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                      {forgotEmailError}
                    </div>
                  )}

                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="forgotEmail">{t('auth_email')}</Label>
                      <Input
                        id="forgotEmail"
                        type="email"
                        placeholder={t('auth_forgotPasswordEmailPlaceholder')}
                        value={forgotEmail}
                        onChange={(e) => {
                          setForgotEmail(e.target.value)
                          setForgotEmailError('')
                          setForgotStatus('idle')
                        }}
                        className="h-12 bg-gray-50 border-gray-200"
                        required
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        onClick={closeForgotPassword}
                        className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700"
                      >
                        {t('common_cancel')}
                      </Button>
                      <Button
                        type="submit"
                        disabled={forgotStatus === 'sending'}
                        className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                      >
                        {forgotStatus === 'sending' ? t('auth_forgotPasswordSending') : t('auth_forgotPasswordBtn')}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
