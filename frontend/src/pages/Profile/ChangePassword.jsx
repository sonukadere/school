import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, KeyRound, Eye, EyeOff } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { ADMIN_USER } from '../../utils/constants'

function ChangePassword() {
  const { logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [values, setValues] = useState({ current: '', newPassword: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [show, setShow] = useState({ current: false, newPassword: false, confirm: false })
  const [submitting, setSubmitting] = useState(false)

  const toggleShow = (field) => {
    setShow((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!values.current) nextErrors.current = 'Current password is required'
    else if (values.current !== ADMIN_USER.password) nextErrors.current = 'Current password is incorrect'
    if (!values.newPassword) nextErrors.newPassword = 'New password is required'
    else if (values.newPassword.length < 6) nextErrors.newPassword = 'Password must be at least 6 characters'
    if (!values.confirm) nextErrors.confirm = 'Confirm your new password'
    else if (values.newPassword !== values.confirm) nextErrors.confirm = 'Passwords do not match'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 700))
    setSubmitting(false)
    showToast('Password changed successfully. Please sign in again.', 'success')
    logout()
    navigate('/login')
  }

  const renderPasswordInput = (name, label, placeholder) => (
    <div className="relative">
      <Input
        label={label}
        type={show[name] ? 'text' : 'password'}
        name={name}
        value={values[name]}
        onChange={handleChange}
        error={errors[name]}
        required
        placeholder={placeholder}
        autoComplete="off"
        className="pr-11"
      />
      <button
        type="button"
        onClick={() => toggleShow(name)}
        className="absolute top-[38px] right-3 text-slate-400 transition hover:text-slate-600"
        aria-label={`${show[name] ? 'Hide' : 'Show'} ${label}`}
      >
        {show[name] ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Change Password"
        description="Update the password for your account"
        breadcrumb={[
          { label: 'Profile', href: '/profile' },
          { label: 'Change Password' },
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
            Password Details
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {renderPasswordInput('current', 'Current Password', 'Enter current password')}
            {renderPasswordInput('newPassword', 'New Password', 'Enter new password (min 6 characters)')}
            {renderPasswordInput('confirm', 'Confirm New Password', 'Re-enter new password')}
          </div>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => navigate('/profile')}>Cancel</Button>
            <Button type="submit" loading={submitting} leftIcon={KeyRound}>Update Password</Button>
          </div>
        </Card>
      </form>
    </div>
  )
}

export default ChangePassword
