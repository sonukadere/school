import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { GraduationCap, Eye, EyeOff, LogIn, Info } from 'lucide-react'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'
import { useSettings } from '../../context/SettingsContext'
import { useToast } from '../../context/ToastContext'
import { PARENT_USER } from '../../utils/constants'

function Login() {
  const { login, isAuthenticated } = useAuth()
  const { settings } = useSettings()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const schoolName = settings?.schoolName || 'Daily Day Academy'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const validate = () => {
    const nextErrors = {}
    if (!email.trim()) nextErrors.email = 'Email or ID is required'
    if (!password) nextErrors.password = 'Password is required'
    return nextErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSubmitting(true)
    const result = await login(email, password)
    setSubmitting(false)
    if (result.ok) {
      showToast('Logged in successfully', 'success')
      navigate('/dashboard')
    } else {
      showToast(result.error, 'error')
      setErrors({ form: result.error })
    }
  }

  return (
    <div className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-3 sm:p-4">
      <div className="animate-fade-in w-full max-w-md my-4">
        <div className="mb-6 sm:mb-8 flex flex-col items-center text-center">
          <img
            src={settings?.schoolLogo || '/logo.svg'}
            alt={`${schoolName} logo`}
            className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl object-cover shadow-lg"
          />
          <h1 className="mt-3 sm:mt-4 text-xl sm:text-2xl font-bold text-white">{schoolName}</h1>
          <p className="mt-1 text-xs sm:text-sm text-indigo-200">School Management System</p>
        </div>

        <div className="rounded-2xl bg-white p-5 sm:p-8 shadow-2xl">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Sign in to your account</h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <Input
              label="Email Address / ID"
              type="text"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@school.com or STU-2026-001"
              icon={GraduationCap}
              error={errors.email}
              autoComplete="username"
            />
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                icon={LogIn}
                error={errors.password}
                autoComplete="current-password"
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute top-[38px] right-3 text-slate-400 transition hover:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" size="lg" loading={submitting} className="w-full">
              Sign In
            </Button>
          </form>

          <div className="mt-6 space-y-2 rounded-xl bg-slate-50 border border-slate-100 p-3 text-xs text-slate-600">
            <p className="font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Info size={14} className="text-indigo-600" />
              Quick Demo Logins (Click to fill):
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setEmail('superadmin@school.com')
                  setPassword('superadmin123')
                  setErrors({})
                }}
                className="rounded-lg bg-white border border-slate-200 px-2 py-1.5 font-semibold text-slate-700 hover:border-purple-500 hover:text-purple-600 transition shadow-xs text-center"
              >
                🌟 Super Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@school.com')
                  setPassword('admin123')
                  setErrors({})
                }}
                className="rounded-lg bg-white border border-slate-200 px-2 py-1.5 font-semibold text-slate-700 hover:border-indigo-500 hover:text-indigo-600 transition shadow-xs text-center"
              >
                👑 Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail(PARENT_USER.email)
                  setPassword(PARENT_USER.password)
                  setErrors({})
                }}
                className="col-span-2 rounded-lg bg-white border border-slate-200 px-2 py-1.5 font-semibold text-slate-700 hover:border-amber-500 hover:text-amber-600 transition shadow-xs text-center"
              >
                👨‍👩‍👧 Parent
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-indigo-200">
          &copy; {new Date().getFullYear()} {schoolName}. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default Login
