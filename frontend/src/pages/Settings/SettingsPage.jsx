import { useRef, useState } from 'react'
import { Camera, Save, RotateCcw, Building2 } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { useSettings } from '../../context/SettingsContext'
import { useToast } from '../../context/ToastContext'

function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings()
  const { showToast } = useToast()
  const fileInputRef = useRef(null)

  const [values, setValues] = useState({
    schoolName: settings.schoolName,
    address: settings.address,
    contactNumber: settings.contactNumber,
    email: settings.email,
    academicYear: settings.academicYear,
    currency: settings.currency,
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleLogo = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => updateSettings({ schoolLogo: reader.result })
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!values.schoolName.trim()) nextErrors.schoolName = 'School name is required'
    if (!values.email.trim()) nextErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) nextErrors.email = 'Enter a valid email'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    updateSettings(values)
    setSubmitting(false)
    showToast('Settings saved successfully', 'success')
  }

  const handleReset = () => {
    resetSettings()
    setValues({
      schoolName: settings.schoolName,
      address: settings.address,
      contactNumber: settings.contactNumber,
      email: settings.email,
      academicYear: settings.academicYear,
      currency: settings.currency,
    })
    showToast('Settings reset to defaults', 'info')
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure your school information"
        breadcrumb={[{ label: 'Settings' }]}
        actions={
          <Button variant="outline" leftIcon={RotateCcw} onClick={handleReset}>
            Reset
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="School Logo" className="max-w-2xl">
          <div className="flex items-center gap-6">
            <div className="relative">
              {settings.schoolLogo ? (
                <img src={settings.schoolLogo} alt="School logo" className="h-24 w-24 rounded-2xl object-cover shadow-md" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
                  <Building2 size={40} />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-0 bottom-0 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md transition hover:bg-indigo-700"
                aria-label="Upload logo"
              >
                <Camera size={15} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{settings.schoolName}</p>
              <p className="mt-1 text-sm text-slate-500">Upload a square image for the best result.</p>
              {settings.schoolLogo && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => updateSettings({ schoolLogo: '' })}
                >
                  Remove logo
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card title="School Information" className="max-w-2xl">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input label="School Name" name="schoolName" value={values.schoolName} onChange={handleChange} error={errors.schoolName} required placeholder="Enter school name" />
            </div>
            <div className="sm:col-span-2">
              <Input label="Address" name="address" value={values.address} onChange={handleChange} placeholder="Enter school address" />
            </div>
            <Input label="Contact Number" name="contactNumber" value={values.contactNumber} onChange={handleChange} placeholder="+91 98765 43210" />
            <Input label="Email" type="email" name="email" value={values.email} onChange={handleChange} error={errors.email} required placeholder="info@school.com" />
            <Input label="Academic Year" name="academicYear" value={values.academicYear} onChange={handleChange} placeholder="2026-2027" />
            <Input label="Currency Symbol" name="currency" value={values.currency} onChange={handleChange} placeholder="$" />
          </div>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="submit" loading={submitting} leftIcon={Save}>Save Settings</Button>
          </div>
        </Card>
      </form>
    </div>
  )
}

export default SettingsPage
