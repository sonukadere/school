import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Mail, ArrowLeft, Send } from 'lucide-react'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

function ForgotPassword() {
  const { isAuthenticated } = useAuth()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email')
      return
    }
    setError('')
    setSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setSubmitting(false)
    setSubmitted(true)
    showToast('Reset link sent to your email', 'success')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-4">
      <div className="animate-fade-in w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/logo.svg" alt="EduManage logo" className="h-16 w-16 rounded-2xl shadow-lg" />
          <h1 className="mt-4 text-2xl font-bold text-white">EduManage High School</h1>
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
