import { useState, useEffect } from 'react'
import { Link, Navigate, useSearchParams, useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft, Send, KeyRound, CheckCircle } from 'lucide-react'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { useToast } from '../../context/ToastContext'
import { useTranslation } from '../../i18n'
import { apiClient } from '../../services/apiClient'

function ForgotPassword() {
  const { isAuthenticated } = useAuth()
  const { settings } = useSettings()
  const { showToast } = useToast()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const urlToken = searchParams.get('token')

  const schoolName = settings?.schoolName || 'Daily Day Academy'
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState(urlToken || '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [step, setStep] = useState(urlToken ? 'reset' : 'forgot')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (urlToken) {
      setResetToken(urlToken)
      setStep('reset')
    }
  }, [urlToken])

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const handleForgotSubmit = async (event) => {
    event.preventDefault()
    if (!email.trim()) {
      setError(t('Email is required'))
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('Enter a valid email address'))
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await apiClient.post('/auth/forgot-password', { email })
      setSubmitting(false)
      showToast(res.message || t('Reset link generated successfully.'), 'success')
      if (res.data?.resetToken) {
        setResetToken(res.data.resetToken)
      }
      setStep('reset')
    } catch (err) {
      setSubmitting(false)
      setError(err.message || t('Failed to process request.'))
      showToast(err.message || t('Failed to process request.'), 'error')
    }
  }

  const handleResetSubmit = async (event) => {
    event.preventDefault()
    if (!resetToken.trim()) {
      setError(t('Reset token is required.'))
      return
    }
    if (!newPassword || newPassword.length < 6) {
      setError(t('Password must be at least 6 characters.'))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t('Passwords do not match.'))
      return
    }

    setError('')
    setSubmitting(true)
    try {
      const res = await apiClient.post('/auth/reset-password', {
        token: resetToken.trim(),
        password: newPassword,
      })
      setSubmitting(false)
      showToast(res.message || t('Password reset successfully! Please log in.'), 'success')
      setStep('success')
    } catch (err) {
      setSubmitting(false)
      setError(err.message || t('Failed to reset password.'))
      showToast(err.message || t('Failed to reset password.'), 'error')
    }
  }

  return (
    <div className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-4 py-8">
      <div className="animate-fade-in w-full max-w-md">
        <div className="mb-6 sm:mb-8 flex flex-col items-center text-center">
          <img
            src={settings?.schoolLogo || '/logo.svg'}
            alt={`${schoolName} logo`}
            className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl object-cover shadow-lg"
          />
          <h1 className="mt-3 sm:mt-4 text-xl sm:text-2xl font-bold text-white">{schoolName}</h1>
          <p className="mt-1 text-xs sm:text-sm text-indigo-200">{t('School Management System')}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 sm:p-8 shadow-2xl">
          <Link
            to="/login"
            className="mb-4 sm:mb-5 inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-500 transition hover:text-indigo-600"
          >
            <ArrowLeft size={16} /> {t('Back to login')}
          </Link>

          {step === 'success' ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle size={28} className="text-emerald-600" />
              </div>
              <h2 className="mt-4 text-lg sm:text-xl font-bold text-slate-900">{t('Password Reset Successful!')}</h2>
              <p className="mt-2 text-xs sm:text-sm text-slate-500">
                {t('Your password has been changed successfully. You can now sign in with your new password.')}
              </p>
              <Link to="/login" className="mt-6 block">
                <Button variant="primary" className="w-full">
                  {t('Return to Sign In')}
                </Button>
              </Link>
            </div>
          ) : step === 'reset' ? (
            <>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">{t('Set New Password')}</h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                {t('Enter your reset token and your new account password.')}
              </p>
              <form onSubmit={handleResetSubmit} className="mt-5 space-y-4" noValidate>
                <Input
                  label={t('Reset Token')}
                  type="text"
                  value={resetToken}
                  onChange={(event) => setResetToken(event.target.value)}
                  placeholder={t('Paste reset token here')}
                  icon={KeyRound}
                  required
                />
                <Input
                  label={t('New Password')}
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder={t('Minimum 6 characters')}
                  required
                />
                <Input
                  label={t('Confirm Password')}
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder={t('Re-enter new password')}
                  required
                />
                {error && <p className="text-xs text-rose-500">{error}</p>}
                <Button type="submit" size="lg" loading={submitting} className="w-full">
                  {t('Reset Password')}
                </Button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">{t('Forgot your password?')}</h2>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                {t('Enter your registered email address and we will send you a link to reset your password.')}
              </p>
              <form onSubmit={handleForgotSubmit} className="mt-5 sm:mt-6 space-y-4" noValidate>
                <Input
                  label={t('Email Address')}
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@school.com"
                  icon={Mail}
                  error={error}
                />
                <Button type="submit" size="lg" loading={submitting} className="w-full">
                  <Send size={16} /> {t('Send Reset Link')}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
