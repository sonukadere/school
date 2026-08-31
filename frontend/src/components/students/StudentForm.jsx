import { useRef, useState } from 'react'
import { Camera, Upload, User } from 'lucide-react'
import Input from '../common/Input'
import Select from '../common/Select'
import Button from '../common/Button'
import {
  CLASS_OPTIONS,
  SECTION_OPTIONS,
  GENDER_OPTIONS,
} from '../../utils/constants'

const EMPTY_VALUES = {
  photo: '',
  fullName: '',
  fatherName: '',
  motherName: '',
  gender: '',
  dob: '',
  email: '',
  phone: '',
  address: '',
  className: '',
  section: '',
  rollNumber: '',
  admissionDate: '',
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

function StudentForm({ initialValues = {}, onSubmit, submitting, submitLabel = 'Save Student' }) {
  const [values, setValues] = useState({ ...EMPTY_VALUES, ...initialValues })
  const [errors, setErrors] = useState({})

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const nextErrors = {}
    const required = [
      'fullName',
      'gender',
      'dob',
      'email',
      'phone',
      'className',
      'section',
      'rollNumber',
      'admissionDate',
    ]
    required.forEach((field) => {
      if (!values[field]) nextErrors[field] = 'This field is required'
    })
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      nextErrors.email = 'Enter a valid email'
    }
    if (values.phone && !/^[+\d][\d\s-]{7,14}$/.test(values.phone)) {
      nextErrors.phone = 'Enter a valid phone number'
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
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_6px_24px_0_rgba(15,23,42,0.06)]">
        {/* Header with Photo and Main Title */}
        <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 via-slate-50/30 to-transparent p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
          <PhotoUploader value={values.photo} onChange={(photo) => setValues((prev) => ({ ...prev, photo }))} />
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Student Profile Setup</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md">
              Upload a clear profile photo and fill in personal, contact, and academic details for admission and records.
            </p>
          </div>
        </div>

        {/* Section 1: Basic Information */}
        <div className="p-6 sm:p-8 border-b border-slate-100 space-y-4">
          <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-600"></span> 1. Basic Information
          </h4>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Full Name" name="fullName" value={values.fullName} onChange={handleChange} error={errors.fullName} required placeholder="e.g. Aarav Sharma" />
            <Input label="Student ID" name="id" value={values.id || ''} onChange={handleChange} disabled helper="Auto-generated by system" />
            <Select label="Gender" name="gender" value={values.gender} onChange={handleChange} error={errors.gender} required options={GENDER_OPTIONS} placeholder="Select gender" />
            <Input label="Father Name" name="fatherName" value={values.fatherName} onChange={handleChange} placeholder="Enter father's name" />
            <Input label="Mother Name" name="motherName" value={values.motherName} onChange={handleChange} placeholder="Enter mother's name" />
            <Input label="Date of Birth" type="date" name="dob" value={values.dob} onChange={handleChange} error={errors.dob} required />
            <Input label="Roll Number" type="number" name="rollNumber" value={values.rollNumber} onChange={handleChange} error={errors.rollNumber} required placeholder="e.g. 1" />
            <Input label="Admission Date" type="date" name="admissionDate" value={values.admissionDate} onChange={handleChange} error={errors.admissionDate} required />
          </div>
        </div>

        {/* Section 2: Contact Information */}
        <div className="p-6 sm:p-8 border-b border-slate-100 space-y-4">
          <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-600"></span> 2. Contact & Address
          </h4>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Email Address" type="email" name="email" value={values.email} onChange={handleChange} error={errors.email} required placeholder="student@example.test" />
            <Input label="Phone Number" name="phone" value={values.phone} onChange={handleChange} error={errors.phone} required placeholder="9000000001" />
            <Input label="Residential Address" name="address" value={values.address} onChange={handleChange} placeholder="City, State" />
          </div>
        </div>

        {/* Section 3: Class & Section */}
        <div className="p-6 sm:p-8 space-y-4">
          <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-indigo-600"></span> 3. Academic Allocation
          </h4>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Select label="Class" name="className" value={values.className} onChange={handleChange} error={errors.className} required options={CLASS_OPTIONS} placeholder="Select class" />
            <Select label="Section" name="section" value={values.section} onChange={handleChange} error={errors.section} required options={SECTION_OPTIONS} placeholder="Select section" />
          </div>
        </div>

        {/* Integrated Action Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-6 py-4">
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
