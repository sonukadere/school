import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

function EditProfile() {
  const { user, updateProfile } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [values, setValues] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!values.name.trim()) nextErrors.name = 'Full name is required'
    if (!values.email.trim()) nextErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) nextErrors.email = 'Enter a valid email'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    updateProfile(values)
    setSubmitting(false)
    showToast('Profile updated successfully', 'success')
    navigate('/profile')
  }

  return (
    <div>
      <PageHeader
        title="Edit Profile"
        description="Update your personal information"
        breadcrumb={[
          { label: 'Profile', href: '/profile' },
          { label: 'Edit Profile' },
        ]}
        actions={
          <Link to="/profile">
            <Button variant="outline" leftIcon={ArrowLeft}>Back to Profile</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl">
          <h3 className="mb-4 border-b border-slate-100 pb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">
            Personal Details
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Full Name" name="name" value={values.name} onChange={handleChange} error={errors.name} required placeholder="Enter your name" />
            <Input label="Email Address" type="email" name="email" value={values.email} onChange={handleChange} error={errors.email} required placeholder="you@school.com" />
            <Input label="Phone Number" name="phone" value={values.phone} onChange={handleChange} placeholder="+91 98765 43210" />
            <div className="sm:col-span-2">
              <Input label="Address" name="address" value={values.address} onChange={handleChange} placeholder="Enter your address" />
            </div>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => navigate('/profile')}>Cancel</Button>
            <Button type="submit" loading={submitting} leftIcon={Save}>Save Changes</Button>
          </div>
        </Card>
      </form>
    </div>
  )
}

export default EditProfile
