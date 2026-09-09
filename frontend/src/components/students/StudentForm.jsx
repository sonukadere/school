import { useRef, useState, useEffect, useMemo } from 'react'
import { Camera, Upload, User, KeyRound, Sparkles, Eye, EyeOff } from 'lucide-react'
import Input from '../common/Input'
import Select from '../common/Select'
import Button from '../common/Button'
import {
  SECTION_OPTIONS,
  GENDER_OPTIONS,
} from '../../utils/constants'
import { api } from '../../services/api'

const EMPTY_VALUES = {
  photo: '',
  fullName: '',
  fatherName: '',
  motherName: '',
  gender: 'Male',
  dob: '',
  email: '',
  phone: '',
  address: '',
  className: '',
  section: 'A',
  rollNumber: '',
  admissionDate: new Date().toISOString().slice(0, 10),
  createLoginAccount: true,
  username: '',
  password: 'student123',
}

function PhotoUploader({ value, onChange }) {
  const fileInputRef = useRef(null)

  const handleFile = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {value ? (
          <img
            src={value}
            alt="Student"
            className="h-24 w-24 rounded-full border-4 border-indigo-100 object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-dashed border-slate-300 bg-slate-50 text-slate-400">
            <User size={36} />
          </div>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute right-0 bottom-0 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md transition hover:bg-indigo-700"
          aria-label="Upload photo"
        >
          <Camera size={15} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>
      <Button type="button" variant="outline" size="sm" leftIcon={Upload} onClick={() => fileInputRef.current?.click()}>
        Upload Photo
      </Button>
    </div>
  )
}

function StudentForm({ initialValues = {}, onSubmit, submitting, submitLabel = 'Save Student', classes: propClasses }) {
  const [values, setValues] = useState({ ...EMPTY_VALUES, ...initialValues })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [classes, setClasses] = useState(propClasses || [])
  const [loadingClasses, setLoadingClasses] = useState(!propClasses)

  useEffect(() => {
    if (propClasses && propClasses.length > 0) {
      setClasses(propClasses)
      setLoadingClasses(false)
      return
    }

    let isMounted = true
    setLoadingClasses(true)
    api.getClasses()
      .then((data) => {
        if (isMounted) {
          setClasses(Array.isArray(data) ? data : [])
          setLoadingClasses(false)
        }
      })
      .catch((err) => {
        console.error('Failed to load classes in StudentForm:', err)
        if (isMounted) {
          setClasses([])
          setLoadingClasses(false)
        }
      })
    return () => {
      isMounted = false
    }
  }, [propClasses])

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setValues((prev) => ({
        ...prev,
        ...initialValues,
      }))
    }
  }, [initialValues])

  // Only show dynamic classes that exist in the system (jo class bani ho)
  const classOptions = useMemo(() => {
    const dbClassNames = classes.map((c) => c.name).filter(Boolean)
    const existingName = initialValues?.className
    const allNames = Array.from(new Set([...dbClassNames, ...(existingName ? [existingName] : [])]))

    allNames.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10)
      const numB = parseInt(b.replace(/\D/g, ''), 10)
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB
      return a.localeCompare(b)
    })

    return allNames.map((name) => ({ value: name, label: name }))
  }, [classes, initialValues?.className])

  const sectionOptions = useMemo(() => {
    if (!values.className) return SECTION_OPTIONS
    const matching = classes.filter((c) => c.name === values.className && c.section)
    const uniqueSecs = Array.from(new Set(matching.map((c) => c.section).filter(Boolean)))
    if (uniqueSecs.length > 0) {
      return uniqueSecs.map((sec) => ({ value: sec, label: `Section ${sec}` }))
    }
    return SECTION_OPTIONS
  }, [classes, values.className])

  const handleChange = (event) => {
    const { name, value } = event.target
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10)
      setValues((prev) => ({ ...prev, [name]: digitsOnly }))
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: '' }))
      }
      return
    }
    if (name === 'className') {
      const matching = classes.filter((c) => c.name === value && c.section)
      const uniqueSecs = Array.from(new Set(matching.map((c) => c.section).filter(Boolean)))
      const nextSection =
        uniqueSecs.length > 0 && !uniqueSecs.includes(values.section)
          ? uniqueSecs[0]
          : values.section || (uniqueSecs[0] || 'A')
      setValues((prev) => ({ ...prev, className: value, section: nextSection }))
      if (errors.className) {
        setErrors((prev) => ({ ...prev, className: '' }))
      }
      return
    }
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const nextErrors = {}
    if (!values.fullName?.trim()) {
      nextErrors.fullName = 'Full name is required'
    }
    if (!values.gender) {
      nextErrors.gender = 'Gender is required'
    }
    if (!values.dob) {
      nextErrors.dob = 'Date of birth is required'
    }
    if (!values.className) {
      nextErrors.className = 'Class is required'
    }
    if (!values.section) {
      nextErrors.section = 'Section is required'
    }
    if (!values.phone) {
      nextErrors.phone = 'Phone number is required'
    } else if (values.phone.length !== 10) {
      nextErrors.phone = 'Phone number must be exactly 10 digits'
    }
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = 'Enter a valid email address'
    }
    return nextErrors
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_6px_24px_0_rgba(15,23,42,0.06)]">
        {/* Header with Photo and Main Title */}
        <div className="rounded-t-2xl border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 via-slate-50/30 to-transparent p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
          <PhotoUploader value={values.photo} onChange={(photo) => setValues((prev) => ({ ...prev, photo }))} />
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Student Profile Setup</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              Upload a clear profile photo and fill in personal, contact, and academic details for admission and records.
            </p>
          </div>
        </div>

        {/* Section 1: Basic Information */}
        <div className="p-4 sm:p-6 lg:p-8 border-b border-slate-100 space-y-4">
          <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-600"></span> 1. Basic Information
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Full Name" name="fullName" value={values.fullName} onChange={handleChange} error={errors.fullName} required placeholder="e.g. Aarav Sharma" />
            <Input label="Student ID" name="studentId" value={values.studentId || (values.id && values.id.startsWith('STU') ? values.id : '')} onChange={handleChange} disabled helper="Format: STU-YYYY-XXX (Auto-generated by system)" placeholder="e.g. STU-2026-001" />
            <Select label="Gender" name="gender" value={values.gender} onChange={handleChange} error={errors.gender} required options={GENDER_OPTIONS} placeholder="Select gender" />
            <Input label="Father Name" name="fatherName" value={values.fatherName} onChange={handleChange} placeholder="Enter father's name" />
            <Input label="Mother Name" name="motherName" value={values.motherName} onChange={handleChange} placeholder="Enter mother's name" />
            <Input label="Date of Birth" type="date" name="dob" value={values.dob} onChange={handleChange} error={errors.dob} required />
            <Input label="Roll Number" type="number" name="rollNumber" value={values.rollNumber} onChange={handleChange} error={errors.rollNumber} required placeholder="e.g. 1" />
            <Input label="Admission Date" type="date" name="admissionDate" value={values.admissionDate} onChange={handleChange} error={errors.admissionDate} required />
          </div>
        </div>

        {/* Section 2: Contact Information */}
        <div className="p-4 sm:p-6 lg:p-8 border-b border-slate-100 space-y-4">
          <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-600"></span> 2. Contact & Address
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Email Address" type="email" name="email" value={values.email} onChange={handleChange} error={errors.email} placeholder="student@example.test (optional)" />
            <Input
              label="Phone Number"
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={values.phone}
              onChange={handleChange}
              error={errors.phone}
              required
              placeholder="9000000001"
            />
            <Input label="Residential Address" name="address" value={values.address} onChange={handleChange} placeholder="City, State" />
          </div>
        </div>

        {/* Section 3: Class & Section */}
        <div className="p-4 sm:p-6 lg:p-8 border-b border-slate-100 space-y-4">
          <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-600"></span> 3. Academic Allocation
          </h4>
          <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Select
              label="Class"
              id="className"
              name="className"
              value={values.className}
              onChange={handleChange}
              error={errors.className}
              required
              options={classOptions}
              placeholder={
                loadingClasses
                  ? 'Loading classes...'
                  : classOptions.length === 0
                    ? 'No classes found (Create class first)'
                    : 'Select class'
              }
            />
            <Select
              label="Section"
              id="section"
              name="section"
              value={values.section}
              onChange={handleChange}
              error={errors.section}
              required
              options={sectionOptions}
              placeholder="Select section"
            />
          </div>
          {classOptions.length === 0 && !loadingClasses && (
            <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              ⚠️ No classes have been created yet. Please go to <span className="font-semibold">Classes → Add Class</span> to create a class before admitting students.
            </p>
          )}
        </div>

        {/* Section 4: Student Portal Login Account */}
        <div className="p-4 sm:p-6 lg:p-8 space-y-4 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold tracking-wider text-indigo-900 uppercase flex items-center gap-2">
                <KeyRound size={16} className="text-indigo-600" />
                4. Student Portal Login Account
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure student authentication so the student can log in to view attendance, results, timetable, and fees.
              </p>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <input
                type="checkbox"
                name="createLoginAccount"
                checked={values.createLoginAccount}
                onChange={(e) => setValues((prev) => ({ ...prev, createLoginAccount: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Create Student Login Account
            </label>
          </div>

          {values.createLoginAccount && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 pt-2">
              <Input
                label="Student Login ID / Username"
                name="username"
                value={values.username}
                onChange={handleChange}
                placeholder="Leave blank to use Student ID"
                helper="Student can also log in using their assigned Student ID (e.g. STU-2026-0001)"
              />
              <div className="relative">
                <Input
                  label="Portal Password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={values.password}
                  onChange={handleChange}
                  placeholder="student123"
                  helper="Default: student123"
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-[38px] right-3 text-slate-400 hover:text-slate-600"
                  aria-label="Toggle password"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="flex items-end pb-5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  leftIcon={Sparkles}
                  onClick={() => {
                    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$'
                    let generated = ''
                    for (let i = 0; i < 9; i++) {
                      generated += chars.charAt(Math.floor(Math.random() * chars.length))
                    }
                    setValues((prev) => ({ ...prev, password: generated }))
                  }}
                  className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                >
                  Generate Strong Password
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Integrated Action Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-3.5 sm:px-6 sm:py-4 rounded-b-2xl">
          <Button type="button" variant="outline" onClick={() => window.history.back()} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}

export default StudentForm
