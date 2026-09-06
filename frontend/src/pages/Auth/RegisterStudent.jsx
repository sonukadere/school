import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Copy,
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Users,
} from 'lucide-react'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Button from '../../components/common/Button'
import { useSettings } from '../../context/SettingsContext'
import { useToast } from '../../context/ToastContext'
import { api } from '../../services/api'
import {
  CLASS_OPTIONS,
  SECTION_OPTIONS,
  GENDER_OPTIONS,
} from '../../utils/constants'

function RegisterStudent() {
  const { settings } = useSettings()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const schoolName = settings?.schoolName || 'Daily Day Academy'

  const [formData, setFormData] = useState({
    fullName: '',
    gender: 'Male',
    dob: '',
    email: '',
    phone: '',
    address: '',
    className: 'Class 6',
    section: 'A',
    fatherName: '',
    motherName: '',
    username: '',
    password: '',
    confirmPassword: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [registeredResult, setRegisteredResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const generatePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$'
    let generated = ''
    for (let i = 0; i < 10; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData((prev) => ({
      ...prev,
      password: generated,
      confirmPassword: generated,
    }))
    showToast('Secure password generated!', 'info')
  }

  const validate = () => {
    const nextErrors = {}
    if (!formData.fullName.trim()) nextErrors.fullName = 'Full name is required'
    if (!formData.dob) nextErrors.dob = 'Date of birth is required'
    if (!formData.phone.trim()) nextErrors.phone = 'Contact number is required'
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = 'Enter a valid email address'
    }
    if (!formData.password) {
      nextErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters'
    }
    if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match'
    }
    return nextErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSubmitting(true)
    try {
      const response = await api.registerStudent(formData)
      setSubmitting(false)
      showToast('Registration successful! Welcome to the Academy.', 'success')
      setRegisteredResult(response)
    } catch (err) {
      setSubmitting(false)
      const errorMsg = err.message || 'Failed to complete registration'
      showToast(errorMsg, 'error')
      setErrors({ form: errorMsg })
    }
  }

  const handleCopyCredentials = () => {
    const text = `🎓 Daily Day Academy Student Portal Credentials:
Student Name: ${formData.fullName}
Student ID: ${registeredResult?.student?.studentId || 'Assigned'}
Login ID: ${registeredResult?.credentials?.username || formData.username || registeredResult?.student?.studentId}
Password: ${registeredResult?.credentials?.temporaryPassword || formData.password}
Portal URL: ${window.location.origin}/login`
    navigator.clipboard.writeText(text)
    setCopied(true)
    showToast('Credentials copied to clipboard!', 'success')
    setTimeout(() => setCopied(false), 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header Branding */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-md rounded-2xl shadow-inner mb-3">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{schoolName}</h1>
          <p className="mt-2 text-sm text-indigo-200">Online Student Admission & Portal Registration</p>
        </div>

        {/* Card Container */}
        <div className="rounded-3xl bg-white p-6 sm:p-10 shadow-2xl border border-white/20 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Student Registration Form</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter admission details and set your Login ID & Password for the student portal.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>

          {errors.form && (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Personal Information */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-600"></span> 1. Personal Information
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  error={errors.fullName}
                  required
                  placeholder="e.g. Aryan Sharma"
                />
                <Select
                  label="Gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  options={GENDER_OPTIONS}
                  required
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  error={errors.dob}
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    label="Admission Class"
                    name="className"
                    value={formData.className}
                    onChange={handleChange}
                    options={CLASS_OPTIONS}
                    required
                  />
                  <Select
                    label="Section"
                    name="section"
                    value={formData.section}
                    onChange={handleChange}
                    options={SECTION_OPTIONS}
                    required
                  />
                </div>
              </div>
            </div>

            {/* 2. Contact & Address */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-600"></span> 2. Contact & Guardian Details
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Contact Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  error={errors.phone}
                  required
                  placeholder="e.g. 9876543210"
                  icon={Phone}
                />
                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  placeholder="e.g. student@school.com"
                  icon={Mail}
                />
                <Input
                  label="Father's Name"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleChange}
                  placeholder="Father's full name"
                />
                <Input
                  label="Mother's Name"
                  name="motherName"
                  value={formData.motherName}
                  onChange={handleChange}
                  placeholder="Mother's full name"
                />
                <div className="sm:col-span-2">
                  <Input
                    label="Residential Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="House / Street, City, State, PIN"
                    icon={MapPin}
                  />
                </div>
              </div>
            </div>

            {/* 3. Portal Credentials Setup */}
            <div className="space-y-4 pt-4 border-t border-slate-100 rounded-2xl bg-indigo-50/50 p-5 border border-indigo-100/70">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-2">
                  <KeyRound size={16} className="text-indigo-600" />
                  3. Student Portal Login Credentials
                </h3>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs transition"
                >
                  <Sparkles size={13} className="text-amber-500" /> Auto-Generate Password
                </button>
              </div>
              <p className="text-xs text-indigo-700">
                Create the Login ID (username) and Password you will use to log into your Student Portal. You can also sign in using your assigned Student ID.
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Login ID / Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="e.g. aryan_2026 (or auto-generated from ID)"
                  helper="Leave blank to use auto-assigned Student ID"
                />
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    required
                    placeholder="Minimum 6 characters"
                    className="pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-[38px] right-3 text-slate-400 hover:text-slate-600"
                    aria-label="Toggle password"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Confirm Password"
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                    required
                    placeholder="Re-enter password to confirm"
                  />
                </div>
              </div>
            </div>

            {/* Submission */}
            <div className="pt-2 flex items-center justify-between">
              <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
                Cancel
              </Link>
              <Button type="submit" size="lg" loading={submitting} className="min-w-[180px]">
                Submit Registration
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {registeredResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-4 shadow-inner">
              <CheckCircle2 size={36} />
            </div>

            <h3 className="text-xl font-bold text-slate-900">Registration Successful!</h3>
            <p className="mt-1 text-xs text-slate-500">
              Welcome to Daily Day Academy! Please save your student login credentials.
            </p>

            <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-200/80 p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Student Name:</span>
                <span className="font-semibold text-slate-800">{formData.fullName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Assigned Student ID:</span>
                <span className="font-bold text-indigo-600 font-mono">
                  {registeredResult.student?.studentId || registeredResult.credentials?.studentId || 'Assigned'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-500">Login ID / Username:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {registeredResult.credentials?.username || formData.username || registeredResult.student?.studentId}
                </span>
              </div>
              <div className="flex justify-between pt-0.5">
                <span className="text-slate-500">Password:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {registeredResult.credentials?.temporaryPassword || formData.password}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <Button
                variant="outline"
                leftIcon={Copy}
                onClick={handleCopyCredentials}
                className="w-full"
              >
                {copied ? 'Copied to Clipboard!' : 'Copy Login Credentials'}
              </Button>
              <Button
                variant="primary"
                onClick={() => navigate('/login')}
                className="w-full"
              >
                Proceed to Sign In
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RegisterStudent
