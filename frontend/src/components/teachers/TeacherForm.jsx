import { useRef, useState } from 'react'
import { Camera, Upload, User } from 'lucide-react'
import Input from '../common/Input'
import Select from '../common/Select'
import Button from '../common/Button'
import { GENDER_OPTIONS } from '../../utils/constants'

const EMPTY_VALUES = {
  photo: '',
  name: '',
  email: '',
  phone: '',
  subject: '',
  qualification: '',
  salary: '',
  joiningDate: '',
  address: '',
  gender: '',
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
            alt="Teacher"
            className="h-24 w-24 rounded-full border-4 border-emerald-100 object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-dashed border-slate-300 bg-slate-50 text-slate-400">
            <User size={36} />
          </div>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute right-0 bottom-0 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md transition hover:bg-emerald-700"
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

function TeacherForm({ initialValues = {}, onSubmit, submitting, submitLabel = 'Save Teacher' }) {
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
    const required = ['name', 'email', 'phone', 'subject', 'qualification', 'salary', 'joiningDate', 'gender']
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <PhotoUploader value={values.photo} onChange={(photo) => setValues((prev) => ({ ...prev, photo }))} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 border-b border-slate-100 pb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="Full Name" name="name" value={values.name} onChange={handleChange} error={errors.name} required placeholder="Enter teacher name" />
          <Input label="Teacher ID" name="id" value={values.id || ''} onChange={handleChange} disabled helper="Auto-generated" />
          <Select label="Gender" name="gender" value={values.gender} onChange={handleChange} error={errors.gender} required options={GENDER_OPTIONS} placeholder="Select gender" />
          <Input label="Qualification" name="qualification" value={values.qualification} onChange={handleChange} error={errors.qualification} required placeholder="e.g. M.Sc, B.Ed" />
          <Input label="Joining Date" type="date" name="joiningDate" value={values.joiningDate} onChange={handleChange} error={errors.joiningDate} required />
          <Input label="Salary" type="number" name="salary" value={values.salary} onChange={handleChange} error={errors.salary} required placeholder="Monthly salary" />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 border-b border-slate-100 pb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">
          Contact &amp; Professional
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="Email Address" type="email" name="email" value={values.email} onChange={handleChange} error={errors.email} required placeholder="teacher@school.com" />
          <Input label="Phone Number" name="phone" value={values.phone} onChange={handleChange} error={errors.phone} required placeholder="+91 98765 43210" />
          <Input label="Subject" name="subject" value={values.subject} onChange={handleChange} error={errors.subject} required placeholder="e.g. Mathematics" />
          <div className="sm:col-span-2">
            <Input label="Address" name="address" value={values.address} onChange={handleChange} placeholder="Enter address" />
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

export default TeacherForm
