import { useState, useEffect } from 'react'
import { Link, Navigate, useSearchParams, useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft, Send, KeyRound, CheckCircle } from 'lucide-react'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { useToast } from '../../context/ToastContext'
import { apiClient } from '../../services/apiClient'

function ForgotPassword() {
  const { isAuthenticated } = useAuth()
  const { settings } = useSettings()
  const { showToast } = useToast()
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
      setError('Email is required')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await apiClient.post('/auth/forgot-password', { email })
      setSubmitting(false)
      showToast(res.message || 'Reset link generated successfully.', 'success')
      if (res.data?.resetToken) {
        setResetToken(res.data.resetToken)
      }
      setStep('reset')
    } catch (err) {
      setSubmitting(false)
      setError(err.message || 'Failed to process request.')
      showToast(err.message || 'Failed to process request.', 'error')
    }
  }

  const handleResetSubmit = async (event) => {
    event.preventDefault()
    if (!resetToken.trim()) {
      setError('Reset token is required.')
      return
    }
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
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
      showToast(res.message || 'Password reset successfully! Please log in.', 'success')
      setStep('success')
    } catch (err) {
      setSubmitting(false)
      setError(err.message || 'Failed to reset password.')
      showToast(err.message || 'Failed to reset password.', 'error')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-4">
      <div className="animate-fade-in w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <img
            src={settings?.schoolLogo || '/logo.svg'}
            alt={`${schoolName} logo`}
            className="h-16 w-16 rounded-2xl object-cover shadow-lg"
          />
          <h1 className="mt-4 text-2xl font-bold text-white">{schoolName}</h1>
          <p className="mt-1 text-sm text-indigo-200">School Management System</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <Link
            to="/login"
            className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-indigo-600"
          >
            <ArrowLeft size={16} /> Back to login
          </Link>

          {submitted ? (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <Mail size={28} className="text-emerald-600" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">Check your inbox</h2>
              <p className="mt-2 text-sm text-slate-500">
                We have sent a password reset link to <strong>{email}</strong>. Please check your
                email and follow the instructions to reset your password.
              </p>
              <Link to="/login" className="mt-6 block">
                <Button variant="outline" className="w-full">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-900">Forgot your password?</h2>
              <p className="mt-1 text-sm text-slate-500">
                Enter your registered email address and we will send you a link to reset your
                password.
              </p>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@school.com"
                  icon={Mail}
                  error={error}
                />
                <Button type="submit" size="lg" loading={submitting} className="w-full">
                  <Send size={16} /> Send Reset Link
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
