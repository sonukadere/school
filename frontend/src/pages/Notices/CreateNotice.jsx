import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import Select from '../../components/common/Select'
import Button from '../../components/common/Button'
import { api } from '../../services/api'
import { useToast } from '../../context/ToastContext'
import { todayISO } from '../../utils/helpers'

const PRIORITY_OPTIONS = ['High', 'Medium', 'Low']

function CreateNotice() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [values, setValues] = useState({ title: '', description: '', date: todayISO(), priority: 'Medium' })
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
    if (!values.title.trim()) nextErrors.title = 'Title is required'
    if (!values.description.trim()) nextErrors.description = 'Description is required'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSubmitting(true)
    await api.addNotice(values)
    setSubmitting(false)
    showToast('Notice published successfully', 'success')
    navigate('/notices')
  }

  return (
    <div>
      <PageHeader
        title="Create Notice"
        description="Publish a new announcement"
        breadcrumb={[
          { label: 'Notice Board', href: '/notices' },
          { label: 'Create Notice' },
        ]}
        actions={
          <Link to="/notices">
            <Button variant="outline" leftIcon={ArrowLeft}>Back to Notices</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl">
          <h3 className="mb-4 border-b border-slate-100 pb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">
            Notice Details
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input label="Title" name="title" value={values.title} onChange={handleChange} error={errors.title} required placeholder="e.g. Annual Sports Day 2026" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-slate-700">
                Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows="5"
                value={values.description}
                onChange={handleChange}
                placeholder="Write the full notice description..."
                className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 ${errors.description ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-100'}`}
              />
              {errors.description && <p className="mt-1 text-xs font-medium text-rose-600">{errors.description}</p>}
            </div>
            <Input label="Date" type="date" name="date" value={values.date} onChange={handleChange} required />
            <Select label="Priority" name="priority" value={values.priority} onChange={handleChange} options={PRIORITY_OPTIONS} />
          </div>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => navigate('/notices')}>Cancel</Button>
            <Button type="submit" loading={submitting}>Publish Notice</Button>
          </div>
        </Card>
      </form>
    </div>
  )
}

export default CreateNotice
