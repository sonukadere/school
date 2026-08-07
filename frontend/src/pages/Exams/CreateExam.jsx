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
import { CLASS_OPTIONS, EXAM_TYPE_OPTIONS } from '../../utils/constants'
import { todayISO } from '../../utils/helpers'

function CreateExam() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [values, setValues] = useState({
    name: '',
    className: '',
    subject: '',
    date: todayISO(),
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
    ;['name', 'className', 'subject', 'date'].forEach((field) => {
      if (!values[field]) nextErrors[field] = 'This field is required'
    })
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSubmitting(true)
    await api.addExam(values)
    setSubmitting(false)
    showToast('Exam created successfully', 'success')
    navigate('/exams')
  }

  return (
    <div>
      <PageHeader
        title="Create Exam"
        description="Schedule a new examination"
        breadcrumb={[
          { label: 'Exams', href: '/exams' },
          { label: 'Create Exam' },
        ]}
        actions={
          <Link to="/exams">
            <Button variant="outline" leftIcon={ArrowLeft}>Back to Exams</Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit}>
        <Card className="max-w-2xl">
          <h3 className="mb-4 border-b border-slate-100 pb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">
            Exam Details
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select label="Exam Name" name="name" value={values.name} onChange={handleChange} error={errors.name} required options={EXAM_TYPE_OPTIONS} placeholder="Select exam type" />
            <Select label="Class" name="className" value={values.className} onChange={handleChange} error={errors.className} required options={CLASS_OPTIONS} placeholder="Select class" />
            <Input label="Subject" name="subject" value={values.subject} onChange={handleChange} error={errors.subject} required placeholder="e.g. Mathematics" />
            <Input label="Date" type="date" name="date" value={values.date} onChange={handleChange} error={errors.date} required />
          </div>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => navigate('/exams')}>Cancel</Button>
            <Button type="submit" loading={submitting}>Create Exam</Button>
          </div>
        </Card>
      </form>
    </div>
  )
}

export default CreateExam
